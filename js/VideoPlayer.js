/**
 * VideoPlayer - Custom HTML5 video player with glassmorphic UI
 * Supports hover-to-preview and click-to-play interactions
 */
class VideoPlayer {
  constructor(container, videoData, brandInfo = null) {
    this.container = container;
    this.videoData = videoData;
    this.brandInfo = brandInfo || { name: 'Client Project', description: 'Professional video editing' };

    this.state = {
      playing: false,
      muted: true,
      hovering: false,
      clickedToPlay: false,
      currentTime: 0,
      duration: 0
    };

    this.elements = {};

    this.render();
    this.attachEventListeners();
  }

  /**
   * Render player DOM structure
   */
  render() {
    if (this.videoData.driveId) {
      this.renderDriveEmbed();
      return;
    }

    // Check if video data is valid
    if (!this.videoData.success) {
      this.renderFallback();
      return;
    }

    const { videoUrl, thumbnail } = this.videoData;

    this.container.innerHTML = `
      <div class="video-player">
        <video class="video-element" preload="metadata" poster="${thumbnail || ''}">
          <source src="${videoUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>

        <div class="video-overlay">
          <!-- Info panel (top, hover-reveal) -->
          <div class="info-panel">
            <div class="brand-name">${this.brandInfo.name}</div>
            <div class="brand-description">${this.brandInfo.description}</div>
          </div>

          <!-- Controls (bottom, always visible) -->
          <div class="controls">
            <div class="controls-inner">
              <button class="play-btn" aria-label="Play/Pause">
                <i class="fas fa-play"></i>
              </button>
              <div class="progress-bar" aria-label="Video progress">
                <div class="progress-fill"></div>
              </div>
              <button class="volume-btn" aria-label="Mute/Unmute">
                <i class="fas fa-volume-mute"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cache element references
    this.elements.video = this.container.querySelector('.video-element');
    this.elements.player = this.container.querySelector('.video-player');
    this.elements.playBtn = this.container.querySelector('.play-btn');
    this.elements.volumeBtn = this.container.querySelector('.volume-btn');
    this.elements.progressBar = this.container.querySelector('.progress-bar');
    this.elements.progressFill = this.container.querySelector('.progress-fill');
    this.elements.infoPanel = this.container.querySelector('.info-panel');
  }

  /**
   * Render Google Drive iframe embed
   */
  renderDriveEmbed() {
    this.container.innerHTML = `
      <div class="video-player drive-embed">
        <iframe
          src="https://drive.google.com/file/d/${this.videoData.driveId}/preview"
          allow="autoplay"
          allowfullscreen
          frameborder="0"
          loading="lazy"
        ></iframe>
        <div class="drive-brand-label">
          <span class="brand-name">${this.brandInfo.name}</span>
          <span class="brand-description">${this.brandInfo.description}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render fallback UI when video data fails
   */
  renderFallback() {
    const { fallbackUrl } = this.videoData;

    this.container.innerHTML = `
      <div class="video-player video-fallback">
        <div class="fallback-content">
          <div class="fallback-logo">
            <i class="fab fa-instagram"></i>
          </div>
          <a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer" class="fallback-link">
            View on Instagram
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.videoData.success) return; // No events for fallback

    const { video, player, playBtn, volumeBtn, progressBar } = this.elements;

    // Video events
    video.addEventListener('loadedmetadata', () => {
      this.state.duration = video.duration;
    });

    video.addEventListener('timeupdate', () => {
      this.state.currentTime = video.currentTime;
      this.updateProgressBar();
    });

    video.addEventListener('ended', () => {
      this.state.playing = false;
      this.state.clickedToPlay = false;
      this.updatePlayButton();
    });

    video.addEventListener('error', (e) => {
      console.error('[VideoPlayer] Video load error:', e);
      // Could re-fetch video URL here if needed
    });

    // Container events (hover and click)
    if (!this.isTouchDevice()) {
      player.addEventListener('mouseenter', () => this.onHoverStart());
      player.addEventListener('mouseleave', () => this.onHoverEnd());
    }

    player.addEventListener('click', (e) => {
      // Don't trigger if clicking controls
      if (!e.target.closest('.controls-inner')) {
        this.onClick();
      }
    });

    // Control events
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlayPause();
    });

    volumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute();
    });

    progressBar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.seekTo(e);
    });
  }

  /**
   * Hover start (desktop only)
   */
  onHoverStart() {
    if (this.isTouchDevice()) return;

    this.state.hovering = true;
    this.elements.infoPanel.classList.add('visible');

    // Start muted preview if not already playing
    if (!this.state.playing) {
      this.playMuted();
    }
  }

  /**
   * Hover end (desktop only)
   */
  onHoverEnd() {
    if (this.isTouchDevice()) return;

    this.state.hovering = false;
    this.elements.infoPanel.classList.remove('visible');

    // Pause if user hasn't clicked to play
    if (!this.state.clickedToPlay) {
      this.pause();
    }
  }

  /**
   * Click/tap handler
   */
  onClick() {
    if (this.state.playing && !this.state.muted) {
      // Already playing with sound → pause
      this.pause();
      this.state.clickedToPlay = false;
    } else {
      // Not playing or muted → play with sound
      this.state.clickedToPlay = true;
      this.playWithSound();

      // Show info panel on mobile tap
      if (this.isTouchDevice()) {
        this.elements.infoPanel.classList.add('visible');
      }
    }
  }

  /**
   * Play muted (preview)
   */
  playMuted() {
    this.elements.video.muted = true;
    this.state.muted = true;
    this.elements.video.play();
    this.state.playing = true;
    this.updatePlayButton();
    this.updateVolumeButton();
  }

  /**
   * Play with sound
   */
  playWithSound() {
    this.elements.video.muted = false;
    this.state.muted = false;
    this.elements.video.play();
    this.state.playing = true;
    this.updatePlayButton();
    this.updateVolumeButton();
  }

  /**
   * Pause video
   */
  pause() {
    this.elements.video.pause();
    this.state.playing = false;
    this.updatePlayButton();
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (this.state.playing) {
      this.pause();
    } else {
      this.playWithSound();
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.state.muted = !this.state.muted;
    this.elements.video.muted = this.state.muted;
    this.updateVolumeButton();
  }

  /**
   * Seek to position
   */
  seekTo(event) {
    const rect = this.elements.progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.elements.video.currentTime = percent * this.state.duration;
  }

  /**
   * Update progress bar
   */
  updateProgressBar() {
    if (this.state.duration > 0) {
      const percent = (this.state.currentTime / this.state.duration) * 100;
      this.elements.progressFill.style.width = `${percent}%`;
    }
  }

  /**
   * Update play button icon
   */
  updatePlayButton() {
    const icon = this.elements.playBtn.querySelector('i');
    if (this.state.playing) {
      icon.className = 'fas fa-pause';
    } else {
      icon.className = 'fas fa-play';
    }
  }

  /**
   * Update volume button icon
   */
  updateVolumeButton() {
    const icon = this.elements.volumeBtn.querySelector('i');
    if (this.state.muted) {
      icon.className = 'fas fa-volume-mute';
    } else {
      icon.className = 'fas fa-volume-up';
    }
  }

  /**
   * Check if device supports touch
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Destroy player (cleanup)
   */
  destroy() {
    if (this.elements.video) {
      this.elements.video.pause();
      this.elements.video.src = '';
    }
    this.container.innerHTML = '';
  }
}
