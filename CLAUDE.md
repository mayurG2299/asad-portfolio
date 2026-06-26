# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

No build step. Serve from the project root:

```bash
python3 -m http.server 3000
# Visit http://localhost:3000
```

The `/api/instagram-video.js` serverless function only runs on Vercel — it won't work locally. On localhost, all portfolio video players will fall back to "View on Instagram" links.

## Deployment

Hosted on Vercel with auto-deploy on push to `main`. No config needed — Vercel detects it as a static site with a serverless function in `/api/`.

## Architecture

This is a vanilla JS single-page site with no framework or build toolchain. Scripts are loaded in dependency order at the bottom of `index.html`:

```
brandConfig.js → cacheManager.js → videoDataFetcher.js → VideoPlayer.js → script.js
```

**Data flow for the portfolio grid:**

1. `script.js` holds the `portfolioVideos` array (Instagram reel URLs, grouped by client)
2. On DOM ready, `initCustomVideoPlayers()` creates a `CacheManager` + `VideoDataFetcher`
3. `VideoDataFetcher.fetchBatch()` calls the Vercel serverless function `/api/instagram-video?url=...` (with concurrency limit of 5), which scrapes Instagram pages to extract direct `.mp4` URLs and thumbnails
4. Results are cached in `localStorage` (7-day TTL, djb2 hash keys under the `video_cache_` namespace)
5. For each result, a `VideoPlayer` instance renders into the portfolio grid with hover-to-preview (muted) and click-to-play (with sound) behavior
6. If the API fails, `VideoPlayer.renderFallback()` renders an Instagram link instead

**Brand labeling:** `getBrandInfo()` in `brandConfig.js` matches Instagram URLs against `BRAND_MAP` keys (lowercase username substrings). Since most portfolio URLs go through short reel IDs (not username paths), the default "Client Project" fallback fires often — to correctly label a video, the URL must contain the brand's username string.

## Updating Portfolio Videos

Edit the `portfolioVideos` array in `script.js` (top of file). URLs are grouped by client with comments. Order in the array = order in the grid.

To correctly label a new video with a brand, either:
- Use a URL that contains the brand's Instagram username (e.g. `instagram.com/fitpage/reel/...`)
- Or add a reel-ID-to-brand mapping to `BRAND_MAP` in `js/brandConfig.js`
