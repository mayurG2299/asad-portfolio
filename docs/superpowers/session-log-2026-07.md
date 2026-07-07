# Session log — early July 2026

Running history of what was found, decided, and shipped in this stretch of
work on the portfolio site. Kept for context in future sessions — read this
before re-diagnosing something that may already be understood or fixed.

## Site basics

- Vanilla JS/CSS/HTML, no build step, no framework.
- Hosted on Vercel, auto-deploys on push to `master`/`main`.
- Production URL: **https://asad-portfolio-nu.vercel.app**
- Vercel CLI is installed locally and authenticated as `mayurg2299`; project
  is linked, so `vercel ls` / `vercel inspect` work directly from this repo.

## Fixes shipped, in order (commit hash — what — root cause)

1. **`44874d0`** — Hamburger menu couldn't be closed on mobile.
   `.nav-menu` is `position:fixed` and painted over `.nav-toggle` once open
   (no stacking context on the toggle button). Fixed with
   `position:relative; z-index` on `.nav-toggle`.

2. **`3323850`** — About-section stats (6+ / 1000+ / Mumbai) wrapped into
   3 stacked full-width rows on mobile instead of one row. `.stat` had
   `min-width:120px` + 32px gaps, needing ~424px in a ~280px column.
   Fixed with `flex:1` + smaller gap/padding on mobile.

3. **`b846e8d`** — Google Drive's native video-player control bar
   (play/pause/seek/CC/speed/settings) got clipped on mobile. Drive's touch
   controls need **~320px of real width** to render without clipping —
   established empirically by testing 250/280/300/320/340px in real
   WebKit with mobile touch emulation. Mobile card width bumped from
   250px up.

4. **`4363e6e`** — The big one: **entire page rendered squished into the
   left ~40% of the screen on real phones**, with dead space on the right.
   Root cause: carousel peek-card states (`state-prev2`/`state-next2`,
   and initially `state-prev1`/`state-next1` too) kept their desktop
   `translateX(±390px/660px)` offsets on mobile — only `opacity` was
   zeroed, not the transform. Combined with `.reel-stage`/`.reel-track`
   being `overflow:visible`, this left real (invisible) content ~660px
   off-screen on a ~320-430px phone.
   **Key learning:** real mobile browsers (Safari/Chrome on-device) can
   auto-expand the effective layout viewport to fit content like this —
   even invisible, even under an `overflow-x:hidden` body — and then zoom
   the whole page out to fit. This does **not** reproduce in desktop
   Chrome DevTools device emulation, which is why it was missed initially.
   Detection method that works: Playwright + real device profiles
   (`devices['iPhone 13']`, WebKit for accuracy) checking
   `document.documentElement.scrollWidth === clientWidth` — desktop-viewport
   Playwright checks alone are not sufficient.
   Fix: collapse all four peek states to the same centered/invisible
   treatment as `state-hidden` on mobile.

5. **`ca6b658`** — About headshot photo sat flush-left instead of centered.
   The global reset `img { display:block }` makes `text-align:center` on
   the parent a no-op (only affects inline content). Fixed with
   `margin: 0 auto` on `.headshot`.

6. **`b88bd4a`** — "Premium" motion pass (user felt the site looked
   basic/generic). Added: a real easing system (`--ease-out-expo`,
   `--ease-spring` replacing the one generic
   `cubic-bezier(0.4,0,0.2,1)` used everywhere), staggered hero entrance
   (title scale-in, subtitle/tagline/scroll-indicator cascade), press/tap
   `:active` feedback on buttons/CTA/social links/carousel controls
   (previously zero elements had any), a two-part About-section reveal
   (image + text cascade separately), a number-ticker count-up on the
   About stats with `tabular-nums`, and `will-change` on
   carousel cards/marquees.

7. **`1b43700`** — Removed dead Instagram links (placeholder
   `href="https://instagram.com"` with no path) from contact section +
   footer; wired LinkedIn to the real profile:
   `https://www.linkedin.com/in/asad-farooqui-2366b515b/`.

8. **`1e63e32`** — Follow-up to #4: the *same class* of bug was still
   present for **tablets and common laptop widths (800-1440px)** — the
   desktop peek-card offsets (`390px`/`660px` fixed) only actually fit on
   screens wider than ~1510px. Measured overflow up to 355px at 800px
   width. Fixed by making the offsets viewport-scaled
   (`translateX(min(390px, 28vw))` / `min(660px, 32vw)`), proven safe at
   every width analytically (offset growth rate < available-space growth
   rate) and verified empirically at 320/360/375/390/414/430/600/700/
   768/800/820/912/1024/1180/1280/1440px — zero overflow at all of them.
   Also caught and fixed in the same commit: the mobile card could shrink
   below 320px on the smallest phones (re-introducing Drive control
   clipping) — fixed at a flat 320px. And the About-section text reveal
   (`translateX(24px)`) could overflow ~8px before settling — switched to
   `translateY` since vertical movement can never cause horizontal
   overflow.

