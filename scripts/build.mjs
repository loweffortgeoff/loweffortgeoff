#!/usr/bin/env node
/**
 * Regenerates every image in docs/ and the app grid in README.md.
 *
 *   node scripts/build.mjs
 *
 * Requires Google Chrome (headless rendering). Override with CHROME=/path/to/chrome.
 * Everything is derived from apps.json — edit that file, not the generated markup.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = path.join(ROOT, ".build");
const CHROME =
  process.env.CHROME ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const TILE_W = 414;
const TILE_H = 140;
const HERO_W = 828;
const HERO_H = 280;

const SANS = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif`;
const SERIF = `"Fraunces", Georgia, "Times New Roman", serif`;

/* ---------- brand ---------- */

const BRAND = {
  dark: {
    bg: "#0d0d0f",
    surface: "#161619",
    border: "#232328",
    text: "#f5f5f4",
    secondary: "#9a9aa2",
    muted: "#86868e",
    accent: "#e2b272",
  },
  light: {
    bg: "#f4f1ea",
    surface: "#fffdf8",
    border: "#e2ddd2",
    text: "#191816",
    secondary: "#5f5d57",
    muted: "#7a776e",
    accent: "#a5742f",
  },
};

const fileUrl = (p) => "file://" + path.join(ROOT, p);

/* ---------- renderer ---------- */

async function render(html, outRel, width, height) {
  const out = path.join(ROOT, outRel);
  const tmp = path.join(BUILD, path.basename(out, ".png") + ".html");
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(tmp, html, "utf8");

  try {
    await run(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--allow-file-access-from-files",
      "--default-background-color=00000000",
      "--force-device-scale-factor=2",
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      "file://" + tmp,
    ]);
  } catch (err) {
    // Chrome exits non-zero on noisy-but-harmless stderr. Fail only if no file appeared.
    const { stat } = await import("node:fs/promises");
    await stat(out).catch(() => {
      throw new Error(`Chrome failed to render ${outRel}\n${err.stderr || err}`);
    });
  }
  return out;
}

const sha = async (abs) =>
  createHash("sha1").update(await readFile(abs)).digest("hex").slice(0, 8);

/* ---------- tiles ---------- */

