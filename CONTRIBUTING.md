# Contributing to Asad Portfolio

## Development Setup

1. Clone repository:
   ```bash
   git clone https://github.com/[username]/asad-portfolio.git
   cd asad-portfolio
   ```

2. No build step needed - pure HTML/CSS/JS

3. Run local server:
   ```bash
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

## File Structure

- `index.html` - Single-page HTML structure (all sections)
- `styles.css` - All styling (responsive, animations, gradients)
- `script.js` - Navigation, Instagram embeds, scroll animations
- `assets/` - Images and media files

## Making Changes

### Adding a New Section

1. Add HTML structure to `index.html`
2. Add corresponding styles to `styles.css`
3. Add any needed JavaScript to `script.js`
4. Test responsively (mobile, tablet, desktop)

### Updating Styles

- Follow existing CSS variable naming conventions
- Use mobile-first responsive approach
- Test across browsers (Chrome, Firefox, Safari)

### Modifying JavaScript

- Follow existing code structure
- Comment complex logic
- Test in browser console for errors

## Testing Checklist

- [ ] Desktop (1280px+) - all features work
- [ ] Tablet (768px) - responsive layout correct
- [ ] Mobile (375px) - single column, hamburger menu functional
- [ ] Instagram embeds load successfully
- [ ] No console errors
- [ ] Lighthouse score 90+ (Performance, Accessibility)

## Deployment

Deployment is automatic via Vercel:
- Push to `main` branch → auto-deploys in 30 seconds
- Check Vercel dashboard for deployment status

## Code Style

- **HTML**: Semantic tags, proper indentation (2 spaces)
- **CSS**: BEM-like naming, CSS variables for colors/spacing
- **JavaScript**: ES6+, clear function names, commented sections

## Questions?

Open an issue on GitHub or contact maintainer.
