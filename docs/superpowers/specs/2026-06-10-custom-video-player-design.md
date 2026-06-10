# Custom Glassmorphic Video Player Design Specification

**Date:** 2026-06-10  
**Author:** Claude Sonnet 4.5  
**Status:** Approved  
**Version:** 1.0

## Overview

Replace the default Instagram embeds in the portfolio with custom glassmorphic video players that provide a professional, branded viewing experience while maintaining Instagram as the video host. The solution uses Vercel serverless functions to extract video URLs from Instagram posts and implements an intelligent caching layer to minimize API calls.

## Requirements

### Functional Requirements

1. **Custom Video Player**
   - Replace all Instagram iframe embeds with custom HTML5 video players
   - Implement glassmorphic UI design matching the dark cinematic portfolio theme
   - Support hover-to-preview (muted) and click-to-play (with sound) interactions
   - Display brand name and project description in hover-reveal overlay

2. **Video URL Extraction**
   - Extract direct video URLs from Instagram post links via serverless scraping
   - Support all 40+ existing Instagram reel URLs in the portfolio
   - Handle rate limiting and errors gracefully

3. **Performance Optimization**
   - Cache extracted video URLs in browser localStorage (7-day TTL)
   - Minimize serverless function calls (target: <5% after initial page load)
   - Maintain existing portfolio scroll animations and loading behavior

4. **Hosting & Deployment**
   - Host entirely on Vercel's free tier (static site + serverless functions)
   - No video file storage required (videos remain on Instagram's CDN)
   - Zero additional hosting costs

### Non-Functional Requirements

1. **Performance:** Video players should load within 2 seconds on average (after cache warm-up)
2. **Reliability:** Graceful degradation if scraping fails (show fallback with Instagram link)
3. **Mobile Responsiveness:** Full functionality on touch devices (tap to play, no hover preview)
4. **Accessibility:** Keyboard navigation support, ARIA labels for controls
5. **Maintainability:** Modular code structure, clear separation of concerns

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Frontend)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Portfolio Grid                                        │ │
│  │  ├─ VideoPlayer Components (40+ instances)            │ │
│  │  ├─ Video Data Fetcher                                │ │
│  │  └─ Cache Manager (localStorage)                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS Request
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Serverless Layer                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /api/instagram-video                                  │ │
│  │  ├─ Fetch Instagram page HTML                         │ │
│  │  ├─ Parse for video URL (JSON embedded in <script>)   │ │
│  │  ├─ Extract metadata (thumbnail, brand info)          │ │
│  │  └─ Return structured JSON response                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP GET
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Instagram CDN (External)                  │
│  ├─ Host video files (no change)                           │
│  └─ Serve video content to browser                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Initial Page Load (Cache Miss):**
1. User loads portfolio page
2. Portfolio grid initializes with Instagram URLs from `portfolioVideos` array
3. For each video URL:
   - Cache Manager checks localStorage for cached video data
   - If cache miss or expired → Video Data Fetcher calls `/api/instagram-video?url=<instagram-url>`
   - Serverless function scrapes Instagram page, extracts video URL + metadata
   - Returns JSON: `{ success: true, videoUrl, thumbnail, brandName, description }`
   - Cache Manager stores result with timestamp
   - VideoPlayer component renders with fetched data

**Subsequent Page Loads (Cache Hit):**
1. User loads portfolio page
2. Cache Manager finds valid cached data (< 7 days old)
3. VideoPlayer components render immediately with cached URLs
4. No serverless function calls needed

**User Interaction Flow:**
1. **Idle state:** Video paused, thumbnail visible, minimal UI
2. **Hover (desktop):** Video plays muted, info overlay fades in at top, controls visible at bottom
3. **Click:** Video unmutes and continues playing (or plays if not previewing)
4. **Click again:** Toggle pause/resume
5. **Unhover:** Video pauses (if not clicked to play)

## Technical Specifications

### File Structure

