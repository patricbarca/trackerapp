# Solar AI Analytics

Marketing website for **Solar AI Analytics** — performance dashboards, performance ratio (PR) analytics and custom tools for solar plants in Australia.

## Structure

```
index.html        Single-page site (hero, services, demo dashboard, PR calculator, process, contact)
css/styles.css    Styles (responsive, no framework)
js/main.js        Mobile nav, demo PR chart (synthetic data), PR calculator, contact form
assets/           Logo / favicon
```

No build step. Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

## Before going live

- Set `CONTACT_EMAIL` in `js/main.js` to the real inbox (currently a placeholder).
- The contact form uses `mailto:`; swap for a form service (e.g. Formspree) or a backend if preferred.
- Demo dashboard figures are generated sample data and are labelled as such on the page.

## Deploy

Works as-is on GitHub Pages (Settings → Pages → deploy from branch), Netlify, Vercel or any static host.
