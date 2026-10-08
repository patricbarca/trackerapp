# Solar AI Analytics

Marketing website for **Solar AI Analytics** — performance dashboards, performance ratio (PR) analytics and custom tools for solar plants in Australia.

## Structure

```
index.html        English single-page site (hero, services, AI agents & automation, demo, PR calculator, process, packages, about, contact)
es/index.html     Spanish version (same CSS/JS; language detected from <html lang>)
css/styles.css    Styles (responsive, no framework)
js/main.js        Mobile nav, demo PR chart (synthetic data), PR calculator, contact form
assets/           Logo / favicon
```

No build step. Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

## Before going live

- Contact email: hello@solarai.app (`CONTACT_EMAIL` in `js/main.js`).
- The contact form uses `mailto:`; swap for a form service (e.g. Formspree) or a backend if preferred.
- Demo dashboard figures are generated sample data and are labelled as such on the page.

## Deploy

GitHub Pages: after merging to `main`, go to Settings → Pages → Source "Deploy from a branch" → `main` / `(root)`. `.nojekyll` is included. The site will be served at `https://patricbarca.github.io/trackerapp/` (Spanish at `/es/`).

It also works as-is on Netlify, Vercel or any static host.
