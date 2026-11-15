# Portofolio — Fadli Darusalam

Static portfolio site. Poster split: an identity plate on the left, a live
data-rain panel and the work list on the right. Monospace only, no framework,
no build step, no trackers.

```
index.html          plate + deck markup
assets/style.css    four palette blocks at the top, then the components
assets/main.js      clock, palette cycling, copy-email
assets/og.png       social preview card (1200x630)
tools/og-card.html  source for that card
archive/v1..v4/     earlier designs, kept for comparison
```

## Deploy to GitHub Pages

1. Create a repo on GitHub (e.g. `portfolio`).
2. Push this folder:

```bash
git init -b main
git add .
git commit -m "portfolio: poster split with palettes"
git remote add origin git@github.com:bolt-11/portfolio.git
git push -u origin main
```

3. Repo → **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / folder **/ (root)**
   - Save, wait ~1 minute.

Live at `https://bolt-11.github.io/portfolio/`. Want the short URL
`https://bolt-11.github.io`? Name the repo exactly `bolt-11.github.io`.

### After the first deploy

Update the absolute URLs in `index.html` so link previews resolve:

- `<link rel="canonical" href="...">`
- `<meta property="og:url" content="...">`
- the `"url"` field in the JSON-LD block

## Palettes

Eight palettes, switched with the `p` key or the button in the plate footer;
the choice persists in `localStorage` under `fd-palette`.

| id | plate | deck | feel |
|---|---|---|---|
| `forest` (default) | deep green | near-black green | all dark, terminal |
| `ember` | deep rust | near-black warm | all dark, warm |
| `night` | dark slate | blue-black | all dark, cool |
| `plum` | dark purple | near-black plum | all dark, muted |
| `clay` | warm terracotta | near-black warm | clay poster |
| `sage` | muted green | deep olive-black | calm, botanical |
| `dusk` | dusty blue | navy-black | cool, technical |
| `cream` | sand | paper | fully light, print-like |

Each palette is one block in `assets/style.css` (`:root` for clay,
`[data-palette="sage"]` and so on). A palette must define the plate group
(`--plate-bg`, `--plate-ink`, `--plate-line`) and the deck group (`--bg`,
`--ink`, `--ink-2`, `--dim`, `--rule`, `--accent`, `--dots`). Minimum measured
contrast across all eight is 5.0:1, `--dim` at 11px included.

The four dark palettes also set `--split` (a translucent white hairline), because
a dark plate against a dark deck needs a seam to read. Light palettes leave it
`transparent`; `.plate` uses it as `border-right` on desktop and `border-bottom`
when the layout stacks.

The palette id also lives on `<html data-palette="...">` at load, so the page
paints correctly before JS runs.

## Editing content

| What | Where |
|---|---|
| Name and role | `<aside class="plate">` → `.plate__head` |
| The counts at the top | `.facts` |
| Contact rows | `.plate__links` — copy one `<a class="plate__link">` |
| Projects | `<section id="work">` — copy one `<article class="item">` |
| Articles | `<section id="writing">` — same `<article class="item">` shape |
| CTF entries | `<section id="ctf">` — replace the `nothing logged yet` line |

## The rain panel

`<canvas id="rain">` in `assets/main.js` draws columns of hex/symbol characters
falling at different speeds. Trails are drawn explicitly (9 characters deep, alpha
decaying), so the panel stays transparent over the deck's dot grid instead of
painting a solid block.

Colour comes from `--accent`, so it recolours with the palette. It stops rendering
when scrolled out of view or when the tab is hidden, and under
`prefers-reduced-motion` it paints one static frame. Tune `COL_W` / `ROW_H`
(spacing), `TRAIL` (length) or the `speed` range in `build()`.

Inside the panel sits the handle plate — `.tag`: a word, a blinking caret, and
nothing else. The `TEXT` array in `handleTag()` (`assets/main.js`) holds 48
entries: the two handles plus pentesting vocabulary, web (`idor`, `sqli`, `xss`,
`ssrf`, `rce`, `lfi`, `xxe`, `csrf`, `cors`, `csp`, `waf`, `jwt`, `oauth`,
`saml`, `bac`, `mitm`, `recon`, `fuzz`, `bypass`, `exploit`, `payload`, `shell`,
`privesc`, `enum`, `0day`, `poc`, `dns`, `tls`, `cve`) and mobile (`deeplink`,
`intent`, `smali`, `frida`, `hook`, `apk`, `adb`, `jadx`, `webview`, `keystore`,
`overlay`, `tapjack`, `clipboard`, `pinning`, `encrypt`, `sandbox`, `root`).

The order is shuffled, not sequential: `reshuffle()` builds a Fisher–Yates deck
each pass, so every word shows once before any repeat, and the first word of a
new pass is swapped if it matches the last one shown. Keep entries short — the
widest test word is 164px against a 908px panel, and `data-size` (`l`/`m`/`s`)
steps the type down if a longer string is added later.

The plate itself drifts like a screensaver: constant velocity, reversed at every
edge, with a small random nudge on each bounce so the path never repeats. Every
switch runs a decode — random glyphs settle left-to-right into the real text —
then holds 1.8s. Speed lives in `SPEED_X` / `SPEED_Y` (px per second, default
26 / 17); under `prefers-reduced-motion` the plate stays put and shows the first
word.

## Keyboard

| Key | Action |
|---|---|
| `p` | next palette |

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Social preview card

`assets/og.png` is rendered from `tools/og-card.html` at 1200×630 in the clay
palette. Edit the HTML, screenshot at that size, save over the PNG — the card
should match the default palette or the link preview contradicts the site.
