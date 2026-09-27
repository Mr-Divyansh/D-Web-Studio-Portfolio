// Layout audit: measures the structural problems that make pages read as
// "off" — dead vertical space, overlapping text, broken media, and
// two-column sections whose columns end very unevenly.
//   node tests/_audit.mjs [pages] [themes] [width]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MIME = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".jpg":"image/jpeg", ".png":"image/png", ".svg":"image/svg+xml" };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const pages = (process.argv[2] || "index,about,services,experience,work,contact,404").split(",");
const themes = (process.argv[3] || "dark,light").split(",");
const width = Number(process.argv[4] || 1440);

const server = createServer(async (req, res) => {
  const p = new URL(req.url, "http://l").pathname.slice(1);
  let buf;
  try { buf = await readFile(p); } catch { return res.writeHead(404).end(); }
  res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" }).end(buf);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const cdpPort = 9400 + Math.floor(Math.random() * 250);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
  "--user-data-dir=" + mkdtempSync(join(tmpdir(), "audit-")),
  "--remote-debugging-port=" + cdpPort, `--window-size=${width},1200`,
], { stdio: "ignore" });

let wsUrl = null;
for (let i = 0; i < 120 && !wsUrl; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
    wsUrl = list.find(t => t.type === "page")?.webSocketDebuggerUrl ?? null;
  } catch { /* not up yet */ }
  if (!wsUrl) await sleep(150);
}
if (!wsUrl) { server.close(); proc.kill(); throw new Error("CDP never came up"); }

const ws = new WebSocket(wsUrl);
await new Promise(res => ws.addEventListener("open", res));
let id = 0;
const calls = new Map();
const waiters = [];
ws.addEventListener("message", ev => {
  const m = JSON.parse(ev.data);
  if (m.id && calls.has(m.id)) { calls.get(m.id)(m); calls.delete(m.id); }
  else if (m.method) for (let i = waiters.length - 1; i >= 0; i--) {
    if (waiters[i].method === m.method) { waiters.splice(i, 1)[0].res(m.params); }
  }
});
const send = (method, params = {}) => new Promise(res => {
  const n = ++id; calls.set(n, res); ws.send(JSON.stringify({ id: n, method, params }));
});
const waitEvent = (method, ms = 20000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error("timeout " + method)), ms);
  waiters.push({ method, res: v => { clearTimeout(t); res(v); } });
});
const evalJs = async expression =>
  (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: 1200, deviceScaleFactor: 1, mobile: width < 700 });