function tileHtml(app, theme) {
  const c = BRAND[theme];
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${TILE_W}px; height: ${TILE_H}px; overflow: hidden; }
  body { font-family: ${SANS}; -webkit-font-smoothing: antialiased; background: transparent; }
  .card {
    position: relative; width: 100%; height: 100%;
    background: ${c.surface};
    border: 1px solid ${c.border};
    border-radius: 16px;
    padding: 20px;
    display: flex; gap: 16px;
    overflow: hidden;
  }
  .glow {
    position: absolute; left: -40px; top: -40px; width: 190px; height: 190px;
    border-radius: 50%;
    background: radial-gradient(circle, ${app.accent}2e 0%, ${app.accent}00 70%);
  }
  .icon {
    position: relative; flex: 0 0 auto;
    width: 58px; height: 58px; border-radius: 14px;
    box-shadow: 0 6px 18px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08) inset;
    object-fit: cover;
  }
  .body { position: relative; min-width: 0; flex: 1 1 auto; display: flex; flex-direction: column; }
  .head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .name { font-size: 19px; font-weight: 700; letter-spacing: -.015em; color: ${c.text}; white-space: nowrap; }
  .status {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 8.5px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase;
    color: ${c.muted}; white-space: nowrap; padding-top: 2px;
  }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: ${app.accent}; }
  .tagline {
    margin-top: 5px; font-size: 12.5px; line-height: 1.42; color: ${c.secondary};
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    min-height: 36px;
  }
  .chips {
    margin-top: 10px; font-size: 10px; font-weight: 600; letter-spacing: .07em;
    text-transform: uppercase; color: ${c.muted};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .chips i { font-style: normal; opacity: .45; padding: 0 5px; }
</style></head>
<body>
  <div class="card">
    <div class="glow"></div>
    <img class="icon" src="${fileUrl(app.icon)}" alt="">
    <div class="body">
      <div class="head">
        <span class="name">${app.name}</span>
        <span class="status"><span class="dot"></span>${app.status}</span>
      </div>
      <div class="tagline">${app.tagline}</div>
      <div class="chips">${app.chips.map((c) => `<span>${c}</span>`).join("<i>·</i>")}</div>
    </div>
  </div>
</body></html>`;
}

/* ---------- hero ---------- */

function heroHtml(theme) {
  const c = BRAND[theme];
  const glow =
    theme === "dark"
      ? `radial-gradient(680px 260px at 50% -30%, rgba(226,178,114,.16), transparent 70%)`
      : `radial-gradient(680px 260px at 50% -30%, rgba(165,116,47,.12), transparent 70%)`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${HERO_W}px; height: ${HERO_H}px; overflow: hidden; }
  body {
    font-family: ${SANS}; -webkit-font-smoothing: antialiased;
    background: ${c.bg};
    background-image: ${glow};
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
  }
  .kicker {
    font-size: 10.5px; font-weight: 700; letter-spacing: .3em; text-transform: uppercase;
    color: ${c.accent};
  }
  h1 {
    font-family: ${SERIF}; font-weight: 600; font-size: 46px; line-height: 1.06;
    letter-spacing: -1.4px; color: ${c.text}; margin-top: 18px;
  }
  .sub { font-size: 14px; color: ${c.secondary}; margin-top: 16px; letter-spacing: .01em; }
  .meta {
    font-size: 9.5px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase;
    color: ${c.muted}; margin-top: 22px;
  }
  .meta i { font-style: normal; opacity: .45; padding: 0 8px; }
</style></head>
<body>
  <div class="kicker">Low Effort Apps</div>
  <h1>Useful things.<br>Nothing extra.</h1>
  <div class="sub">Small iOS apps that do one thing well, then stop.</div>
  <div class="meta">Boston<i>·</i>iOS &amp; iPadOS<i>·</i>Solo independent developer</div>
</body></html>`;
}

/* ---------- README block ---------- */

async function bentoBlock(apps) {
  const tiles = [];
  for (const app of apps) {
    const abs = path.join(ROOT, "docs/bento", `tile-${app.id}.png`);
    tiles.push(
      `<a href="${app.url}"><img src="docs/bento/tile-${app.id}.png?v=${await sha(abs)}" width="${TILE_W}" alt="${app.name} — ${app.tagline}"></a>`
    );
  }
  const rows = [];
  for (let i = 0; i < tiles.length; i += 2) {
    rows.push(`<p align="center">${tiles.slice(i, i + 2).join("")}</p>`);
  }
  return rows.join("\n");
}

/* ---------- main ---------- */

const data = JSON.parse(await readFile(path.join(ROOT, "apps.json"), "utf8"));
const apps = data.apps;

await mkdir(BUILD, { recursive: true });

console.log("hero");
await render(heroHtml("dark"), "docs/hero.png", HERO_W, HERO_H);
await render(heroHtml("light"), "docs/hero-light.png", HERO_W, HERO_H);

for (const app of apps) {
  console.log(`tile  ${app.id}`);
  await render(tileHtml(app, "dark"), `docs/bento/tile-${app.id}.png`, TILE_W, TILE_H);
}

const block = await bentoBlock(apps);
const readmePath = path.join(ROOT, "README.md");
const readme = await readFile(readmePath, "utf8");
const start = "<!-- bento:start -->";
const end = "<!-- bento:end -->";
const next = readme.replace(
  new RegExp(`${start}[\\s\\S]*?${end}`),
  `${start}\n${block}\n${end}`
);
if (next === readme && !readme.includes(block)) {
  throw new Error("bento markers not found in README.md");
}
await writeFile(readmePath, next, "utf8");

console.log(`\n${apps.length} tiles + 2 heroes written. README grid updated.`);
