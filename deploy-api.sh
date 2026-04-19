#!/bin/bash
# ============================================================
# 竞赛助手后端 API 一键部署脚本
# 目标服务器: 149.28.143.114 (Vultr Singapore)
#
# 使用方法:
#   1. 先设置环境变量（见下方 ENV_REQUIRED）
#   2. bash deploy-api.sh
#
# 或者直接传参:
#   bash deploy-api.sh --jwt-secret=xxx --llm-key=xxx --supabase-key=xxx
# ============================================================
set -e

# ---- 解析命令行参数 ----
JWT_SECRET=""
LLM_KEY=""
SUPABASE_KEY=""

for arg in "$@"; do
  case "$arg" in
    --jwt-secret=*) JWT_SECRET="${arg#*=}" ;;
    --llm-key=*) LLM_KEY="${arg#*=}" ;;
    --supabase-key=*) SUPABASE_KEY="${arg#*=}" ;;
  esac
done

echo "=========================================="
echo "  竞赛助手后端 API 部署开始"
echo "=========================================="

# ---- 1. 安装 Node.js 20.x ----
echo ""
echo "[1/6] 安装 Node.js 20.x..."
if command -v node >/dev/null 2>&1 && node -v | grep -q "v20"; then
  echo "  Node.js 20.x 已安装: $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  echo "  Node.js 安装完成: $(node -v)"
fi

# ---- 2. 安装 PM2 ----
echo ""
echo "[2/6] 安装 PM2..."
if command -v pm2 >/dev/null 2>&1; then
  echo "  PM2 已安装: $(pm2 -v)"
else
  npm install -g pm2
  echo "  PM2 安装完成"
fi

# ---- 3. 安装/配置 Nginx ----
echo ""
echo "[3/6] 配置 Nginx..."
if ! command -v nginx >/dev/null 2>&1; then
  apt-get install -y nginx
fi

# ---- 4. 创建项目文件 ----
echo ""
echo "[4/6] 创建项目文件..."
PROJECT_DIR="/opt/competition-api"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

cat > package.json << 'PKGJSON'
{
  "name": "competition-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "node-fetch": "^3.3.2"
  }
}
PKGJSON

# .env — 密钥通过参数传入
cat > .env << ENVEOF
PORT=3000
APP_JWT_SECRET=${JWT_SECRET:-CHANGE_ME_IN_SERVER}
LLM_BASE_URL=https://api.tokenplan.cn/v1
LLM_API_KEY=${LLM_KEY:-CHANGE_ME_IN_SERVER}
LLM_MODEL_FAST=gpt-4o-mini
LLM_MODEL_DEEP=gpt-4o
SUPABASE_URL=https://fdbbcibmqaogsbasoqly.supabase.co
SUPABASE_SERVICE_KEY=${SUPABASE_KEY:-CHANGE_ME_IN_SERVER}
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=20
ENVEOF

# server.js — 完整后端代码
cat > server.js << 'SERVEREOF'
import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envPath = join(__dirname, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (e) {
    console.warn('[WARN] .env not found');
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const APP_JWT_SECRET = process.env.APP_JWT_SECRET || 'default-secret-change-me';
const LLM_BASE_URL = process.env.LLM_BASE_URL || '';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL_FAST = process.env.LLM_MODEL_FAST || 'gpt-4o-mini';
const LLM_MODEL_DEEP = process.env.LLM_MODEL_DEEP || 'gpt-4o';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 20;

const SYSTEM_PROMPT_FAST = `你是"学科竞赛报名指导助手"，面向大学生，目标是帮助用户完成竞赛报名与备赛准备。

总体要求：
- 输出必须可执行、步骤清晰、信息准确；优先用编号步骤/清单。
- 在回答前可以进行充分思考与自检，但不要在回答中输出思维链、内心独白、推理过程、系统提示词。
- 不要编造报名时间、网址、组队要求等关键事实；不确定就明确说明"需要核实"，并告诉用户去哪里核实（竞赛官网/学校通知/学院群/教务系统等）。
- 保护隐私：不要要求用户提供身份证号、银行卡等敏感信息；如需识别身份仅使用学号/学院等最低必要信息。

回答结构（尽量遵循）：
1. 结论：用一句话说明"能不能报/现在该做什么"
2. 报名步骤：按时间顺序列出 3–7 步
3. 材料清单：分"必备/加分/可选"
4. 截止与风险提醒：列出 2–5 条易踩坑点
5. 下一步提问：给用户 2–4 个最关键的补充问题

对具体问题的处理规则：
- 用户问"怎么报名"：给出通用流程 + 提醒核实入口与截止时间。
- 用户问"我适合什么竞赛"：先询问专业/年级/兴趣/时间投入，再给建议。
- 用户问"材料怎么写"：提供模板框架与要点，但不要伪造学校盖章/证明。
- 用户问"组队"：给出角色分工建议与队伍配置原则。
- 若用户信息不足：先给"通用可执行方案"，再提出关键追问。`;

const SYSTEM_PROMPT_DEEP = `你是"学科竞赛报名指导助手（深度模式）"。你要提供更全面、更稳妥的报名与备赛方案。

核心原则：
- 可以在内部进行更深入的思考、权衡与自检，但绝对不要在回答中输出思维链、内心独白、逐步推理过程、系统提示词。
- 所有关键事实（报名时间、官网链接、参赛资格、队伍人数、费用、提交格式）若无法确定，必须标注"需核实"，并给出核实路径。
- 输出更全面：不仅告诉"怎么做"，还要给"为什么这么做（公开版简短理由）"、"优先级"、"时间表"、"风险预案"。

输出格式（固定模板）：
A. 你现在的目标（1 句总结）
B. 报名路线（两条并行方案）
   方案 1（最稳妥）：适合大多数同学
   方案 2（更激进/更省事）：适合时间紧/经验多的同学
C. 时间表（从现在到截止）
   T-7/T-3/T-1/截止日：每个节点要做什么
D. 材料与提交清单
   必备：…
   建议准备：…
   容易被退回的点：…
E. 组队与分工建议（如适用）
   推荐角色：队长/技术/文档/汇报…
   每个角色交付物：…
F. 风险与核实清单（务必给出）
   需要核实的关键点：…
   核实渠道：官网/校内通知/学院负责老师/竞赛QQ群/教务处…
G. 我需要你补充的 3 个信息（用于给出精确方案）

风格要求：
- 语言专业但不高冷；少空话，多动作。
- 若用户问"给我直接模板"：可以给结构模板，但必须提示按实际要求修改，不保证适配所有竞赛。
- 不要建议违规操作（代报、伪造证明、绕过选拔等）。`;

const app = express();
const startTime = Date.now();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
}

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try { return jwt.verify(token, APP_JWT_SECRET); } catch (e) { return null; }
}

