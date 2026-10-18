# loweffortgeoff — profile README

This repo is the source of https://github.com/loweffortgeoff. GitHub renders the
`README.md` from a repo whose name matches your username at the top of your
profile. Nothing else about the profile is customizable beyond Settings.

## Going live

1. Create a **public** repo named exactly `loweffortgeoff` on your account.
2. Push this directory to it.
3. Done — the README appears on your profile immediately. (If it doesn't, the
   repo is private or the README is missing from the default branch.)

```bash
git remote add origin git@github.com:loweffortgeoff/loweffortgeoff.git
git push -u origin main
```

## Before you push: the two GitHub links

Tucked and Offshoots point at `github.com/loweffortgeoff/Bookmark-Collections`
and `/Offshoots`, **both of which are currently private**. A public profile README
linking to a private repo gives every visitor a 404.

Two options:

**A. Make them public.** The tiles then work as written.

```bash
gh repo edit loweffortgeoff/Bookmark-Collections --visibility public --accept-visibility-change-consequences
gh repo edit loweffortgeoff/Offshoots --visibility public --accept-visibility-change-consequences
```

Be aware this exposes the full commit history and code, not just the README.

**B. Point them somewhere public.** Edit `url` in `apps.json` — for example the
site, or an App Store listing once they ship — then `npm run build`.

## Editing the app grid

Everything on the grid comes from `apps.json`. Do not hand-edit the markup
between `<!-- bento:start -->` and `<!-- bento:end -->` in `README.md`; it is
regenerated.

```json
{
  "id": "tucked",              // tile-<id>.png
  "name": "Tucked",
  "tagline": "…",              // keep under ~85 characters (2 lines)
  "chips": ["SwiftData", "CloudKit", "Share Sheet"],   // 3 reads best
  "url": "https://…",          // where the tile links
  "icon": "assets/icons/tucked.png",
  "accent": "#A8763E",         // status dot + icon glow
  "status": "App Store"        // or "In development"
}
```

Adding an app: drop its icon in `assets/icons/`, add an entry, run the build.
Tile order in the array is grid order, two per row.

## Building

```bash
npm run build      # render hero + tiles, rewrite the README grid
npm run preview    # render .build/preview-light.png and preview-dark.png
```

The build drives headless Chrome to screenshot HTML at a 2× device pixel ratio,
so the PNGs are retina-crisp. Override the browser with `CHROME=/path/to/chrome`.

Preview goes through GitHub's own `POST /markdown` API, which means what you see
is what GitHub's sanitizer actually allows — not an approximation.

## Assets

| File | Size (logical) | Notes |
|---|---|---|
| `docs/hero.png` | 828 × 280 | dark theme |
| `docs/hero-light.png` | 828 × 280 | light theme, chosen by `prefers-color-scheme` |
| `docs/bento/tile-*.png` | 414 × 140 | rendered at 2×, transparent corners |

The hero uses Fraunces and Inter on the live site but falls back to Georgia and
SF Pro here. Install both fonts locally (`brew install --cask font-fraunces
font-inter`) and Chrome will pick them up on the next build.

## Profile settings (not in this repo)

- **Settings → Public profile**: bio, company, location, website, social links.
- **Status**: the emoji + message next to your name. Not settable from a repo.
- **Pinned repos**: 6 max, public only. Pin `loweffortgeoff`, `easy-write`-style
  repos, or the apps once public.
- **Achievements** are automatic and not customizable.

## What GitHub will not let you do

No `<style>`, `<script>`, `<iframe>`, `style="…"` attributes, CSS classes, hover
effects, or custom fonts. Layout is limited to `<img width>`, `<picture>`,
`align`, tables, and `<details>`. Anything more complex has to be baked into the
images — which is why the tiles are PNGs instead of markup.
