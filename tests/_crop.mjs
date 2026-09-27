// Crop regions out of a full-page screenshot for close review.
// This Chrome build ignores Page.captureScreenshot's clip, so instead of
// cropping the bitmap we render the shot inside a clipping viewport and let
// Chrome re-encode just that rectangle.
//   node tests/_crop.mjs <src.png> <out.png> <x> <y> <w> <h> [<out2.png> <x> <y> <w> <h> ...]
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const [src, ...rest] = process.argv.slice(2);
if (rest.length % 5 !== 0) throw new Error("need out,x,y,w,h per crop");
const crops = [];
for (let i = 0; i < rest.length; i += 5) {
  crops.push({ out: rest[i], x: +rest[i + 1], y: +rest[i + 2], w: +rest[i + 3], h: +rest[i + 4] });
}

const mime = /\.jpe?g$/i.test(src) ? "image/jpeg" : "image/png";
const dataUri = `data:${mime};base64,${(await readFile(src)).toString("base64")}`;

let current = crops[0];
const server = createServer((req, res) => {
  if (new URL(req.url, "http://l").pathname !== "/crop") return res.writeHead(404).end();
  const { x, y, w, h } = current;
  res.writeHead(200, { "content-type": "text/html" }).end(
    `<!doctype html><meta charset="utf-8"><style>
       html,body{margin:0;padding:0;background:#fff}
       .vp{position:relative;overflow:hidden;width:${w}px;height:${h}px}
       img{position:absolute;left:${-x}px;top:${-y}px;max-width:none}
     </style><div class="vp"><img id="s" src="${dataUri}"></div>`);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const cdpPort = 9700 + Math.floor(Math.random() * 250);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
  "--user-data-dir=" + mkdtempSync(join(tmpdir(), "crop-")),
  "--remote-debugging-port=" + cdpPort, "about:blank",
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
const waitEvent = (method, ms = 30000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error("timeout " + method)), ms);
  waiters.push({ method, res: v => { clearTimeout(t); res(v); } });
});

await send("Page.enable");
await send("Runtime.enable");

for (const c of crops) {
  current = c;
  await send("Emulation.setDeviceMetricsOverride", { width: c.w, height: c.h, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/crop` });
  await waitEvent("Page.loadEventFired");
  // The shot arrives as one big data URI, so confirm it has actually decoded.
  for (let i = 0; i < 60; i++) {
    const r = await send("Runtime.evaluate", {
      expression: `(function(){var i=document.getElementById("s");return i&&i.complete&&i.naturalWidth>0})()`,
      returnByValue: true });
    if (r.result?.result?.value) break;
    await sleep(150);
  }
  await sleep(250);
  const shot = await send("Page.captureScreenshot", {
    format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: c.w, height: c.h, scale: 1 },
  });
  await writeFile(c.out, Buffer.from(shot.result.data, "base64"));
  console.log(`${c.out}  ${c.w}x${c.h}  from ${src} at ${c.x},${c.y}`);
}

ws.close(); proc.kill(); server.close();
process.exit(0);
