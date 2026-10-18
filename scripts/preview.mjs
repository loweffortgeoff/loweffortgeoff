#!/usr/bin/env node
/**
 * Builds a local mock of the GitHub profile page so you can see the README in
 * context before pushing.
 *
 *   node scripts/preview.mjs
 *
 * The README body is rendered by GitHub's own markdown API (POST /markdown), so
 * what you see here is what GitHub's sanitizer will actually allow — <picture>,
 * image widths, and all. Requires an authenticated `gh`.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
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

const readme = await readFile(path.join(ROOT, "README.md"), "utf8");

const { stdout } = await run("gh", [
  "api",
  "-X", "POST",
  "/markdown",
  "-f", `text=${readme}`,
  "-f", "mode=gfm",
  "-f", "context=loweffortgeoff",
]);

// Relative asset paths resolve against the repo root on GitHub, not .build/.
let body = stdout.replaceAll('src="docs/', 'src="../docs/');

// GitHub picks the <picture> source from the visitor's theme. Headless Chrome
// can't be told to emulate that per run, so pin the correct one for each preview.
const pinHero = (html, which) =>
  html.replace(
    /<themed-picture[^>]*>\s*<picture>[\s\S]*?<\/picture>\s*<\/themed-picture>/,
    `<img src="../docs/hero${which === "light" ? "-light" : ""}.png" width="100%" alt="Low Effort Apps">`
  );

const theme = {
  light: {
    page: "#ffffff",
    text: "#1f2328",
    muted: "#59636e",
    border: "#d1d9e0",
    subtle: "#f6f8fa",
    link: "#0969da",
  },
  dark: {
    page: "#0d1117",
    text: "#e6edf3",
    muted: "#9198a1",
    border: "#3d444d",
    subtle: "#151b23",
    link: "#4493f8",
  },
};

function page(name, content) {
  const c = theme[name];
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1000px; min-height: 2000px; background: ${c.page}; color: ${c.text};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
    font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased;
  }
  .wrap { width: 860px; margin: 0 auto; padding: 40px 16px 80px; }
  .avatar { width: 260px; height: 260px; border-radius: 50%; background: ${c.subtle};
            border: 1px solid ${c.border}; display: flex; align-items: center; justify-content: center;
            font-size: 96px; color: ${c.muted}; letter-spacing: -4px; }
  .name { font-size: 26px; font-weight: 600; margin-top: 18px; letter-spacing: -.01em; }
  .handle { font-size: 20px; color: ${c.muted}; font-weight: 300; margin-left: 6px; }
  .bio { margin-top: 12px; font-size: 15px; max-width: 520px; }
  .meta { margin-top: 12px; color: ${c.muted}; font-size: 13px; }
  .rule { height: 1px; background: ${c.border}; margin: 24px 0; }
  .md { max-width: 828px; font-size: 16px; line-height: 1.6; }
  .md > *:first-child { margin-top: 0; }
  .md h1, .md h2, .md h3 { margin: 24px 0 12px; font-weight: 600; line-height: 1.25; }
  .md h3 { font-size: 1.25em; }
  .md p { margin: 0 0 16px; }
  .md div[align="center"] p { margin: 10px 0; }
  .md a { color: ${c.link}; text-decoration: none; }
  .md img { max-width: 100%; height: auto; vertical-align: middle; }
  .md code { background: rgba(129,139,152,.15); padding: .2em .4em; border-radius: 6px;
             font-size: 85%; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .md hr { border: 0; height: 1px; background: ${c.border}; margin: 24px 0; }
  .md ul { padding-left: 2em; margin: 0 0 16px; }
  .md li { margin: 4px 0; }
  .md sub { font-size: 75%; color: ${c.muted}; }
  .label { font-size: 9px; letter-spacing: .22em; text-transform: uppercase;
           color: ${c.muted}; margin-bottom: 20px; }
</style></head>
<body><div class="wrap">
  <div class="label">local preview · github.com/loweffortgeoff · ${name} theme</div>
  <div class="avatar">GS</div>
  <div class="name">Geoff<span class="handle">loweffortgeoff</span></div>
  <div class="bio">I'm Geoff. I'm a solo indie developer with a day job, a side project habit I can't shake.</div>
  <div class="meta">Low Effort Apps &nbsp;·&nbsp; Boston, MA &nbsp;·&nbsp; loweffortapps.app</div>
  <div class="rule"></div>
  <div class="md">${content}</div>
</div></body></html>`;
}

await mkdir(BUILD, { recursive: true });

for (const name of ["light", "dark"]) {
  const file = path.join(BUILD, `preview-${name}.html`);
  await writeFile(file, page(name, pinHero(body, name)), "utf8");
  await run(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--force-device-scale-factor=1",
    "--window-size=1000,1880",
    `--screenshot=${path.join(BUILD, `preview-${name}.png`)}`,
    "file://" + file,
  ]).catch(() => {});
  console.log(`.build/preview-${name}.png`);
}
