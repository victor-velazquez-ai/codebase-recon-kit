#!/usr/bin/env node
/**
 * Recon Kit — documentation/audit HTML site generator.
 *
 * Turns a folder of Markdown into a polished, self-contained, single-page-per-file
 * HTML site with a fixed sidebar, dark professional theme, and client-side Mermaid
 * diagram rendering. Zero config: it auto-discovers files by folder + filename.
 *
 * Expected layout (this script lives in the `docs/` folder):
 *
 *   recon/
 *     audit/                 ← audit markdown (README.md + NN-*.md), optional
 *     docs/
 *       build-html.mjs       ← this file
 *       md/                  ← documentation chapters (NN-*.md)
 *       html/                ← generated site (created/overwritten)
 *
 * Ordering: files sort by filename, so use zero-padded numeric prefixes
 * (00-, 01-, 02-…). `README.md` becomes the "Home" page of each group.
 * Each page's title is taken from its first `# H1`, else the filename.
 *
 * Markdown → HTML uses `marked`. It is loaded from (in order):
 *   1. a vendored ESM copy at  html/assets/marked.esm.js   (fully offline), or
 *   2. the `marked` npm package (run `npm i marked` in this folder).
 * Mermaid renders in the browser from html/assets/mermaid.min.js if present,
 * else a pinned CDN fallback.
 *
 * Usage:  node build-html.mjs
 * Brand:  RECON_BRAND="ACME" RECON_TAG="Engineering Portal" node build-html.mjs
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url)); // .../recon/docs
const DOCS_DIR = __dirname;
const MD_DIR = join(DOCS_DIR, "md");
const AUDIT_DIR = join(DOCS_DIR, "..", "audit");
const HTML_DIR = join(DOCS_DIR, "html");
const ASSETS = join(HTML_DIR, "assets");
mkdirSync(ASSETS, { recursive: true });

const BRAND = process.env.RECON_BRAND || "PROJECT";
const TAG = process.env.RECON_TAG || "Engineering Portal";

// ─── Load marked (vendored ESM first, then npm) ───────────────────────────────
let marked;
try {
  const vendored = join(ASSETS, "marked.esm.js");
  const mod = existsSync(vendored)
    ? await import(pathToFileURL(vendored).href)
    : await import("marked");
  marked = mod.marked;
} catch {
  console.error(
    "\n[build-html] Could not load `marked`.\n" +
      "  Fix: run `npm i marked` in this folder, or vendor an ESM build to\n" +
      "  html/assets/marked.esm.js (offline). Then re-run.\n",
  );
  process.exit(1);
}
marked.setOptions({ gfm: true, breaks: false });

// ─── Discover pages ───────────────────────────────────────────────────────────
const outName = (mdName) => mdName.replace(/\.md$/i, ".html");
const firstH1 = (md, fallback) => {
  const m = md.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].replace(/[`*_]/g, "") : fallback;
};
const prettyFallback = (name) =>
  name
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function collect(dir, { readmeTitle, readmeOut }) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const nav = [];
  for (const f of files) {
    const raw = readFileSync(join(dir, f), "utf8");
    if (/^readme\.md$/i.test(f)) {
      nav.unshift({ file: f, dir, out: readmeOut, title: readmeTitle });
    } else {
      nav.push({
        file: f,
        dir,
        out: outName(f),
        title: firstH1(raw, prettyFallback(f)),
      });
    }
  }
  return nav;
}

const DOC_NAV = collect(MD_DIR, {
  readmeTitle: "Documentation Home",
  readmeOut: "index.html",
});
// If there's no md/README.md, still make an index from the first doc.
const AUDIT_NAV = collect(AUDIT_DIR, {
  readmeTitle: "Audit — Executive Summary",
  readmeOut: "audit.html",
});

// basename -> out, so intra-site .md links can be rewritten to .html
const baseMap = new Map();
for (const n of [...DOC_NAV, ...AUDIT_NAV]) baseMap.set(n.file, n.out);

// ─── Markdown helpers ─────────────────────────────────────────────────────────
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// Pull ```mermaid fences out before marked, restore as <pre class="mermaid"> after.
function extractMermaid(md) {
  const blocks = [];
  const out = md.replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, code) => {
    const token = `xMERMAIDBLOCKx${blocks.length}x`;
    blocks.push(code.replace(/\s+$/, ""));
    return `\n\n${token}\n\n`;
  });
  return { md: out, blocks };
}
function restoreMermaid(html, blocks) {
  return html
    .replace(
      /<p>xMERMAIDBLOCKx(\d+)x<\/p>/g,
      (_, i) => `<pre class="mermaid">${escapeHtml(blocks[Number(i)])}</pre>`,
    )
    .replace(
      /xMERMAIDBLOCKx(\d+)x/g,
      (_, i) => `<pre class="mermaid">${escapeHtml(blocks[Number(i)])}</pre>`,
    );
}
function rewriteLinks(html) {
  return html.replace(/href="([^"]+)"/g, (m, href) => {
    const [path, anchor] = href.split("#");
    if (!path || !path.endsWith(".md")) return m;
    const base = path.split("/").pop();
    const out = baseMap.get(base);
    if (!out) return m; // unknown md (external spec/ADR) — leave as-is
    return `href="${out}${anchor ? "#" + anchor : ""}"`;
  });
}

// ─── Page shell ───────────────────────────────────────────────────────────────
function navHtml(activeOut) {
  const li = (n) =>
    `<li><a href="${n.out}" class="${n.out === activeOut ? "active" : ""}">${n.title}</a></li>`;
  const groups = [];
  if (DOC_NAV.length)
    groups.push(
      `<div class="nav-group">Documentation</div><ul>${DOC_NAV.map(li).join("")}</ul>`,
    );
  if (AUDIT_NAV.length)
    groups.push(
      `<div class="nav-group">Audit</div><ul>${AUDIT_NAV.map(li).join("")}</ul>`,
    );
  return `
<nav class="sidebar" id="sidebar">
  <div class="brand"><span class="logo">${escapeHtml(BRAND)}</span><span class="tag">${escapeHtml(TAG)}</span></div>
  ${groups.join("\n")}
  <div class="nav-foot">Generated from Markdown · <code>build-html.mjs</code></div>
</nav>`;
}

function page(title, bodyHtml, activeOut) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(BRAND)}</title>
<link rel="stylesheet" href="assets/styles.css">
</head>
<body>
<button class="nav-toggle" aria-label="Toggle navigation" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
${navHtml(activeOut)}
<main class="content"><article class="md">
${bodyHtml}
</article>
<footer class="pagefoot">${escapeHtml(BRAND)} · generated engineering documentation · read-only</footer>
</main>
<script>
(function () {
  function init() {
    mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose",
      flowchart: { useMaxWidth: true, htmlLabels: true }, sequence: { useMaxWidth: true },
      er: { useMaxWidth: true }, themeVariables: { fontSize: "14px" } });
    mermaid.run({ querySelector: ".mermaid" }).catch(function (e) { console.error("mermaid", e); });
  }
  function load(src, next) {
    var s = document.createElement("script");
    s.src = src; s.onload = init; s.onerror = next; document.head.appendChild(s);
  }
  // Vendored copy first (offline), then a pinned CDN fallback.
  load("assets/mermaid.min.js", function () {
    load("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js", function () {
      console.error("mermaid unavailable (no vendored copy and no network)");
    });
  });
})();
</script>
</body>
</html>`;
}

function renderFile(n) {
  const raw = readFileSync(join(n.dir, n.file), "utf8");
  const { md, blocks } = extractMermaid(raw);
  let html = marked.parse(md);
  html = restoreMermaid(html, blocks);
  html = rewriteLinks(html);
  writeFileSync(join(HTML_DIR, n.out), page(n.title, html, n.out), "utf8");
  return blocks.length;
}

// ─── Stylesheet (professional dark theme) ─────────────────────────────────────
const CSS = `:root{
  --bg:#0f1117;--panel:#151823;--ink:#e7e9ee;--muted:#9aa3b2;--line:#262b3a;
  --accent:#5b9dff;--accent2:#7c5cff;--code-bg:#1b1e2b;--chip:#222838;
  --crit:#ff5c5c;--high:#ff9d42;--ok:#46d39a;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);
  font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code,pre,kbd{font-family:"SF Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
.sidebar{position:fixed;top:0;left:0;width:288px;height:100vh;overflow-y:auto;
  background:var(--panel);border-right:1px solid var(--line);padding:18px 14px 40px}
.brand{display:flex;flex-direction:column;padding:6px 8px 14px;border-bottom:1px solid var(--line);margin-bottom:10px}
.brand .logo{font-weight:800;letter-spacing:2px;font-size:22px;
  background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.brand .tag{color:var(--muted);font-size:11px;letter-spacing:1px;text-transform:uppercase}
.nav-group{color:var(--muted);font-size:11px;font-weight:700;letter-spacing:1px;
  text-transform:uppercase;margin:16px 8px 6px}
.sidebar ul{list-style:none;margin:0;padding:0}
.sidebar li a{display:block;padding:6px 10px;border-radius:7px;color:var(--ink);font-size:13.5px}
.sidebar li a:hover{background:var(--chip);text-decoration:none}
.sidebar li a.active{background:linear-gradient(90deg,rgba(91,157,255,.18),rgba(124,92,255,.12));
  color:#fff;font-weight:600;box-shadow:inset 2px 0 0 var(--accent)}
.nav-foot{color:var(--muted);font-size:11px;margin:24px 8px 0;border-top:1px solid var(--line);padding-top:12px}
.nav-foot code{font-size:11px}
.content{margin-left:288px;padding:46px 56px 80px;max-width:1020px}
.nav-toggle{display:none;position:fixed;top:12px;left:12px;z-index:30;background:var(--panel);
  color:var(--ink);border:1px solid var(--line);border-radius:8px;font-size:18px;padding:6px 12px;cursor:pointer}
.md h1{font-size:30px;line-height:1.25;margin:0 0 8px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.md h2{font-size:22px;margin:34px 0 12px;padding-top:8px}
.md h3{font-size:17px;margin:26px 0 8px}
.md h4{font-size:15px;margin:20px 0 6px;color:#cdd3df}
.md h2,.md h3{border-bottom:1px solid var(--line);padding-bottom:6px}
.md p{margin:10px 0}
.md ul,.md ol{padding-left:24px}
.md li{margin:4px 0}
.md blockquote{margin:16px 0;padding:10px 16px;border-left:3px solid var(--accent2);
  background:rgba(124,92,255,.08);border-radius:0 8px 8px 0;color:#d6dae4}
.md blockquote p{margin:4px 0}
.md hr{border:0;border-top:1px solid var(--line);margin:30px 0}
.md code{background:var(--code-bg);padding:2px 6px;border-radius:5px;font-size:13px;color:#ecd9b0;border:1px solid #232838}
.md pre{background:var(--code-bg);border:1px solid var(--line);border-radius:10px;padding:14px 16px;overflow-x:auto}
.md pre code{background:none;border:0;padding:0;color:#d7dbe6;font-size:13px}
.md table{border-collapse:collapse;width:100%;margin:16px 0;font-size:13.5px;display:block;overflow-x:auto}
.md th,.md td{border:1px solid var(--line);padding:8px 11px;text-align:left;vertical-align:top}
.md th{background:var(--chip);font-weight:700}
.md tr:nth-child(even) td{background:rgba(255,255,255,.015)}
.md img{max-width:100%}
.md pre.mermaid{background:#f7f8fb;border:1px solid var(--line);color:#111;text-align:center;
  padding:18px;border-radius:12px;line-height:initial}
.pagefoot{margin:60px 0 0;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}
@media (max-width:980px){
  .sidebar{transform:translateX(-100%);transition:transform .2s;z-index:25}
  .sidebar.open{transform:none}
  .content{margin-left:0;padding:60px 20px 60px}
  .nav-toggle{display:block}
}`;

// ─── Build ────────────────────────────────────────────────────────────────────
writeFileSync(join(ASSETS, "styles.css"), CSS, "utf8");
let pages = 0,
  diagrams = 0;
for (const n of [...DOC_NAV, ...AUDIT_NAV]) {
  diagrams += renderFile(n);
  pages++;
}
console.log(
  `Built ${pages} HTML pages, ${diagrams} mermaid diagrams -> ${HTML_DIR}`,
);
if (!pages) {
  console.log(
    "No markdown found. Put chapters in docs/md/*.md and (optionally) audit/*.md.",
  );
}