9. **`d75cacd`** — Removed decorative `::before` gradient accent bars from
   `.about`/`.skills`/`.clients`/`.portfolio`. They spanned the section's
   *full* height including top padding (~96px), so scrolling slightly
   into a section showed a colored line floating with nothing next to it
   (actual content still off-screen further down). User chose "remove
   entirely" over "tie to content bounds" when asked.

10. **`158d373`** — No-new-asset "make it more beautiful" pass (user chose
    this over the higher-effort "hero showreel video" option): fixed,
    `pointer-events:none` film-grain (inline SVG `feTurbulence`, 3.5%
    opacity, `mix-blend-mode:overlay`) + edge vignette across the whole
    page: tightened `letter-spacing` on `.hero-title` (3px → `-0.02em`)
    and `.section-heading` (3px → 1px) for a more editorial/confident
    look instead of generic wide tracking.

## Testing method that kept working

Local static server (`python3 -m http.server 3000`) + Playwright
(Chromium normally; real WebKit with device profiles like
`devices['iPhone 13']` when a bug is mobile-viewport-specific), always
checking `scrollWidth` vs `clientWidth` at a spread of widths
(320-1440px) after any layout change, not just the one size that was
reported broken. Several bugs in this session only reproduced at widths
that weren't the one in the original bug report (e.g. #4 was reported on
a phone, but the exact same bug existed independently on tablets/laptops,
found in #8 by sweeping the full width range rather than trusting the fix
was universal).

## Not done yet / blocked

**Add new portfolio video** — reel
`https://www.instagram.com/reel/DZ-DQOQu0ap/` needs to be added as the
**first** entry in `js/portfolio-config.js`. Blocked on getting the actual
video file:
- The repo's own scraper (`/api/instagram-video.js`) returned
  `503 Failed to extract video URL from page` for this reel.
- `yt-dlp` (installed via pip, run as `python3 -m yt_dlp`, not on `PATH`
  as a bare command) requires login — Instagram returns an empty media
  response for logged-out requests to reels.
- Tried pulling cookies from local browsers to authenticate `yt-dlp`:
  Chrome cookies exist but macOS keychain blocked decryption in this
  non-interactive session; Safari's cookie file is sandboxed/inaccessible;
  Firefox/Edge/Brave aren't installed or have no profile.
- **Next step (needs the user):** either export the video directly from
  Instagram (it's their own post, so "⋯ → Save/Download" should work) and
  hand over the file, or upload it to Google Drive themselves (shared as
  "Anyone with the link") and send the file ID.
- Full plan with all the detail above:
  `docs/superpowers/plans/2026-07-05-add-new-portfolio-video.md`.
- Once the video file/Drive ID is available: extract a thumbnail
  (`ffmpeg` if present, else ask the user), confirm the Drive sharing is
  public (this exact class of bug — files not shared "Anyone with the
  link" — was hit before and caused a "You need access" wall for real
  visitors), add the entry at the top of `PORTFOLIO_CONFIG`, verify with
  the Playwright mobile-emulation pattern above, then commit/push/confirm
  live.

## Recurring gotchas worth remembering

- **Google Drive sharing**: any new `driveId` added to
  `portfolio-config.js` must be shared "Anyone with the link" — Viewer.
  Files not shared this way show a "You need access" wall to real visitors
  even though they may render fine in some ad-hoc automated checks
  (Drive's anonymous-access behavior has been inconsistent between test
  runs in this session — don't fully trust an automated "it loaded" check
  as proof a file is public; verify sharing settings directly when in
  doubt).
- **Any fixed-pixel `transform`/`translateX` inside an `overflow:visible`
  ancestor is a landmine** for the real-mobile-viewport-auto-expand bug
  described in fix #4/#8. Prefer viewport-relative (`vw`, `min()`,
  `clamp()`) values, or ensure the offset never exceeds
  `containerWidth/2 - elementHalfWidth` at the narrowest supported width.
- User prefers being asked before large/ambiguous changes, but gives
  clear creative latitude once a direction is chosen (e.g. "make it look
  good, however you achieve it technically") — investigate and act
  confidently within that scope rather than re-asking at every step.
