/**
 * effects.js - Visual Effects for Competition Hub
 * Three effects: Dot Grid Repel, 3D Card Tilt, Particle System
 * Dark theme: gold (#fbbf24) / cyan (#06b6d4), background #07070a
 */

(function () {
  'use strict';

  /* ============================================================
     Utility: prefers-reduced-motion check
     ============================================================ */
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ============================================================
     Utility: check if element is inside a modal or dropdown
     ============================================================ */
  function isInsideModalOrDropdown(el) {
    if (!el) return false;
    var node = el;
    while (node && node !== document.body) {
      if (
        node.classList.contains('modal') ||
        node.classList.contains('contact-modal') ||
        node.classList.contains('legal-modal') ||
        node.classList.contains('search-modal') ||
        node.classList.contains('nav-dropdown') ||
        node.classList.contains('mobile-menu') ||
        node.classList.contains('notif-dropdown')
      ) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  /* ============================================================
     Effect 1: Dot Grid Repel (zorto.dev style)
     ============================================================ */
  function initDotGrid() {
    // Claude 风格：桌面端禁用点阵
    if (window.innerWidth > 768) return;
    var canvas = document.getElementById('dotGridCanvas');
    if (!canvas) return;
    if (prefersReducedMotion()) {
      canvas.style.display = 'none';
      return;
    }

    var ctx = canvas.getContext('2d');
    var heroSection = document.getElementById('page-home');
    if (!heroSection) return;

    // Ensure hero has position relative for absolute canvas
    var heroStyle = window.getComputedStyle(heroSection);
    if (heroStyle.position === 'static') {
      heroSection.style.position = 'relative';
    }

    // Canvas styling
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    // Configuration
    var isMobile = window.innerWidth < 768;
    var SPACING = isMobile ? 32 : 28;
    var BASE_RADIUS = 1.8;
    var FPS_INTERVAL = 1000 / 30;
    var REPEL_RADIUS = 120;
    var REPEL_FORCE = 18;
    var GOLD = [251, 191, 36];
    var CYAN = [6, 182, 212];

    var dots = [];
    var cols = 0;
    var rows = 0;
    var width = 0;
    var height = 0;
    var mouseX = -9999;
    var mouseY = -9999;
    var lastTime = 0;
    var startTime = performance.now();
    var fadeInProgress = 0; // 0 to 1

    function resize() {
      var rect = heroSection.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      buildGrid();
    }

    function buildGrid() {
      dots = [];
      cols = Math.ceil(width / SPACING) + 1;
      rows = Math.ceil(height / SPACING) + 1;
      var offsetX = (width - (cols - 1) * SPACING) / 2;
      var offsetY = (height - (rows - 1) * SPACING) / 2;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          dots.push({
            baseX: offsetX + c * SPACING,
            baseY: offsetY + r * SPACING,
            x: offsetX + c * SPACING,
            y: offsetY + r * SPACING,
            col: c,
            row: r
          });
        }
      }
    }

    function animate(timestamp) {
      requestAnimationFrame(animate);

      var delta = timestamp - lastTime;
      if (delta < FPS_INTERVAL) return;
      lastTime = timestamp - (delta % FPS_INTERVAL);

      var t = (timestamp - startTime) / 1000;

      // Fade-in from center over 2 seconds
      if (fadeInProgress < 1) {
        fadeInProgress = Math.min(1, (timestamp - startTime) / 2000);
      }

      ctx.clearRect(0, 0, width, height);

      var centerX = width / 2;
      var centerY = height / 2;
      var maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      // Update dots
      for (var i = 0; i < dots.length; i++) {
        var dot = dots[i];

        // Wave displacement
        var waveX = Math.sin(dot.baseX * 0.015 + t * 0.8) * 6 +
                    Math.cos(dot.baseY * 0.012 + t * 0.6) * 5 +
                    Math.sin((dot.baseX + dot.baseY) * 0.008 + t * 0.4) * 4;
        var waveY = Math.cos(dot.baseX * 0.012 + t * 0.6) * 5 +
                    Math.sin(dot.baseY * 0.015 + t * 0.8) * 6 +
                    Math.cos((dot.baseX - dot.baseY) * 0.008 + t * 0.4) * 4;

        var targetX = dot.baseX + waveX;
        var targetY = dot.baseY + waveY;

        // Mouse repel
        var dx = targetX - mouseX;
        var dy = targetY - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 0) {
          var force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
          targetX += (dx / dist) * force;
          targetY += (dy / dist) * force;
        }

        dot.x = targetX;
        dot.y = targetY;

        // Color: gradient between gold and cyan based on position + time
        var colorT = (Math.sin(dot.baseX * 0.005 + dot.baseY * 0.005 + t * 0.3) + 1) / 2;
        var r = Math.round(GOLD[0] + (CYAN[0] - GOLD[0]) * colorT);
        var g = Math.round(GOLD[1] + (CYAN[1] - GOLD[1]) * colorT);
        var b = Math.round(GOLD[2] + (CYAN[2] - GOLD[2]) * colorT);

        // Wave peak factor for glow and lines
        var wavePeak = (Math.abs(waveX) + Math.abs(waveY)) / 20; // 0 to ~1.1
        wavePeak = Math.min(1, wavePeak);

        // Fade-in from center
        var dotDist = Math.sqrt((dot.baseX - centerX) * (dot.baseX - centerX) + (dot.baseY - centerY) * (dot.baseY - centerY));
        var fadeRadius = fadeInProgress * maxDist;
        var dotAlpha = dotDist < fadeRadius ? 1 : 0;
        if (dotDist > fadeRadius - 100 && fadeRadius > 0) {
          dotAlpha = Math.max(0, (fadeRadius - dotDist) / 100);
        }

        if (dotAlpha <= 0) continue;

        // Glow on wave peaks
        var radius = BASE_RADIUS + wavePeak * 1.2;
        var alpha = (0.15 + wavePeak * 0.25) * dotAlpha;

        if (wavePeak > 0.5) {
          ctx.shadowBlur = 4 + wavePeak * 6;
          ctx.shadowColor = 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.3) + ')';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        ctx.fill();

        // Store computed values for line drawing
        dot._r = r;
        dot._g = g;
        dot._b = b;
        dot._alpha = alpha;
        dot._wavePeak = wavePeak;
        dot._dotAlpha = dotAlpha;
      }

      ctx.shadowBlur = 0;

      // Connecting lines between nearby dots at wave peaks
      ctx.lineWidth = 0.5;
      for (var i = 0; i < dots.length; i++) {
        var a = dots[i];
        if (!a._dotAlpha || a._dotAlpha <= 0 || a._wavePeak < 0.5) continue;

        // Only check right and bottom neighbors for efficiency
        for (var j = i + 1; j < dots.length; j++) {
          var b = dots[j];
          if (!b._dotAlpha || b._dotAlpha <= 0 || b._wavePeak < 0.5) continue;

          // Skip if not neighbors (for performance, only check adjacent)
          var colDiff = Math.abs(a.col - b.col);
          var rowDiff = Math.abs(a.row - b.row);
          if (colDiff > 1 || rowDiff > 1) continue;

          var ldx = a.x - b.x;
          var ldy = a.y - b.y;
          var ldist = Math.sqrt(ldx * ldx + ldy * ldy);

          if (ldist < SPACING * 1.5) {
            var lineAlpha = (1 - ldist / (SPACING * 1.5)) * 0.12 * Math.min(a._dotAlpha, b._dotAlpha);
            var avgR = Math.round((a._r + b._r) / 2);
            var avgG = Math.round((a._g + b._g) / 2);
            var avgB = Math.round((a._b + b._b) / 2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(' + avgR + ',' + avgG + ',' + avgB + ',' + lineAlpha + ')';
            ctx.stroke();
          }
        }
      }
    }

    // Mouse events on hero section
    heroSection.addEventListener('mousemove', function (e) {
      var rect = heroSection.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    heroSection.addEventListener('mouseleave', function () {
      mouseX = -9999;
      mouseY = -9999;
    });

    // Touch events
    heroSection.addEventListener('touchmove', function (e) {
      if (e.touches.length > 0) {
        var rect = heroSection.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
      }
    }, { passive: true });

    heroSection.addEventListener('touchend', function () {
      mouseX = -9999;
      mouseY = -9999;
    });

    // Resize handler
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        isMobile = window.innerWidth < 768;
        SPACING = isMobile ? 32 : 28;
        resize();
      }, 200);
    });

    // Initialize
    resize();
    requestAnimationFrame(animate);
  }

  /* ============================================================
     Effect 2: 3D Card Tilt
     ============================================================ */
  function initCardTilt() {
    if (prefersReducedMotion()) return;

    var CARD_SELECTORS = '.card, .comp-hub-card, .knowledge-card, .stat-card, .toolbox-card, .featured-item';
    var MAX_TILT = 8; // degrees
    var SHINE_OPACITY = 0.12;

    // Create shine overlay element
    function createShine(card) {
      var shine = document.createElement('div');
      shine.className = 'card-tilt-shine';
      shine.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'pointer-events:none;border-radius:inherit;z-index:10;' +
        'background:radial-gradient(circle at 50% 50%, rgba(255,255,255,' + SHINE_OPACITY + ') 0%, transparent 60%);' +
        'opacity:0;transition:opacity 0.3s ease;';
      card.style.position = card.style.position || 'relative';
      card.style.overflow = 'hidden';
      card.appendChild(shine);
      return shine;
    }

    function handleTilt(card, shine, clientX, clientY) {
      var rect = card.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;

      var deltaX = clientX - centerX;
      var deltaY = clientY - centerY;

      var percentX = deltaX / (rect.width / 2);
      var percentY = deltaY / (rect.height / 2);

      var tiltX = -percentY * MAX_TILT; // rotateX (vertical tilt)
      var tiltY = percentX * MAX_TILT;  // rotateY (horizontal tilt)

      card.style.transform = 'perspective(800px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale3d(1.02, 1.02, 1.02) translateY(-4px)';
      card.style.transition = 'transform 0.1s ease-out';

      // Move shine
      var shineX = ((clientX - rect.left) / rect.width) * 100;
      var shineY = ((clientY - rect.top) / rect.height) * 100;
      shine.style.background = 'radial-gradient(circle at ' + shineX + '% ' + shineY + '%, rgba(255,255,255,' + SHINE_OPACITY + ') 0%, transparent 60%)';
      shine.style.opacity = '1';
    }

    function resetTilt(card, shine) {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease-out';
      if (shine) shine.style.opacity = '0';
    }

    // Use event delegation for dynamic cards
    var activeCard = null;
    var activeShine = null;
    var rafId = null;
    var pendingClientX = 0;
    var pendingClientY = 0;

    function onTiltFrame() {
      if (activeCard && activeShine) {
        handleTilt(activeCard, activeShine, pendingClientX, pendingClientY);
      }
      rafId = null;
    }

    function scheduleTilt(card, shine, clientX, clientY) {
      activeCard = card;
      activeShine = shine;
      pendingClientX = clientX;
      pendingClientY = clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(onTiltFrame);
      }
    }

    document.addEventListener('mousemove', function (e) {
      var target = e.target.closest(CARD_SELECTORS);
      if (!target || isInsideModalOrDropdown(target)) {
        if (activeCard) {
          resetTilt(activeCard, activeShine);
          activeCard = null;
          activeShine = null;
        }
        return;
      }

      // Create shine if not exists
      if (!target.querySelector('.card-tilt-shine')) {
        createShine(target);
      }

      var shine = target.querySelector('.card-tilt-shine');

      // Set will-change for GPU acceleration
      target.style.willChange = 'transform';

      scheduleTilt(target, shine, e.clientX, e.clientY);
    });

    document.addEventListener('mouseleave', function () {
      if (activeCard) {
        resetTilt(activeCard, activeShine);
        activeCard = null;
        activeShine = null;
      }
    });

    // Touch support
    document.addEventListener('touchmove', function (e) {
      if (e.touches.length === 0) return;
      var touch = e.touches[0];
      var target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!target) return;
      target = target.closest(CARD_SELECTORS);
      if (!target || isInsideModalOrDropdown(target)) {
        if (activeCard) {
          resetTilt(activeCard, activeShine);
          activeCard = null;
          activeShine = null;
        }
        return;
      }

      if (!target.querySelector('.card-tilt-shine')) {
        createShine(target);
      }

      var shine = target.querySelector('.card-tilt-shine');
      target.style.willChange = 'transform';
      scheduleTilt(target, shine, touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('touchend', function () {
      if (activeCard) {
        resetTilt(activeCard, activeShine);
        activeCard = null;
        activeShine = null;
      }
    });

    // Clean up will-change after transitions
    document.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'transform' && e.target.matches(CARD_SELECTORS)) {
        e.target.style.willChange = 'auto';
      }
    });
  }

  /* ============================================================
     Effect 3: Particle System (Three.js)
     ============================================================ */
  function initParticleSystem() {
    // Claude 风格：桌面端禁用粒子
    if (window.innerWidth > 768) return;
    var container = document.getElementById('particleContainer');
    if (!container) return;
    if (prefersReducedMotion()) {
      container.style.display = 'none';
      return;
    }

    // 检测 WebGL 可用性
    try {
      var testCanvas = document.createElement('canvas');
      var testGl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!testGl) {
        console.warn('WebGL 不可用，粒子系统已禁用');
        container.style.display = 'none';
        return;
      }
    } catch(e) {
      container.style.display = 'none';
      return;
    }

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded, particle system disabled.');
      container.style.display = 'none';
      return;
    }

    var isMobile = window.innerWidth < 768;
    var PARTICLE_COUNT = isMobile ? 500 : 2000;
    var REPEL_RADIUS = 150;
    var REPEL_FORCE = 0.8;

    // Scene setup
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Particle geometry
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(PARTICLE_COUNT * 3);
    var velocities = new Float32Array(PARTICLE_COUNT * 3);
    var originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    var colors = new Float32Array(PARTICLE_COUNT * 3);
    var sizes = new Float32Array(PARTICLE_COUNT);

    var GOLD_R = 251 / 255, GOLD_G = 191 / 255, GOLD_B = 36 / 255;
    var CYAN_R = 6 / 255, CYAN_G = 182 / 255, CYAN_B = 212 / 255;

    var spreadX = window.innerWidth * 0.8;
    var spreadY = window.innerHeight * 0.8;

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var i3 = i * 3;

      // Random position
      var px = (Math.random() - 0.5) * spreadX;
      var py = (Math.random() - 0.5) * spreadY;
      var pz = (Math.random() - 0.5) * 60 - 10;

      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      originalPositions[i3] = px;
      originalPositions[i3 + 1] = py;
      originalPositions[i3 + 2] = pz;

      // Slow drift velocity
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;

      // Color: gold or cyan with some variation
      var colorMix = Math.random();
      if (colorMix < 0.5) {
        // Gold with variation
        colors[i3] = GOLD_R + (Math.random() - 0.5) * 0.1;
        colors[i3 + 1] = GOLD_G + (Math.random() - 0.5) * 0.1;
        colors[i3 + 2] = GOLD_B + (Math.random() - 0.5) * 0.1;
      } else {
        // Cyan with variation
        colors[i3] = CYAN_R + (Math.random() - 0.5) * 0.05;
        colors[i3 + 1] = CYAN_G + (Math.random() - 0.5) * 0.1;
        colors[i3 + 2] = CYAN_B + (Math.random() - 0.5) * 0.1;
      }

      // Size variation: 2-4px screen space
      sizes[i] = 2 + Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for round particles with glow
    var vertexShader = [
      'attribute float size;',
      'varying vec3 vColor;',
      'void main() {',
      '  vColor = color;',
      '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = size * (300.0 / -mvPosition.z);',
      '  gl_Position = projectionMatrix * mvPosition;',
      '}'
    ].join('\n');

    var fragmentShader = [
      'varying vec3 vColor;',
      'void main() {',
      '  float dist = length(gl_PointCoord - vec2(0.5));',
      '  if (dist > 0.5) discard;',
      '  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);',
      '  float glow = exp(-dist * 4.0) * 0.5;',
      '  gl_FragColor = vec4(vColor, (alpha + glow) * 0.7);',
      '}'
    ].join('\n');

    var material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse/touch tracking in normalized device coordinates
    var mouseNDC = new THREE.Vector2(9999, 9999);
    var mouseScreen = { x: -9999, y: -9999 };
    var raycaster = new THREE.Raycaster();

    document.addEventListener('mousemove', function (e) {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseScreen.x = e.clientX;
      mouseScreen.y = e.clientY;
    });

    document.addEventListener('mouseleave', function () {
      mouseNDC.set(9999, 9999);
      mouseScreen.x = -9999;
      mouseScreen.y = -9999;
    });

    document.addEventListener('touchmove', function (e) {
      if (e.touches.length > 0) {
        mouseNDC.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouseNDC.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        mouseScreen.x = e.touches[0].clientX;
        mouseScreen.y = e.touches[0].clientY;
      }
    }, { passive: true });

    document.addEventListener('touchend', function () {
      mouseNDC.set(9999, 9999);
      mouseScreen.x = -9999;
      mouseScreen.y = -9999;
    });

    // Animation
    var time = 0;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.016; // ~60fps time step

      var posAttr = geometry.getAttribute('position');
      var posArray = posAttr.array;

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var i3 = i * 3;

        // Gentle drift
        posArray[i3] += velocities[i3] + Math.sin(time * 0.5 + i * 0.1) * 0.005;
        posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.3 + i * 0.1) * 0.005;
        posArray[i3 + 2] += velocities[i3 + 2];

        // Wrap around boundaries
        if (posArray[i3] > spreadX / 2) posArray[i3] = -spreadX / 2;
        if (posArray[i3] < -spreadX / 2) posArray[i3] = spreadX / 2;
        if (posArray[i3 + 1] > spreadY / 2) posArray[i3 + 1] = -spreadY / 2;
        if (posArray[i3 + 1] < -spreadY / 2) posArray[i3 + 1] = spreadY / 2;
        if (posArray[i3 + 2] > 20) posArray[i3 + 2] = -70;
        if (posArray[i3 + 2] < -70) posArray[i3 + 2] = 20;

        // Mouse repel (in screen space approximation)
        if (mouseScreen.x > -999) {
          // Project particle to screen space
          var projected = posArray[i3]; // simplified: use x directly
          var projectedY = posArray[i3 + 1];

          var dx = projected - (mouseNDC.x * spreadX / 2);
          var dy = projectedY - (mouseNDC.y * spreadY / 2);
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < REPEL_RADIUS && dist > 0) {
            var force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
            posArray[i3] += (dx / dist) * force;
            posArray[i3 + 1] += (dy / dist) * force;
          }
        }
      }

      posAttr.needsUpdate = true;

      // Subtle rotation
      particles.rotation.z = Math.sin(time * 0.1) * 0.02;
      particles.rotation.x = Math.cos(time * 0.08) * 0.01;

      renderer.render(scene, camera);
    }

    // Resize handler
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        isMobile = window.innerWidth < 768;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        spreadX = window.innerWidth * 0.8;
        spreadY = window.innerHeight * 0.8;
      }, 200);
    });

    // Start
    animate();
  }

  /* ============================================================
     Expose global functions
     ============================================================ */
  window.initDotGrid = initDotGrid;
  window.initCardTilt = initCardTilt;
  window.initParticleSystem = initParticleSystem;

})();
