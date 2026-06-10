// ============================================
// Portfolio Video Data
// ============================================

const portfolioVideos = [
  // Fitpage (Current Employer - Featured First)
  'https://www.instagram.com/reel/DIyfB9xN9Lk/',
  'https://www.instagram.com/reel/DFxO-qTpL2q/',
  'https://www.instagram.com/reel/DHn2JSyMc2N/',

  // India Running
  'https://www.instagram.com/reel/DG7iPyVs2y8/',
  'https://www.instagram.com/reel/DN8OMpfCNet/',
  'https://www.instagram.com/reel/DPtAulPApWH/',
  'https://www.instagram.com/reel/DOcm6z_CT-Y/',
  'https://www.instagram.com/reel/DMF_kSNJEEF/',
  'https://www.instagram.com/reel/DMQFFB3IJDY/',
  'https://www.instagram.com/reel/DLupsYZxo4q/',
  'https://www.instagram.com/reel/DGSbf_rCqTO/',
  'https://www.instagram.com/reel/DA-qlk9yCku/',
  'https://www.instagram.com/reel/DAuwNZJohI0/',

  // Captured
  'https://www.instagram.com/reel/DL7Wl1_MMtf/',
  'https://www.instagram.com/reel/DGkGCTWNGY0/',
  'https://www.instagram.com/reel/DA8bdAyyUrQ/',
  'https://www.instagram.com/reel/C_DH0AbyrYs/',
  'https://www.instagram.com/reel/DDCSebcyohE/',
  'https://www.instagram.com/reel/C_-AVePSjT-/',

  // Ascend
  'https://www.instagram.com/reel/DNsO280XqLM/',
  'https://www.instagram.com/reel/DWT-Mm5iAbK/',

  // VS
  'https://www.instagram.com/reel/DS4HAq3DDKY/',
  'https://www.instagram.com/reel/DSmR-66kyjo/',

  // Wesness
  'https://www.instagram.com/reel/C8oOXpVozyZ/',
  'https://www.instagram.com/reel/C7RW5IeoRE6/',
  'https://www.instagram.com/reel/C39eOGry8bM/',
  'https://www.instagram.com/reel/C6D_GSkI2U5/',

  // BAPHM
  'https://www.instagram.com/reel/DNS6BdFiLvO/',
  'https://www.instagram.com/reel/DKjd_RRCkvS/',
  'https://www.instagram.com/reel/DQNlDQckyAD/',
  'https://www.instagram.com/reel/DQJWcwPAuJ2/',
  'https://www.instagram.com/reel/DP-peuMEQvI/',
  'https://www.instagram.com/reel/DOyImyeEcwC/',
  'https://www.instagram.com/reel/DOOCvjPEUlQ/',
  'https://www.instagram.com/reel/DBVQlJgoEqw/',
  'https://www.instagram.com/reel/DJRFzgNCGfv/',
  'https://www.instagram.com/reel/DK1lJWvil_x/',
  'https://www.instagram.com/reel/DPJDHLZgvKd/',
];

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
// Custom Video Players (replaces Instagram embeds)
// ============================================

async function initCustomVideoPlayers() {
  console.log('[INIT] Starting custom video players initialization...');
  const portfolioGrid = document.getElementById('portfolioGrid');
  const portfolioLoading = document.getElementById('portfolioLoading');

  if (!portfolioGrid || !portfolioLoading) {
    console.error('[ERROR] Portfolio grid or loading element not found');
    return;
  }

  console.log(`[SUCCESS] Found elements. Loading ${portfolioVideos.length} videos...`);

  try {
    // Initialize fetcher with cache
    const cache = new CacheManager();
    const fetcher = new VideoDataFetcher(cache);

    // Batch fetch video data (uses cache where available)
    console.log('[INFO] Fetching video data (checking cache first)...');
    const videoDataArray = await fetcher.fetchBatch(portfolioVideos, 5);

    // Create player for each video
    videoDataArray.forEach((videoData, index) => {
      const playerContainer = document.createElement('div');
      playerContainer.className = 'portfolio-item animate-on-scroll';
      playerContainer.style.transitionDelay = `${index * 0.1}s`;

      portfolioGrid.appendChild(playerContainer);

      // Get brand info from Instagram URL
      const instagramUrl = portfolioVideos[index];
      const brandInfo = getBrandInfo(instagramUrl);

      // Initialize player
      const player = new VideoPlayer(playerContainer, videoData, brandInfo);
      console.log(`[SUCCESS] Player ${index + 1} initialized for ${brandInfo.name}`);
    });

    // Hide loading indicator
    portfolioLoading.style.display = 'none';
    console.log('[SUCCESS] All video players initialized');

    // Set up scroll animations for the newly created portfolio items
    setupPortfolioScrollAnimations();
    console.log('[INFO] Scroll animations initialized for portfolio items');

  } catch (error) {
    console.error('[ERROR] Error loading custom video players:', error);
    showPlayerError(portfolioGrid, portfolioLoading);
  }
}

function showPlayerError(portfolioGrid, portfolioLoading) {
  portfolioLoading.innerHTML = `
    <p style="color: #e74c3c;">Error loading videos. Please refresh the page.</p>
  `;
}
