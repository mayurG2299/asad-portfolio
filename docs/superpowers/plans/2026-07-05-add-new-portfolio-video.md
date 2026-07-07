# Add new Instagram reel as first portfolio entry

**Reel to add:** https://www.instagram.com/reel/DZ-DQOQu0ap/
**Requirement:** must appear as the *first* card in the portfolio carousel.

## Why this isn't a one-step task

The carousel (`js/Carousel.js`) plays videos from Google Drive, not directly
from Instagram. Each entry in `js/portfolio-config.js` needs:

- `driveId` — a Google Drive file ID for the actual video, shared as
  "Anyone with the link" (see earlier fix where several existing files
  weren't public and showed Google's "You need access" wall).
- `thumb` — a JPG filename living in `assets/thumbs/`.
- `instagramUrl` — just a metadata/fallback link, not the video source.

I don't have the video file for this reel yet, and downloading it directly
failed on the first attempt.

## What's already been tried / ruled out

- Repo's own scraper (`/api/instagram-video.js`, deployed at
  `/api/instagram-video?url=...`) returned `503 Failed to extract video URL
  from page` for this reel. It's the same scraper used by the old
  (now-replaced) Instagram-embed video player — it's known to be fragile
  per `CLAUDE.md`.
- No script or doc in this repo (`README.md`, `CONTRIBUTING.md`,
  `CLAUDE.md`, `docs/superpowers/**`) documents how the existing Drive
  videos were downloaded/uploaded. The commit that migrated to the Drive
  carousel (`aac4a63`) added `driveId`s that were already populated —
  whatever process created them isn't captured anywhere in this repo.
- `yt-dlp` is installed via pip (`2025.10.14`) but isn't on `PATH` as a
  bare command — was mid-way through finding the right invocation
  (`python3 -m yt_dlp ...` or locating its installed console-script path)
  when this session paused.
- `instaloader` / `gallery-dl` are not installed.
- This session has Google Drive MCP tools available
  (`Google_Drive__create_file`, `search_files`, etc.) — likely how the
  "other laptop" session got videos into Drive after downloading them.
  Not yet tested for actually uploading a video file.

## Plan for tomorrow

1. **Get the video file.**
   - Try `python3 -m yt_dlp "https://www.instagram.com/reel/DZ-DQOQu0ap/"`
     (or find yt-dlp's actual installed script path) to download the reel.
   - If that fails (Instagram often requires a logged-in session/cookies
     for reels), the fallback is: user downloads the video manually
     (any Instagram downloader, or "Save" if it's their own post) and
     hands me the local file.
2. **Get a thumbnail.**
   - If `ffmpeg` is available, extract a representative frame from the
     downloaded video (`ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 thumb.jpg`).
   - Otherwise ask the user for one, matching the naming convention seen
     in `assets/thumbs/` (`"<brand> - <shortcode>.jpg"`).
3. **Get it into Google Drive.**
   - Use the Google Drive MCP tool to upload the video file to the same
     Drive location/folder as the other portfolio videos (need to confirm
     which folder — check with user or `Google_Drive__search_files` for
     the folder containing known driveIds like `1PZGUAM3lawlZzMAX8lVcA5AUlX78vKrY`).
   - Set sharing to "Anyone with the link" — Viewer (this was the exact
     failure mode fixed earlier in this project; don't skip it).
   - Grab the resulting file ID for `driveId`.
4. **Wire it into the config.**
   - Add a new entry at the very top of the `PORTFOLIO_CONFIG` array in
     `js/portfolio-config.js` (position in this array = position in the
     grid, per the file's own header comment) with brand/category/
     description, the new `driveId`, `thumb`, and
     `instagramUrl: 'https://www.instagram.com/reel/DZ-DQOQu0ap/'`.
5. **Verify.**
   - Run locally, confirm the new card renders first and plays without
     the "You need access" wall or clipped controls (reuse the Playwright
     mobile-emulation check pattern used earlier in this project).
6. **Ship.**
   - Commit, push to `master`, wait for Vercel auto-deploy, confirm live.

## Open questions for the user

- Which Google Drive folder do the existing portfolio videos live in? (So
  the new upload lands in the same place, not scattered.)
- If yt-dlp can't get the video (common for Instagram without login
  cookies), can you export/download it yourself and hand me the file?
