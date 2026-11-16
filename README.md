# Linewise website

The marketing site for Linewise. Plain HTML, CSS and JavaScript: no build step and no dependencies, so it can go on any static host (GitHub Pages, Netlify, Cloudflare Pages).

| Path | What's there |
|---|---|
| `index.html` | The page |
| `css/site.css` | All styles; the sheet colours follow the app's `Theme.swift` |
| `js/site.js` | The typing demo, guide explorer, theme switcher and live date answers |
| `js/data.js` | Generated: every example sheet, with answers and syntax colours worked out by the real Linewise engine |
| `assets/` | App icon and app screenshots |
| `tools/demo-data/` | Regenerates `js/data.js`; edit `sheets.json` to change the examples |

Preview locally:

```sh
python3 -m http.server 4173 --directory linewise-website
```

After changing the examples, or the engine in `../Linewise`, regenerate the answers:

```sh
linewise-website/tools/demo-data/make.sh
```

Light and dark follow the visitor's system setting. The sun/moon button in the nav overrides it, and the choice is remembered in that browser until it matches the system again. Every colour is a token in the two sets at the top of `css/site.css`.

The Guide section reads its examples straight from `Linewise/Sources/Linewise/GuideView.swift`, so it stays in step with the app. A few date and time answers (days until Dec 25, 3pm in Tokyo, time in New York) are worked out in the visitor's browser so they're always current.
