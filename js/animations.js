/* Extracted from app.js */
/* ============================================
   Claude Aesthetic: Lenis Smooth Scroll (DISABLED for performance)
   ============================================ */
function initLenisSmoothScroll() { return; }
/* ============================================
   Claude Aesthetic: Scroll Progress Bar (native scroll)
   ============================================ */
function initScrollProgress() {
  var bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
}
/* ============================================
   Claude Aesthetic: GSAP Animations (SIMPLIFIED for performance)
   ============================================ */
function initGSAPAnimations() {
  try {
    if (typeof gsap === 'undefined') return;

    // Set initial states
    gsap.set('.top-nav', { y: -100, opacity: 0 });
    gsap.set('.hero-title', { y: 60, opacity: 0 });
    gsap.set('.hero-subtitle', { y: 30, opacity: 0 });
    gsap.set('.home-search', { y: 30, opacity: 0 });
    gsap.set('.daily-quote', { y: 30, opacity: 0 });
    gsap.set('.featured-row .featured-item', { y: 40, opacity: 0 });
    gsap.set('.service-list .service-item', { y: 30, opacity: 0 });

    // Nav slides down
    gsap.to('.top-nav', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });

    // Hero title - split text effect
    var heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      var text = heroTitle.textContent;
      heroTitle.innerHTML = '';
      text.split('').forEach(function(char) {
        var span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        heroTitle.appendChild(span);
      });
      gsap.from('.hero-title .char', { y: 30, opacity: 0, duration: 0.5, stagger: 0.02, ease: 'power3.out', delay: 0.2 });
    }

    // Subtitle
    gsap.to('.hero-subtitle', { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: 'power3.out' });

    // Home search
    gsap.to('.home-search', { y: 0, opacity: 1, duration: 0.8, delay: 0.6, ease: 'power3.out' });

    // Featured row
    gsap.to('.featured-row .featured-item', { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, delay: 0.7, ease: 'power3.out' });

    // Service list items
    gsap.to('.service-list .service-item', { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, delay: 0.9, ease: 'power3.out' });

    // Daily quote
    gsap.to('.daily-quote', { y: 0, opacity: 1, duration: 0.8, delay: 0.8, ease: 'power3.out' });

  } catch(e) { console.warn('GSAP init failed:', e); }
}
/* ============================================
   Lightweight Reveal Animations (IntersectionObserver)
   ============================================ */
function initRevealAnimations() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}
/* ============================================
   Claude Aesthetic: Custom Cursor (DISABLED for performance)
   ============================================ */
function initCustomCursor() { return; }
/* ============================================
   Claude Aesthetic: Mouse Spotlight (DISABLED for performance)
   ============================================ */
function initMouseSpotlight() { return; }