```
asadPortfolio/
├── api/
│   └── instagram-video.js          # Serverless function (new)
├── js/
│   ├── VideoPlayer.js               # Custom player component (new)
│   ├── videoDataFetcher.js          # API client (new)
│   ├── cacheManager.js              # LocalStorage wrapper (new)
│   └── script.js                    # Updated: replace embed logic
├── css/
│   ├── video-player.css             # Player styles (new)
│   └── styles.css                   # Existing styles
├── index.html                       # Updated: import new scripts/styles
└── docs/superpowers/specs/
    └── 2026-06-10-custom-video-player-design.md  # This document
```

### Component Specifications

#### 1. Serverless Function: `/api/instagram-video.js`

**Purpose:** Extract direct video URLs from Instagram post pages

**Runtime:** Node.js (Vercel default)

**Input Parameters:**
- `url` (query param, required): Instagram post URL (e.g., `https://www.instagram.com/reel/DIyfB9xN9Lk/`)

**Processing Logic:**
```javascript
// 1. Validate Instagram URL format
// 2. Fetch Instagram page HTML using fetch() or axios
// 3. Parse HTML for embedded JSON data (Instagram includes video metadata in <script> tags)
// 4. Extract video URL from JSON (typically in window._sharedData or similar)
// 5. Extract thumbnail URL
// 6. Derive brand name from URL path (e.g., /fitpage/ → "Fitpage")
// 7. Return structured response
```

**Response Format (Success):**
```json
{
  "success": true,
  "videoUrl": "https://scontent.cdninstagram.com/v/...",
  "thumbnail": "https://scontent.cdninstagram.com/v/...",
  "brandName": "Fitpage",
  "description": "Brand awareness campaign",
  "cachedAt": 1781064412000
}
```

**Response Format (Error):**
```json
{
  "success": false,
  "error": "Failed to extract video URL",
  "fallbackUrl": "https://www.instagram.com/reel/DIyfB9xN9Lk/"
}
```

**Error Handling:**
- Invalid URL → 400 Bad Request
- Instagram page not found → 404 with fallback
- Scraping fails (rate limit, parsing error) → 503 with fallback
- Timeout (>10s) → 504 with fallback

**Dependencies:**
- No external npm packages initially (use native `fetch()`)
- If needed: `cheerio` for HTML parsing (lightweight)

#### 2. Video Data Fetcher: `js/videoDataFetcher.js`

**Purpose:** Client-side API wrapper for fetching video data

**Key Methods:**

```javascript
class VideoDataFetcher {
  /**
   * Fetch video data for a single Instagram URL
   * @param {string} instagramUrl - Instagram post URL
   * @returns {Promise<VideoData>}
   */
  async fetchVideoData(instagramUrl) {
    // 1. Check cache first (via CacheManager)
    // 2. If cache hit and not expired, return cached data
    // 3. If cache miss, call /api/instagram-video
    // 4. On success, cache result and return
    // 5. On error, return error object with fallback
  }

  /**
   * Batch fetch multiple videos (with concurrency limit)
   * @param {string[]} urls - Array of Instagram URLs
   * @param {number} concurrency - Max parallel requests (default: 5)
   * @returns {Promise<VideoData[]>}
   */
  async fetchBatch(urls, concurrency = 5) {
    // Process URLs in batches to avoid overwhelming serverless function
    // Use Promise.allSettled to handle partial failures
  }
}
```

**Retry Logic:**
- Max 2 retries for failed requests
- Exponential backoff: 1s, 2s
- After retries exhausted, return error with fallback

#### 3. Cache Manager: `js/cacheManager.js`

**Purpose:** Manage localStorage caching with TTL support

**Key Methods:**

```javascript
class CacheManager {
  constructor(namespace = 'video_cache', ttl = 604800000) {
    // namespace: Prefix for cache keys
    // ttl: Time-to-live in milliseconds (default: 7 days)
  }

  /**
   * Get cached data for a key
   * @param {string} key - Cache key (Instagram URL)
   * @returns {object|null} - Cached data or null if miss/expired
   */
  get(key) {
    // 1. Generate cache key: hash(namespace + key)
    // 2. Read from localStorage
    // 3. Check if expired (compare cachedAt + ttl vs now)
    // 4. If expired, delete and return null
    // 5. Otherwise return data
  }

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {object} data - Data to cache
   */
  set(key, data) {
    // 1. Add cachedAt timestamp to data
    // 2. Stringify and store in localStorage
    // 3. Handle quota exceeded errors gracefully
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries in namespace
   */
  clear() {
    // Iterate localStorage, remove all keys matching namespace
  }

  /**
   * Remove expired entries (garbage collection)
   */
  cleanup() {
    // Iterate all cache keys, remove expired ones
  }
}
```

