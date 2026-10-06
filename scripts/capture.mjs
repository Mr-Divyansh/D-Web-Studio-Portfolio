// Dependency-free screenshot tool (Node 22+; uses the global WebSocket).
//
//   node scripts/capture.mjs <manifest.json>
//
// Why not `chrome --screenshot`: it fires as soon as load settles, which catches
// the site's reveal-on-scroll animations mid-flight and parks single-page apps
// on their loading screen. This drives a real DevTools session instead: it
// emulates prefers-reduced-motion (css/style.css force-shows .reveal under
// reduce, so nothing depends on IntersectionObserver frames), waits for load
// plus a settle delay, optionally scrolls, then captures the viewport.
//
// manifest.json is an array of jobs:
//   {
//     "url":  "https://… or file:///…",
//     "out":  "img/ProjectImage/gallery/shot.png",
//     "width": 1440, "height": 900,   // viewport; 500 is Chrome's floor
//     "scroll": 0.5,                   // fraction of scrollable height; 0 = top
//     "wait": 1500,                    // ms to wait after load
//     "format": "png",                 // or "jpeg" (quality 88)
//     "fullpage": false,               // resize viewport to full document
//     "seedTheme": null                // "dark" | "light" - written to
//                                       // localStorage as "dweb-theme" before
//                                       // any page script runs
//   }
//
// Set CHROME_PATH to override browser discovery.
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env["PROGRAMFILES"] && `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
  process.env["PROGRAMFILES(X86)"] && `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  process.env["PROGRAMFILES"] && `${process.env["PROGRAMFILES"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].filter(Boolean);
const CHROME = chromeCandidates.find((p) => existsSync(p)) || null;
const manifestPath = process.argv[2];
if (!CHROME) { console.error("capture: no Chrome/Edge found (set CHROME_PATH)"); process.exit(1); }
if (!manifestPath) { console.error("usage: node scripts/capture.mjs <manifest.json>"); process.exit(1); }

// PowerShell's ConvertTo-Json collapses a one-element array to a bare object.
const parsed = JSON.parse((await readFile(resolve(manifestPath), "utf8")).replace(/^﻿/, ""));
const jobs = Array.isArray(parsed) ? parsed : [parsed];
const profile = resolve(tmpdir(), `dweb-capture-${process.pid}`);
const chrome = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
  "--disable-extensions", "--force-device-scale-factor=1", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });

let wsUrl = "";
await new Promise((res, rej) => {
  let buf = "";
  const timer = setTimeout(() => rej(new Error("Chrome did not report a DevTools endpoint")), 20000);
  chrome.stderr.on("data", (chunk) => {
    buf += chunk;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(timer); wsUrl = m[1]; res(); }
  });
  chrome.once("exit", (code) => { clearTimeout(timer); rej(new Error(`Chrome exited early (${code})`)); });
});

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("WebSocket connect failed")); });

let seq = 0;
const pending = new Map();
const listeners = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const entry = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(JSON.stringify(msg.error))) : entry.resolve(msg.result);
  } else if (msg.method && listeners.has(msg.method)) {
    for (const fn of listeners.get(msg.method)) fn(msg.params || {});
  }
};
function send(method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((resolveP, rejectP) => {
    pending.set(id, { resolve: resolveP, reject: rejectP });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
function once(method, timeoutMs = 45000) {
  return new Promise((resolveP, rejectP) => {
    const list = listeners.get(method) || [];
    listeners.set(method, list);
    const timer = setTimeout(() => {
      const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1);
      rejectP(new Error(`timeout: ${method}`));
    }, timeoutMs);
    const fn = (params) => {
      clearTimeout(timer);
      const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1);
      resolveP(params);
    };
    list.push(fn);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { targetInfos } = await send("Target.getTargets");
const pageTarget = targetInfos.find((t) => t.type === "page");
if (!pageTarget) throw new Error("no page target");
const { sessionId: sid } = await send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });
await send("Page.enable", {}, sid);
await send("Runtime.enable", {}, sid);

let failed = 0;
for (const job of jobs) {
  const width = job.width ?? 1440;
  const height = job.height ?? 900;
  try {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }, sid);
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sid);
    if (job.seedTheme) {
      await send("Page.addScriptToEvaluateOnNewDocument", {
        source: `try{localStorage.setItem("dweb-theme",${JSON.stringify(job.seedTheme)})}catch(e){}`,
      }, sid);
    }
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url: job.url }, sid);
    await loaded;
    await sleep(job.wait ?? 1500);
    if (job.scroll) {
      await send("Runtime.evaluate", {
        expression: `window.scrollTo({top: Math.max(0,(document.documentElement.scrollHeight-window.innerHeight)*${job.scroll}),behavior:"instant"})`,
      }, sid);
      await sleep(1100);
    }
    if (job.fullpage) {
      const { result } = await send("Runtime.evaluate", { expression: "String(document.documentElement.scrollHeight)" }, sid);
      await send("Emulation.setDeviceMetricsOverride", {
        width, height: Math.min(30000, parseInt(result.value, 10) || height), deviceScaleFactor: 1, mobile: false,
      }, sid);
      await sleep(400);
    }
    const shot = await send("Page.captureScreenshot", job.format === "jpeg"
      ? { format: "jpeg", quality: 88 }
      : { format: "png" }, sid);
    await mkdir(dirname(resolve(job.out)), { recursive: true });
    await writeFile(resolve(job.out), Buffer.from(shot.data, "base64"));
    console.log(`captured ${job.out}  (${width}x${height}${job.scroll ? `, scroll ${job.scroll}` : ""}${job.fullpage ? ", fullpage" : ""})`);
  } catch (err) {
    failed++;
    console.error(`FAILED ${job.out || job.url}: ${err.message}`);
  }
}

ws.close();
chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
process.exit(failed ? 1 : 0);