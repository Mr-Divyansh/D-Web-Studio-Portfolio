// Temporary review harness: full-page screenshots via CDP.
// --screenshot only captures the viewport, which hides everything below the fold;
// captureBeyondViewport gets the whole document in one image.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MIME = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".jpg":"image/jpeg", ".png":"image/png", ".svg":"image/svg+xml" };

const [page, theme = "dark", widthArg = "1440", out = "shot.png"] = process.argv.slice(2);
const width = Number(widthArg);

const server = createServer(async (req, res) => {
  const p = new URL(req.url, "http://l").pathname.slice(1);
  let buf;
  try { buf = await readFile(p); } catch { return res.writeHead(404).end(); }
  res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" }).end(buf);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const cdpPort = 9300 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
  "--user-data-dir=" + mkdtempSync(join(tmpdir(), "shot-")),
  "--remote-debugging-port=" + cdpPort,
  "--window-size=" + width + ",1200", "--force-device-scale-factor=1",
  "about:blank",
], { stdio: "ignore" });

let wsUrl = null;
for (let i = 0; i < 120 && !wsUrl; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
    wsUrl = list.find(t => t.type === "page")?.webSocketDebuggerUrl ?? null;
  } catch { /* not up yet */ }
  if (!wsUrl) await new Promise(r => setTimeout(r, 150));
}
if (!wsUrl) { server.close(); proc.kill(); throw new Error("CDP never came up"); }

const ws = new WebSocket(wsUrl);
await new Promise(res => ws.addEventListener("open", res));

let msgId = 0;
const pendingCalls = new Map();
const eventWaiters = [];
ws.addEventListener("message", ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pendingCalls.has(m.id)) { pendingCalls.get(m.id)(m); pendingCalls.delete(m.id); }
  else if (m.method) {
    for (let i = eventWaiters.length - 1; i >= 0; i--) {
      if (eventWaiters[i].method === m.method) { eventWaiters.splice(i, 1)[0].res(m.params); }
    }
  }
});
const send = (method, params = {}) => new Promise(res => {
  const id = ++msgId;
  pendingCalls.set(id, res);
  ws.send(JSON.stringify({ id, method, params }));
});
const waitEvent = (method, ms = 15000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error("timeout " + method)), ms);
  eventWaiters.push({ method, res: v => { clearTimeout(t); res(v); } });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: 1200, deviceScaleFactor: 1, mobile: width < 600 });

const url = `http://127.0.0.1:${port}/${page}`;
// Seed the theme, then reload so js/theme.js reads it the way a real visitor would.
await send("Page.navigate", { url });
await waitEvent("Page.loadEventFired").catch(() => {});
await send("Runtime.evaluate", { expression: `try{localStorage.setItem("dweb-theme",${JSON.stringify(theme)})}catch(e){}` });
await send("Page.reload");
await waitEvent("Page.loadEventFired");
await sleep(700);

// Freeze motion and un-hide scroll reveals so below-the-fold content is really visible.
await send("Runtime.evaluate", { expression: `
  var st=document.createElement("style");
  st.textContent="*,*::before,*::after{transition:none !important;animation:none !important}"
    +"html{scroll-behavior:auto !important}"
    +".reveal{opacity:1 !important;transform:none !important;visibility:visible !important}";
  document.head.appendChild(st);
  document.querySelectorAll(".reveal").forEach(function(e){e.classList.add("in")});
  window.scrollTo(0,0);` });
await sleep(500);

const docH = (await send("Runtime.evaluate", {
  expression: "Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)", returnByValue: true }))
  .result?.result?.value;
const height = Math.min(Math.ceil(docH || 0), 30000);

// Region crops are done with clip + an explicit scroll (no captureBeyondViewport);
// this Chrome build ignores clip whenever captureBeyondViewport is on.
const isJpeg = out.toLowerCase().endsWith(".jpg") || out.toLowerCase().endsWith(".jpeg");
const fmt = isJpeg ? { format: "jpeg", quality: 84 } : { format: "png" };
const region = process.argv.slice(7, 11).length === 4 ? process.argv.slice(7, 11).map(Number) : null;

let shot;
if (region) {
  await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${region[1]})` });
  await sleep(400);
  const sy = (await send("Runtime.evaluate", { expression: "window.scrollY", returnByValue: true }))
    .result?.result?.value ?? 0;
  shot = await send("Page.captureScreenshot", {
    ...fmt, clip: { x: 0, y: sy, width: region[2], height: region[3], scale: 1 },
  });
} else {
  shot = await send("Page.captureScreenshot", {
    ...fmt, ...(isJpeg ? {} : { captureBeyondViewport: true }),
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
}
if (!shot.result?.data) {
  // captureBeyondViewport was removed in newer Chrome; retry with just the clip.
  const retry = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
  if (retry.result?.data) shot.result = retry.result;
  else { console.error("screenshot failed:", JSON.stringify(shot).slice(0, 400), "|", JSON.stringify(retry).slice(0, 400)); }
}
await writeFile(out, Buffer.from(shot.result.data, "base64"));

// Report anything the page itself thinks is wrong at this width.
const audit = await send("Runtime.evaluate", {
  returnByValue: true, expression: `JSON.stringify({
    docW: document.documentElement.scrollWidth, viewW: window.innerWidth, h: ${height},
    overflowing: [...document.querySelectorAll("body *")]
      .filter(function(e){ var r=e.getBoundingClientRect();
        return r.width>0 && (r.right > window.innerWidth + 1 || r.left < -1); })
      .slice(0,8).map(function(e){ return (e.tagName+"."+(e.className||"").toString().split(" ")[0]).slice(0,46)
        +" [" + Math.round(e.getBoundingClientRect().left) + "→" + Math.round(e.getBoundingClientRect().right) + "]"; })
  })` });
console.log(`${page} ${theme} ${width}px  h=${height}`);
console.log("  " + (audit.result?.result?.value ?? "no-audit"));

ws.close();
proc.kill();
server.close();
process.exit(0);