const AUDIT_JS = `(() => {
  const R = e => e.getBoundingClientRect();
  const sy = window.scrollY;
  const name = e => (e.tagName + "." + String(e.className || "").split(" ").filter(Boolean)[0]).slice(0, 42);
  const out = { rhythm: [], deadSpace: [], overlap: [], brokenMedia: [], unevenCols: [], airy: [] };

  // Dead vertical space: both the gaps between sections and the padding that
  // sits between a section's own edge and the first/last thing inside it.
  const secs = [...document.querySelectorAll("main > *")];
  for (let i = 0; i < secs.length; i++) {
    const s = secs[i], a = R(s), b = secs[i + 1] ? R(secs[i + 1]) : null;
    if (a.height < 4) continue;
    const first = s.firstElementChild, last = s.lastElementChild;
    const innerTop = first ? Math.round(R(first).top - a.top) : 0;
    const innerBottom = last ? Math.round(a.bottom - R(last).bottom) : 0;
    const gap = b ? Math.round(b.top - a.bottom) : 0;
    out.rhythm.push(name(s) + " h=" + Math.round(a.height) + " padTop=" + innerTop + " padBot=" + innerBottom + " gapAfter=" + gap);
    if (innerTop + innerBottom > 230) {
      out.airy.push({ el: name(s), padTop: innerTop, padBot: innerBottom, total: innerTop + innerBottom });
    }
  }

  // Text from different elements sitting on top of each other.
  const leaves = [...document.querySelectorAll("body *")].filter(e => {
    if (e.children.length || !e.textContent.trim()) return false;
    const cs = getComputedStyle(e);
    if (cs.position === "absolute" || cs.position === "fixed") return false;
    if (cs.visibility === "hidden" || cs.opacity === "0") return false;
    const r = R(e);
    return r.width > 4 && r.height > 4;
  });
  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const a = R(leaves[i]), b = R(leaves[j]);
      if (a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top) continue;
      const ov = (Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
                 (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const min = Math.min(a.width * a.height, b.width * b.height);
      if (min > 0 && ov / min > 0.3) {
        out.overlap.push({ a: name(leaves[i]), b: name(leaves[j]),
          at: Math.round(a.left) + "," + Math.round(a.top + sy), ratio: +(ov / min).toFixed(2) });
      }
    }
  }

  // Images that failed, and media boxes that rendered empty.
  for (const img of document.querySelectorAll("img")) {
    if (!img.complete || img.naturalWidth === 0) {
      out.brokenMedia.push({ el: name(img), src: (img.getAttribute("src") || "").slice(-46) });
    }
  }
  for (const box of document.querySelectorAll("[class*=media], [class*=thumb], [class*=shot]")) {
    const r = R(box);
    if (r.height < 30) continue;
    const hasImg = box.querySelector("img");
    const bg = getComputedStyle(box).backgroundImage;
    if (!hasImg && (bg === "none" || bg === "")) {
      out.brokenMedia.push({ el: name(box), src: "EMPTY " + Math.round(r.width) + "x" + Math.round(r.height) });
    }
  }

  // Two-column sections where one column ends far above the other.
  for (const g of document.querySelectorAll("main *")) {
    const cs = getComputedStyle(g);
    if (cs.display !== "grid" && cs.display !== "flex") continue;
    const kids = [...g.children].filter(k => R(k).height > 20);
    if (kids.length !== 2) continue;
    const bottoms = kids.map(k => R(k).bottom).sort((a, b) => a - b);
    const diff = Math.round(bottoms[1] - bottoms[0]);
    if (diff > 190) out.unevenCols.push({ el: name(g), diff });
  }
  return JSON.stringify(out);
})()`;
for (const page of pages) {
  for (const theme of themes) {
    const url = `http://127.0.0.1:${port}/${page}.html`;
    await send("Page.navigate", { url });
    await waitEvent("Page.loadEventFired").catch(() => {});
    await evalJs(`try{localStorage.setItem("dweb-theme",${JSON.stringify(theme)})}catch(e){}`);
    await send("Page.reload");
    await waitEvent("Page.loadEventFired");
    await sleep(450);
    await evalJs(`var s=document.createElement("style");
      s.textContent="*,*::before,*::after{transition:none !important;animation:none !important}.reveal{opacity:1 !important;transform:none !important}";
      document.head.appendChild(s);window.scrollTo(0,0);`);
    await sleep(250);
    const r = JSON.parse((await evalJs(AUDIT_JS)) || "{}");
    const n = (r.deadSpace?.length || 0) + (r.overlap?.length || 0) + (r.unevenCols?.length || 0);
    console.log(`\n=== ${page}.html [${theme}] @${width} — ${n} issue(s)`);
    if (r.rhythm?.length) console.log("  RHYTHM\n" + r.rhythm.map(d => `    ${d}`).join("\n"));
    if (r.deadSpace?.length) console.log("  DEAD SPACE\n" + r.deadSpace.map(d => `    ${d.gap}px  ${d.between}`).join("\n"));
    if (r.airy?.length) console.log("  OVER-PADDED\n" + r.airy.map(d => `    ${d.total}px total (top ${d.padTop} / bottom ${d.padBot})  ${d.el}`).join("\n"));
    if (r.overlap?.length) console.log("  OVERLAPPING TEXT\n" + r.overlap.map(d => `    ${d.ratio}  ${d.a} <> ${d.b} @${d.at}`).join("\n"));
    if (r.brokenMedia?.length) console.log("  MEDIA\n" + r.brokenMedia.map(d => `    ${d.el}  ${d.src}`).join("\n"));
    if (r.unevenCols?.length) console.log("  UNEVEN COLUMNS\n" + r.unevenCols.map(d => `    ${d.diff}px  ${d.el}`).join("\n"));
  }
}

ws.close(); proc.kill(); server.close();
process.exit(0);