**Cache Key Generation:**
- Use simple hash function (e.g., djb2) to convert Instagram URL to short key
- Format: `video_cache_<hash>`
- Example: `video_cache_5381a7f2`

**Storage Format:**
```json
{
  "videoUrl": "https://...",
  "thumbnail": "https://...",
  "brandName": "Fitpage",
  "description": "...",
  "cachedAt": 1781064412000
}
```

#### 4. Video Player Component: `js/VideoPlayer.js`

**Purpose:** Custom HTML5 video player with glassmorphic UI

**Component Structure:**

```javascript
class VideoPlayer {
  constructor(container, videoData) {
    // container: DOM element to render into
    // videoData: { videoUrl, thumbnail, brandName, description }
    
    this.state = {
      playing: false,
      muted: true,
      hovering: false,
      currentTime: 0,
      duration: 0
    };
    
    this.render();
    this.attachEventListeners();
  }

  render() {
    // Create DOM structure:
    // <div class="video-player">
    //   <video src="videoUrl" poster="thumbnail"></video>
    //   <div class="video-overlay">
    //     <div class="info-panel"> <!-- top, hover-reveal -->
    //       <div class="brand-name">Fitpage</div>
    //       <div class="description">Brand awareness campaign</div>
    //     </div>
    //     <div class="controls"> <!-- bottom, always visible -->
    //       <button class="play-btn"></button>
    //       <div class="progress-bar">
    //         <div class="progress-fill"></div>
    //       </div>
    //       <button class="volume-btn"></button>
    //     </div>
    //   </div>
    // </div>
  }

  attachEventListeners() {
    // Video element events:
    // - loadedmetadata: Update duration
    // - timeupdate: Update progress bar
    // - ended: Reset to beginning, show play button
    
    // Container events:
    // - mouseenter: Start hover behavior (desktop only)
    // - mouseleave: End hover behavior
    // - click: Toggle play/pause
    
    // Control events:
    // - play-btn click: Play/pause
    // - progress-bar click: Seek to position
    // - volume-btn click: Toggle mute
  }

  onHoverStart() {
    // Desktop only (check for touch device)
    if (this.isTouchDevice()) return;
    
    this.state.hovering = true;
    this.playMuted(); // Start muted preview
    this.showInfoPanel(); // Fade in brand info at top
  }

  onHoverEnd() {
    if (this.isTouchDevice()) return;
    
    this.state.hovering = false;
    
    // Only pause if user hasn't clicked to play
    if (!this.state.clickedToPlay) {
      this.pause();
    }
    
    this.hideInfoPanel(); // Fade out brand info
  }

  onClick() {
    if (this.state.playing && !this.state.muted) {
      // Already playing with sound → pause
      this.pause();
    } else {
      // Not playing or muted → play with sound
      this.state.clickedToPlay = true;
      this.playWithSound();
    }
  }

  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
```

**Fallback Handling:**

If `videoData.success === false`:
```javascript
renderFallback() {
  // Show player shell with Instagram logo
  // Display "View on Instagram" link overlay
  // Link to original Instagram URL
  // Maintain glassmorphic aesthetic
}
```

### UI/UX Design

#### Visual Design (Glassmorphic Style)

**Color Palette:**
- Background: `rgba(255, 255, 255, 0.05)` (dark semi-transparent)
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Text (primary): `rgba(255, 255, 255, 0.9)`
- Text (secondary): `rgba(255, 255, 255, 0.6)`
- Progress bar fill: `#ffffff` or brand accent color
- Backdrop filter: `blur(10px)` for glassmorphic effect

