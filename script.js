// Portfolio videos are defined in js/portfolio-config.js (PORTFOLIO_CONFIG)

// ============================================
// Configuration
// ============================================

const CONFIG = {
  observerThreshold: 0.1,
  scrollOffset: 50,
};

// ============================================
// DOM Ready
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[INIT] DOM loaded, initializing...');
  console.log('[INIT] Script.js is executing!');

  initNavigation();
  initScrollAnimations();
  initStatCounters();
  initCustomVideoPlayers();
});

// ============================================
// Navigation
// ============================================

function initNavigation() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Navbar scroll behavior - add solid background when scrolled
  window.addEventListener('scroll', () => {
    if (window.scrollY > CONFIG.scrollOffset) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Update active nav link based on scroll position
    updateActiveNavLink();
  });

  // Mobile menu toggle
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Close mobile menu when link clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollPosition = window.scrollY + 200; // offset for navbar height

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

    if (navLink) {
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        navLink.classList.add('active');
      }
    }
  });
}

// ============================================
// Scroll Animations
// ============================================

function initScrollAnimations() {
  const observerOptions = {
    threshold: CONFIG.observerThreshold,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe all elements with animate-on-scroll class (except portfolio items, which are added later)
  const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.portfolio-item)');
  animatedElements.forEach(el => observer.observe(el));
}

function setupPortfolioScrollAnimations() {
  const observerOptions = {
    threshold: CONFIG.observerThreshold,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe portfolio items (added dynamically by initInstagramEmbeds)
  const portfolioItems = document.querySelectorAll('.portfolio-item.animate-on-scroll');
  portfolioItems.forEach(el => observer.observe(el));
  console.log(`[INFO] Observing ${portfolioItems.length} portfolio items for scroll animations`);
}

// ============================================
// Stat Counters (number ticker)
// ============================================

function initStatCounters() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const counters = Array.from(document.querySelectorAll('.stat-value'))
    .map(el => {
      const match = el.textContent.match(/^(\d+)(.*)$/);
      return match ? { el, target: parseInt(match[1], 10), suffix: match[2] } : null;
    })
    .filter(Boolean);

  if (counters.length === 0) return;

  const animateCount = ({ el, target, suffix }) => {
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    el.textContent = `0${suffix}`;
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const counter = counters.find(c => c.el === entry.target);
      if (counter) animateCount(counter);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  counters.forEach(({ el }) => observer.observe(el));
}

// ============================================
// Portfolio Carousel (Google Drive)
// ============================================

function initCustomVideoPlayers() {
  const portfolioLoading = document.getElementById('portfolioLoading');
  if (portfolioLoading) portfolioLoading.style.display = 'none';
  new ReelCarousel(PORTFOLIO_CONFIG);
}
