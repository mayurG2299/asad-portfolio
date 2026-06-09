# Asad Farooqi - Video Editor Portfolio

Professional portfolio website showcasing video editing work for Asad Farooqi, a Mumbai-based video editor specializing in motion graphics and short-form content.

## 🚀 Live Site

[View Portfolio](https://asad-portfolio.vercel.app) *(Update after deployment)*

## 📋 About

Single-page portfolio featuring:
- Hero section with bold gradient design
- Professional bio and experience
- Skills showcase (Adobe Premiere Pro, Final Cut Pro, After Effects)
- Client logos (Zee5, Fitpage, Tellychakkar, and more)
- Portfolio grid with 30+ Instagram reel embeds
- Contact information and social links

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Styling:** CSS Grid, Flexbox, Custom Gradients
- **Fonts:** Google Fonts (Inter)
- **Video:** Instagram oEmbed API
- **Hosting:** Vercel (Free Tier)
- **Deployment:** Auto-deploy from GitHub

## 📁 Project Structure

```
asadPortfolio/
├── index.html      # Main page
├── styles.css      # All styling
├── script.js       # Interactions
├── assets/         # Images
└── README.md       # This file
```

## 🔄 Updating Portfolio Videos

To add/remove videos:

1. **Open script.js in any text editor**
   - Location: `/script.js`
   - Find the `portfolioVideos` array (around line 10)

2. **Add Instagram reel URL**
   ```javascript
   const portfolioVideos = [
     'https://www.instagram.com/reel/NEW_REEL_ID/', // Add new URL here
     'https://www.instagram.com/reel/EXISTING_ID/',
     // ... rest of URLs
   ];
   ```

3. **Save and deploy**
   ```bash
   git add script.js
   git commit -m "Update portfolio videos"
   git push
   ```

4. **Wait 30 seconds** - Vercel auto-deploys
5. **Refresh portfolio site** - new video appears

## 🌐 Local Development

No build step required. Just open `index.html` in a browser:

```bash
# Option 1: Direct open
open index.html

# Option 2: Local server (Python)
python3 -m http.server 8000
# Visit http://localhost:8000

# Option 3: Local server (Node)
npx http-server
```

## 📦 Deployment

### Initial Setup

1. Push code to GitHub
2. Sign up at [vercel.com](https://vercel.com) (use GitHub login)
3. Click "New Project" → Import repository
4. Deploy (auto-detects static site)
5. Get free `.vercel.app` subdomain

### Custom Domain (Optional)

1. Purchase domain (Namecheap, GoDaddy, etc.)
2. In Vercel: Settings → Domains → Add Domain
3. Update DNS at domain registrar with Vercel nameservers
4. SSL auto-enabled within 24 hours

### Auto-Deployment

Every push to `main` branch triggers automatic deployment on Vercel.

## 🎨 Design Credits

- **Design:** Bold Gradient aesthetic with purple/violet gradients
- **Typography:** Inter (Google Fonts)
- **Icons:** Email, phone, Instagram icons (inline SVG)

## 👤 Contact

**Asad Farooqi**  
Video Editor & Motion Designer

- Email: asadfarooqui96@gmail.com
- Phone: +91 8779451008
- Location: Mumbai, India

## 📄 License

© 2026 Asad Farooqi. All rights reserved.