**Typography:**
- Font family: `'Inter', sans-serif` (existing portfolio font)
- Brand name: 10-11px, weight 600
- Description: 8-9px, weight 400
- Controls: Icon-based (Font Awesome)

**Spacing & Layout:**

```
┌─────────────────────────────┐
│ Info Panel (top, hover)     │ ← 12px padding
│ Brand Name                   │   Fade in on hover
│ Description                  │   Fade out on unhover
└─────────────────────────────┘

      [Video Content Area]

┌─────────────────────────────┐
│ ▶ ━━━━━━━━●━━━━━━━━━━ 🔊  │ ← 12px padding
│   ↑    ↑           ↑    ↑   │   Always visible
│  Play Progress    Time Volume│
└─────────────────────────────┘
```

**Control Bar Layout:**
- Play button: 24px circular button, left-aligned
- Progress bar: Flex-grow, 3px height, rounded
- Volume button: 16px icon, right-aligned
- Gap between elements: 8-12px

**Info Panel Layout:**
- Background: Darker glassmorphic overlay (more opacity than controls)
- Border radius: 6px
- Padding: 10px
- Brand name above description
- Only visible on hover (desktop) or tap (mobile)

#### Responsive Behavior

**Desktop (>768px):**
- Hover to preview (muted)
- Click to play with sound
- Info panel appears on hover
- Grid: 3-4 columns

**Tablet (480px - 768px):**
- Tap to play (no hover preview)
- Info panel appears on tap (stays visible while playing)
- Grid: 2-3 columns

**Mobile (<480px):**
- Tap to play (no hover preview)
- Simplified controls (larger touch targets)
- Info panel appears on tap
- Grid: 1 column

**Touch Device Detection:**
```javascript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```

### Brand Name Mapping

**Configuration Object:**

Since Instagram URLs contain usernames but not necessarily brand names, create a mapping:

```javascript
const BRAND_MAP = {
  // Instagram username → Brand metadata
  'fitpage': {
    name: 'Fitpage',
    description: 'Fitness app promotional content'
  },
  'indiarunning': {
    name: 'India Running',
    description: 'Running community event coverage'
  },
  'captured': {
    name: 'Captured',
    description: 'Professional event videography'
  },
  'ascend': {
    name: 'Ascend',
    description: 'Brand promotional videos'
  },
  'vs': {
    name: 'VS',
    description: 'Creative video projects'
  },
  'wesness': {
    name: 'Wesness',
    description: 'Wellness brand content'
  },
  'baphm': {
    name: 'BAPHM',
    description: 'Fashion and lifestyle content'
  },
  // Default fallback
  'default': {
    name: 'Client Project',
    description: 'Professional video editing'
  }
};

function getBrandInfo(instagramUrl) {
  // Extract username from URL (e.g., /reel/ABC/ vs /username/reel/ABC/)
  // Match against BRAND_MAP keys
  // Return matching brand info or default
}
```

**Note:** This mapping will be refined based on actual Instagram URLs in the portfolio. Some URLs may not contain usernames (direct reel links), requiring a different approach (manual mapping by reel ID or keeping a separate data structure).

### Error Handling & Edge Cases

#### Scraping Failures

**Causes:**
- Instagram changes page structure
- Rate limiting (429 Too Many Requests)
- Network errors
- Timeout (>10s)

**Handling:**
1. Serverless function returns `{ success: false, fallbackUrl: <original-url> }`
2. VideoPlayer renders fallback UI:
   - Show Instagram logo in player area
   - Display "View on Instagram" button/link
   - Maintain glassmorphic styling for consistency