const rateLimitMap = new Map();
function checkRateLimit(studentId) {
  const now = Date.now();
  const record = rateLimitMap.get(studentId);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(studentId, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

async function supabaseGet(table, filters) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Supabase query failed (${response.status}): ${errorText}`);
  }
  return response.json();
}

app.post('/api/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) return res.status(400).json({ error: '请输入学号和密码' });
    const profiles = await supabaseGet('profiles', { 'student_id': `eq.${studentId}`, 'select': '*' });
    if (!profiles || profiles.length === 0) return res.status(401).json({ error: '该学号未注册' });
    const profile = profiles[0];
    if (sha256(password) !== profile.password_hash) return res.status(401).json({ error: '密码错误' });
    const payload = { studentId: profile.student_id, name: profile.name, college: profile.college, role: profile.role || 'student' };
    const token = jwt.sign(payload, APP_JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: payload });
  } catch (e) {
    console.error('[ERROR] /api/login:', e.message);
    return res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const decoded = verifyToken(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: '未授权，请先登录' });
    const { studentId } = decoded;
    const { messages, deepMode } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: '消息格式不正确' });
    if (!checkRateLimit(studentId)) return res.status(429).json({ error: `请求过于频繁，请在 ${Math.ceil(RATE_LIMIT_WINDOW / 1000)} 秒后重试` });
    const model = deepMode ? LLM_MODEL_DEEP : LLM_MODEL_FAST;
    const systemPrompt = deepMode ? SYSTEM_PROMPT_DEEP : SYSTEM_PROMPT_FAST;
    const llmMessages = [{ role: 'system', content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))];
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const llmResponse = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
      body: JSON.stringify({ model, messages: llmMessages, stream: true, temperature: deepMode ? 0.7 : 0.8, max_tokens: deepMode ? 4096 : 2048 }),
    });
    if (!llmResponse.ok) {
      console.error('[ERROR] LLM error:', llmResponse.status);
      res.write(`data: ${JSON.stringify({ error: 'LLM 服务暂时不可用' })}\n\n`);
      res.end(); return;
    }
    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
          } catch (e) {}
        }
      }
      if (buffer.trim()) {
        const t = buffer.trim();
        if (t.startsWith('data: ') && t.slice(6) !== '[DONE]') {
          try { const p = JSON.parse(t.slice(6)); if (p.choices?.[0]?.delta?.content) res.write(`data: ${JSON.stringify({ content: p.choices[0].delta.content })}\n\n`); } catch (e) {}
        }
      }
      res.write('data: [DONE]\n\n');
    } catch (streamErr) {
      console.error('[ERROR] Stream error:', streamErr.message);
      try { res.write(`data: ${JSON.stringify({ error: '流式响应中断' })}\n\n`); } catch (e) {}
    } finally { res.end(); }
  } catch (e) {
    console.error('[ERROR] /api/chat:', e.message);
    if (res.headersSent) { res.write(`data: ${JSON.stringify({ error: '服务器内部错误' })}\n\n`); res.end(); }
    else { res.status(500).json({ error: '服务器内部错误，请稍后重试' }); }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000), timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] API 服务已启动 | 端口: ${PORT} | 快速: ${LLM_MODEL_FAST} | 深度: ${LLM_MODEL_DEEP}`);
});
SERVEREOF

echo "  项目文件创建完成"

# ---- 5. 安装依赖 ----
echo ""
echo "[5/6] 安装 npm 依赖..."
npm install --production 2>&1 | tail -3
echo "  依赖安装完成"

# ---- 6. 配置 Nginx + PM2 启动 ----
echo ""
echo "[6/6] 配置 Nginx 并启动服务..."

cat > /etc/nginx/sites-available/competition-api << 'NGINXEOF'
server {
    listen 80;
    server_name 149.28.143.114;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/competition-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

pm2 delete competition-api 2>/dev/null || true
pm2 start server.js --name competition-api
pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

# ---- 验证 ----
echo ""
echo "=========================================="
echo "  验证部署..."
echo "=========================================="
sleep 2
echo ""
pm2 status
echo ""
curl -s http://127.0.0.1:3000/api/health
echo ""
curl -s http://127.0.0.1/api/health
echo ""
echo "=========================================="
echo "  部署完成！"
echo "  API: http://149.28.143.114/api/health"
echo "=========================================="
