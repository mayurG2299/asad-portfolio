class ReelCarousel {
  constructor(allVideos) {
    this.all        = allVideos.filter(v => v.driveId);
    this.videos     = this.all;
    this.current    = 0;
    this.interacted = false;  // tracks whether user has gestured yet
    this.init();
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  init() {
    const root = document.getElementById('portfolioGrid');
    root.className = 'reel-carousel-root';

    const brands = ['All', ...new Set(this.all.map(v => v.brand))];

    root.innerHTML = `
      <div class="reel-filters" id="reelFilters">
        ${brands.map((b, i) => `
          <button class="reel-filter-btn ${i === 0 ? 'active' : ''}" data-brand="${b}">${b}</button>
        `).join('')}
      </div>

      <div class="reel-stage">
        <button class="reel-nav reel-nav-prev" aria-label="Previous">&#8249;</button>
        <div class="reel-track" id="reelTrack"></div>
        <button class="reel-nav reel-nav-next" aria-label="Next">&#8250;</button>
      </div>

      <div class="reel-meta">
        <span class="reel-brand" id="reelBrand"></span>
        <span class="reel-desc"  id="reelDesc"></span>
        <span class="reel-count" id="reelCount"></span>
      </div>
    `;

    this.track = document.getElementById('reelTrack');
    this.buildCards();
    this.render();
    this.bindEvents();
  }

  buildCards() {
    this.track.innerHTML = '';
    this.cards = this.videos.map((_, i) => {
      const card = document.createElement('div');
      card.className = 'reel-card';
      card.dataset.index = i;
      this.track.appendChild(card);
      return card;
    });
  }

  // ── State helpers ─────────────────────────────────────────────────────────
  getState(i) {
    const n = this.videos.length;
    // Shortest signed distance on a circle
    let d = i - this.current;
    if (d >  n / 2) d -= n;
    if (d < -n / 2) d += n;
    if (d === 0)  return 'state-active';
    if (d === -1) return 'state-prev1';
    if (d === 1)  return 'state-next1';
    if (d === -2) return 'state-prev2';
    if (d === 2)  return 'state-next2';
    return 'state-hidden';
  }

  thumbPath(v) {
    return `assets/thumbs/${v.thumb}`;
  }

  // ── Card HTML builders ────────────────────────────────────────────────────
  tapHTML(v) {
    return `
      <img class="card-thumb" src="${this.thumbPath(v)}" alt="${v.brand}" />
      <div class="card-tap-overlay">
        <div class="card-tap-btn" aria-label="Play video">
          <svg viewBox="0 0 24 24" fill="white" width="64" height="64"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="card-brand-pill">${v.brand}</div>
    `;
  }

  activeHTML(v) {
    return `
      <div class="card-thumb-bg" style="background-image:url('${this.thumbPath(v)}')"></div>
      <div class="card-iframe-clip">
        <div class="card-iframe-inner">
          <iframe
            src="https://drive.google.com/file/d/${v.driveId}/preview?autoplay=1"
            allow="autoplay"
            allowfullscreen
            frameborder="0"
          ></iframe>
        </div>
      </div>
      <div class="card-brand-pill">${v.brand}</div>
    `;
  }

  thumbHTML(v) {
    return `
      <img class="card-thumb" src="${this.thumbPath(v)}" alt="${v.brand}" loading="lazy" />
      <div class="card-side-overlay">
        <div class="card-play-icon">
          <svg viewBox="0 0 24 24" fill="white" width="40" height="40"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span class="card-side-brand">${v.brand}</span>
      </div>
    `;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  render() {
    this.cards.forEach((card, i) => {
      const v        = this.videos[i];
      const state    = this.getState(i);
      const wasActive = card.classList.contains('state-active');
      const nowActive = state === 'state-active';

      card.className = `reel-card ${state}`;

      if (nowActive && !wasActive) {
        // Card just became active
        card.innerHTML = this.interacted ? this.activeHTML(v) : this.tapHTML(v);
      } else if (!nowActive && wasActive) {
        // Card just lost focus — kill the iframe, show thumbnail
        card.innerHTML = this.thumbHTML(v);
      } else if (!nowActive && !card.querySelector('.card-thumb')) {
        // Side card that hasn't been populated yet (initial render)
        card.innerHTML = this.thumbHTML(v);
      }
      // Active card already playing → leave innerHTML alone (no flicker)
    });

    if (this.videos.length === 0) return;
    const v = this.videos[this.current];
    document.getElementById('reelBrand').textContent = v.brand;
    document.getElementById('reelDesc').textContent  = v.description;
    document.getElementById('reelCount').textContent = `${this.current + 1} / ${this.videos.length}`;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goTo(index, fromInteraction = false) {
    if (fromInteraction) this.interacted = true;
    const n = this.videos.length;
    this.current = ((index % n) + n) % n;
    this.render();
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  filterBy(brand) {
    this.videos  = brand === 'All' ? this.all : this.all.filter(v => v.brand === brand);
    this.current = 0;
    this.buildCards();
    this.render();
  }

  // ── Events ────────────────────────────────────────────────────────────────
  bindEvents() {
    document.querySelector('.reel-nav-prev')
      .addEventListener('click', () => this.goTo(this.current - 1, true));
    document.querySelector('.reel-nav-next')
      .addEventListener('click', () => this.goTo(this.current + 1, true));

    this.track.addEventListener('click', e => {
      const card = e.target.closest('.reel-card');
      if (!card) return;
      if (card.classList.contains('state-active')) {
        // Tap-to-play: swap tap overlay for real iframe
        if (card.querySelector('.card-tap-overlay')) {
          this.interacted = true;
          card.innerHTML = this.activeHTML(this.videos[this.current]);
        }
      } else {
        this.goTo(parseInt(card.dataset.index), true);
      }
    });

    document.getElementById('reelFilters').addEventListener('click', e => {
      const btn = e.target.closest('.reel-filter-btn');
      if (!btn) return;
      document.querySelectorAll('.reel-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.filterBy(btn.dataset.brand);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  this.goTo(this.current - 1, true);
      if (e.key === 'ArrowRight') this.goTo(this.current + 1, true);
    });

    let tx = 0;
    this.track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    this.track.addEventListener('touchend', e => {
      const d = tx - e.changedTouches[0].clientX;
      if (Math.abs(d) > 50) d > 0 ? this.goTo(this.current + 1, true) : this.goTo(this.current - 1, true);
    });

    document.addEventListener('visibilitychange', () => {
      const activeCard = this.cards[this.current];
      if (!activeCard) return;
      const v = this.videos[this.current];

      if (document.hidden) {
        // Tab/window lost focus — kill the iframe to pause
        const clip = activeCard.querySelector('.card-iframe-clip');
        if (clip) clip.remove();
      } else {
        // Tab/window back in focus — re-inject iframe with autoplay
        if (!activeCard.querySelector('.card-iframe-clip')) {
          activeCard.innerHTML = this.activeHTML(v);
        }
      }
    });
  }
}