3. Log error to console for debugging (user won't see console)

#### Cache Quota Exceeded

**Cause:** localStorage limit reached (~5-10MB depending on browser)

**Handling:**
```javascript
set(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Clear oldest cache entries
      this.cleanup();
      // Retry once
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.warn('Cache storage full, skipping cache');
      }
    }
  }
}
```

#### Video Load Failures

**Cause:** Instagram CDN URL expired or unavailable

**Handling:**
1. Video element fires `error` event
2. Attempt to re-fetch video URL from serverless function (cache bypass)
3. If still fails, show fallback UI with "View on Instagram" link
4. Consider adding retry mechanism (1-2 attempts with delay)

#### Slow Serverless Function

**Cause:** Cold start, slow Instagram response, many concurrent requests

**Handling:**
1. Show loading spinner in video player area
2. Set timeout: 10 seconds
3. If timeout exceeded, show fallback UI
4. Cache Manager prevents redundant requests for same URL

### Performance Optimization

#### Lazy Loading

**Strategy:** Don't load all 40+ videos at once

```javascript
// Use Intersection Observer to load videos as they scroll into view
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const player = entry.target;
      player.loadVideo(); // Initialize video player
      observer.unobserve(player); // Stop observing
    }
  });
}, { rootMargin: '100px' }); // Start loading 100px before entering viewport
```

**Benefits:**
- Faster initial page load
- Reduces serverless function calls (only load visible videos)
- Better mobile performance

#### Video Preloading

**Strategy:** Set appropriate `preload` attribute

```html
<video preload="metadata" poster="thumbnail.jpg">
  <!-- Only preload metadata (duration, dimensions), not full video -->
  <!-- Full video loads on hover/click -->
</video>
```

**On hover:** Upgrade to `preload="auto"` to start buffering

#### Thumbnail Optimization

**Strategy:** Use Instagram's thumbnail URLs (already optimized)

- Instagram provides multiple thumbnail sizes
- Use medium size (~640px) for portfolio grid
- Lazy load thumbnails as well (Intersection Observer)

#### Serverless Function Optimization

**Caching on Serverless Side (Future Enhancement):**
- Use Vercel Edge Config or Redis to cache scraped URLs server-side
- Reduces redundant Instagram scraping across different users
- Not implemented in v1.0 (localStorage caching sufficient for single user)

### CSS Styling (video-player.css)

**Key Classes:**

```css
.video-player {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16; /* Instagram reel format */
  border-radius: 8px;
  overflow: hidden;
  background: #0a0a0a; /* Dark background while loading */
  cursor: pointer;
}

.video-player video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none; /* Allow clicks to pass through to video */
}

.info-panel {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.video-player:hover .info-panel {
  opacity: 1;
  transform: translateY(0);
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  pointer-events: auto; /* Enable clicks on controls */
}

.controls-inner {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  pointer-events: auto;
}

.play-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  pointer-events: auto;
}

.progress-fill {
  height: 100%;
  background: #fff;
  width: 0%;
  transition: width 0.1s linear;
}

.volume-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  pointer-events: auto;
}

/* Fallback UI */
.video-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
}

.fallback-logo {
  font-size: 48px;
  color: #666;
  margin-bottom: 16px;
}

.fallback-link {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 10px 20px;
  color: #fff;
  text-decoration: none;
  transition: background 0.2s ease;
}

.fallback-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Mobile/Touch optimizations */
@media (max-width: 768px) {
  .play-btn {
    width: 40px;
    height: 40px; /* Larger touch target */
  }
  
  .info-panel {
    font-size: 11px; /* Slightly larger on mobile */
  }
}
```

### Integration with Existing Code

**Changes to `script.js`:**

```javascript
// BEFORE (Instagram embeds):
function initInstagramEmbeds() {
  portfolioVideos.forEach((url, index) => {
    const embedItem = createEmbedElement(url, index);
    portfolioGrid.appendChild(embedItem);
  });
  loadInstagramEmbedScript();
  window.instgrm.Embeds.process();
}

// AFTER (Custom players):
async function initCustomVideoPlayers() {
  const fetcher = new VideoDataFetcher();
  const portfolioGrid = document.getElementById('portfolioGrid');
  const portfolioLoading = document.getElementById('portfolioLoading');
  
  // Batch fetch video data (uses cache where available)
  const videoDataArray = await fetcher.fetchBatch(portfolioVideos);
  
  // Create player for each video
  videoDataArray.forEach((videoData, index) => {
    const playerContainer = document.createElement('div');
    playerContainer.className = 'portfolio-item animate-on-scroll';
    playerContainer.style.transitionDelay = `${index * 0.1}s`;
    
    portfolioGrid.appendChild(playerContainer);
    
    // Initialize player (lazy loaded via Intersection Observer)
    const player = new VideoPlayer(playerContainer, videoData);
  });
  
  // Hide loading indicator
  portfolioLoading.style.display = 'none';
  
  // Set up scroll animations (existing function)
  setupPortfolioScrollAnimations();
}

// Update DOM ready handler
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initCustomVideoPlayers(); // Changed from initInstagramEmbeds
});
```

**Changes to `index.html`:**

```html
<!-- Add new script imports before closing </body> -->
<script src="js/cacheManager.js"></script>
<script src="js/videoDataFetcher.js"></script>
<script src="js/VideoPlayer.js"></script>
<script src="script.js"></script>

<!-- Add new stylesheet in <head> -->
<link rel="stylesheet" href="css/video-player.css">

<!-- Remove Instagram embed script (no longer needed) -->
<!-- <script async defer src="https://www.instagram.com/embed.js"></script> -->
```

### Testing Strategy

#### Unit Testing

**CacheManager:**
- Test get/set/has/clear methods
- Test TTL expiration logic
- Test quota exceeded handling
- Mock localStorage

**VideoDataFetcher:**
- Test cache hit vs cache miss logic
- Test batch fetching with concurrency limits
- Test retry logic on failures
- Mock fetch API

**VideoPlayer:**
- Test state transitions (idle → hovering → playing)
- Test event handlers (hover, click, touch)
- Test fallback rendering
- Test responsive behavior (touch vs desktop)

#### Integration Testing

**End-to-End Flow:**
1. Load page with empty cache
2. Verify serverless function calls for each video
3. Verify players render with video data
4. Verify cache populated in localStorage
5. Reload page
6. Verify cache hit (no serverless calls)
7. Verify players render from cache

**Serverless Function:**
1. Test with valid Instagram URLs
2. Test with invalid URLs (404)
3. Test with rate-limited responses (429)
4. Test timeout handling (>10s)
5. Verify response format matches spec

#### Manual Testing

**Browser Testing:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Interaction Testing:**
- Hover to preview (desktop)
- Click to play/pause
- Volume toggle
- Progress bar seeking
- Touch device behavior (no hover preview)
- Keyboard navigation

**Performance Testing:**
- Lighthouse score (target: >90 for performance)
- Network throttling (3G simulation)
- Cache warm vs cold performance
- Verify lazy loading (only visible videos fetch)

**Error Scenario Testing:**
- Disconnect network → verify fallback UI
- Clear cache → verify refetch works
- Simulate serverless function failure → verify fallback
- Simulate Instagram CDN down → verify error handling

### Deployment Plan

**Prerequisites:**
1. Ensure project is connected to Vercel
2. Verify `vercel.json` configuration (if needed)
3. Ensure `.gitignore` includes `.vercel/` directory

**Deployment Steps:**

1. **Commit changes to git:**
   ```bash
   git add .
   git commit -m "feat: replace Instagram embeds with custom glassmorphic video players"
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```
   Or push to `main` branch (if auto-deploy is configured)

3. **Verify deployment:**
   - Check serverless function logs in Vercel dashboard
   - Test portfolio page on production URL
   - Verify caching works
   - Test on mobile devices

4. **Monitor:**
   - Check Vercel analytics for function invocation count
   - Monitor error rates in Vercel logs
   - Verify staying within free tier limits (100GB bandwidth, 100GB-hours compute)

**Rollback Plan:**

If issues arise:
1. Revert git commit
2. Redeploy previous version
3. Instagram embeds will be restored (code still present in git history)

### Future Enhancements (Not in Scope for v1.0)

1. **Server-side caching:**
   - Use Vercel Edge Config or Redis to cache scraped URLs
   - Share cache across all users (reduce scraping by 99%+)
   - Requires paid Vercel plan or external Redis service

2. **Video analytics:**
   - Track play counts, completion rates per video
   - Use Vercel Analytics or Google Analytics events
   - Help identify top-performing portfolio pieces

3. **Video categorization:**
   - Filter videos by brand/client
   - Add category tabs above portfolio grid
   - Improve navigation for larger portfolios

4. **Thumbnail customization:**
   - Allow manual thumbnail upload (override Instagram default)
   - Better control over first impression

5. **Quality selector:**
   - Extract multiple quality URLs from Instagram
   - Allow user to select HD vs SD (bandwidth vs quality trade-off)

6. **Download option:**
   - Add button to download video (for client sharing)
   - Requires checking Instagram TOS compliance

7. **Keyboard shortcuts:**
   - Space: Play/pause
   - Arrow keys: Seek forward/backward
   - M: Mute/unmute
   - Improve accessibility

8. **Playlist mode:**
   - Auto-advance to next video on completion
   - Create curated playlists (e.g., "Best of Fitpage")

## Success Metrics

**Measurable Goals:**

1. **Performance:**
   - Initial page load: < 3s (3G network)
   - Cached page load: < 1s
   - Video playback start: < 1s after click/hover
   - Lighthouse performance score: > 90

2. **Reliability:**
   - Scraping success rate: > 95%
   - Cache hit rate (after warm-up): > 95%
   - Error fallback coverage: 100% (all failures show fallback UI)

3. **User Experience:**
   - Mobile responsiveness: 100% (all features work on touch devices)
   - Browser compatibility: Chrome, Firefox, Safari (latest 2 versions)
   - Accessibility: WCAG 2.1 AA compliance (keyboard nav, ARIA labels)

4. **Cost:**
   - Hosting cost: $0/month (Vercel free tier)
   - Bandwidth usage: < 50GB/month (well within free tier)
   - Serverless function calls: < 1000/month (after cache warm-up across users)

**Qualitative Goals:**

1. **Visual Polish:** Custom players should feel more professional than Instagram embeds
2. **Brand Consistency:** Glassmorphic design matches portfolio's dark cinematic theme
3. **User Control:** Hover-to-preview and click-to-play feel intuitive and non-intrusive
4. **Maintainability:** Code is modular, well-documented, and easy to update

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Instagram changes page structure, breaks scraping | High | Medium | Implement robust parsing with fallback; monitor error rates; add alerts |
| Rate limiting on serverless function | Medium | Low | Implement aggressive caching (7-day TTL); add server-side cache in future |
| localStorage quota exceeded | Low | Low | Implement cleanup logic; store only essential data (URLs, not full metadata) |
| Vercel free tier limits exceeded | Medium | Low | Monitor usage dashboard; optimize caching; upgrade plan if needed |
| Video URLs expire | Medium | Medium | Implement re-fetch on video load failure; cache invalidation on errors |
| Poor mobile performance | Medium | Low | Lazy loading; preload="metadata"; test on real devices early |
| Instagram TOS violation | Low | High | Personal portfolio use is low-risk; not commercial scraping; document decision |

## Conclusion

This design replaces Instagram embeds with custom glassmorphic video players, providing a professional, branded portfolio experience while maintaining zero hosting costs on Vercel's free tier. The solution balances performance (aggressive caching), reliability (graceful error handling), and maintainability (modular code structure).

**Key Design Decisions:**

1. **Serverless scraping over self-hosting:** Eliminates storage costs and manual video management
2. **7-day cache TTL:** Videos rarely change; long TTL minimizes serverless calls
3. **Glassmorphic UI:** Matches portfolio aesthetic, modern and professional
4. **Hover-to-preview:** Engaging UX without being overwhelming (vs autoplay-on-scroll)
5. **Lazy loading:** Only fetch/render videos as they scroll into view

**Next Steps:**

1. Review and approve this design document
2. Create detailed implementation plan (task breakdown)
3. Implement serverless function first (can test independently)
4. Implement frontend components (VideoPlayer, CacheManager, VideoDataFetcher)
5. Integrate with existing portfolio code
6. Test thoroughly (unit, integration, manual)
7. Deploy to Vercel production
8. Monitor performance and error rates

---

**Approval Sign-off:**

- [ ] Design approved by stakeholder
- [ ] Technical approach validated
- [ ] Risk assessment reviewed
- [ ] Ready to proceed to implementation planning

**Document Version History:**

- v1.0 (2026-06-10): Initial design specification
