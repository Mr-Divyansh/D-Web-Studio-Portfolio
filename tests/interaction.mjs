// Runtime interaction suite. Pairs with contract.mjs, which is static: that one
// parses the CSS/HTML/JS as text, this one loads the real pages in Chrome and
// drives the real handlers, covering the behaviour that only exists at runtime
// - theme switching and persistence, the mobile drawer, form validation and the
// FAQ accordions.
//
// No dependencies: a Node http server provides a real origin (so localStorage
// works, unlike file://) and Chrome's --dump-dom prints the DOM once the page
// has signalled it is finished. Set CHROME_PATH to override browser discovery;
// the run skips cleanly if no Chrome/Edge is found.
//
//   node tests/interaction.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdtempSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";

function findChrome() {
  const roots = process.env.CHROME_PATH ? [process.env.CHROME_PATH] : [
    join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
    join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe")
  ];
  return roots.find((p) => p && existsSync(p)) || null;
}

const CHROME = findChrome();
if (!CHROME) {
  console.log("interaction: skipped (no Chrome/Edge found; set CHROME_PATH to run)");
  process.exit(0);
}
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon" };

// What each page should be able to prove, and how wide the window is while it
// proves it. The drawer only exists below the 640px breakpoint, so index.html
// is driven twice.
// Width caveat: headless Chrome clamps its window to a 500px minimum, so
// --window-size=390,844 actually renders at 500. That is still below the 640px
// drawer breakpoint, so the mobile assertions are real - but this is NOT a
// 390px test, and a screenshot taken this way clips the right 110px of the
// layout. Real phone widths were verified separately by loading the page in
// same-origin iframes at 320/360/390 and measuring inside them.
const RUNS = [
  { page: "index.html", width: 1440, height: 900, tag: "index-desktop", seed: null },
  { page: "index.html", width: 390, height: 844, tag: "index-mobile", seed: null },
  // Persistence: seeded into localStorage *before* js/theme.js executes, so the
  // saved choice has to win over the system preference on first paint.
  { page: "index.html", width: 1440, height: 900, tag: "index-seeded-light", seed: "light" },
  { page: "index.html", width: 1440, height: 900, tag: "index-seeded-dark", seed: "dark" },
  { page: "contact.html", width: 1440, height: 900, tag: "contact-desktop", seed: null },
  { page: "contact.html", width: 390, height: 844, tag: "contact-mobile", seed: null },
  { page: "work.html", width: 1440, height: 900, tag: "work-desktop", seed: null },
  // The shareable case-study page: js/project-detail.js renders it from
  // location.search, so the run needs a real ?slug= to render against.
  { page: "project.html", width: 1440, height: 900, tag: "project-desktop", seed: null, query: "slug=attendx" },
  { page: "services.html", width: 1440, height: 900, tag: "services-desktop", seed: null },
  { page: "about.html", width: 1440, height: 900, tag: "about-desktop", seed: null },
  { page: "experience.html", width: 1440, height: 900, tag: "experience-desktop", seed: null },
  { page: "404.html", width: 1440, height: 900, tag: "404-desktop", seed: null }
];

function harnessScript() {
  return `
<script>
(function () {
  var out = [];
  function ok(name, cond, detail) { out.push((cond ? "PASS" : "FAIL") + "|" + name + "|" + (detail || "")); }
  function qa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function btn(v) { return qa('[data-theme-choice="' + v + '"]'); }
  function meta(n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? (m.content || "") : ""; }
  function bgc() { return getComputedStyle(document.body).backgroundColor; }
  function fgc() { return getComputedStyle(document.body).color; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var jsErrors = [];
  window.addEventListener("error", function (e) { jsErrors.push(String(e.message)); });

  // Hold the window load event open until the assertions are done, so Chrome's
  // --dump-dom cannot fire early. This is also why the run does not use
  // --virtual-time-budget: virtual time fast-forwards timers without running a
  // compositor, and an IntersectionObserver with no frames never delivers its
  // scroll-triggered callbacks - the reveal test would then fail for reasons
  // that have nothing to do with the page.
  var hold = document.createElement("img");
  hold.src = "/__hold";
  hold.style.display = "none";
  document.body.appendChild(hold);
  function release() { fetch("/__done", { cache: "no-store" }).catch(function () {}); }

  // Transitions are killed up front. The theme tokens are swapped in a single
  // tick, but every element with a background-color/colour transition is still
  // tweening from the previous palette when getComputedStyle is read, so the
  // colour assertions below would sample a mid-fade value. (Same reason the
  // screenshot harness disables them.)
  var noAnim = document.createElement("style");
  noAnim.textContent = "*,*::before,*::after{transition:none !important;animation:none !important}";
  document.head.appendChild(noAnim);

  function token(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  var root = document.documentElement;
  var DARK_BG = "rgb(11, 14, 19)", DARK_FG = "rgb(244, 241, 234)";
  var LIGHT_BG = "rgb(241, 245, 251)", LIGHT_FG = "rgb(14, 27, 49)";
  // ---- theme switching -------------------------------------------------
  // A run may arrive with a theme already in localStorage, seeded before
  // js/theme.js executed. That is the point of the seeded runs, so the
  // initial-state assertions describe the seed rather than always assuming a
  // first visit.
  var SEED = window.__LIVE_SEED__;
  function themeTests() {
    ok("theme/has-switcher", qa("[data-theme-choice]").length >= 3, qa("[data-theme-choice]").length + " buttons");
    var sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var pref = root.getAttribute("data-theme-preference");
    var attr = root.getAttribute("data-theme");
    if (SEED === "system") {
      ok("theme/system-defaults-to-pref", pref === "system", pref);
      ok("theme/system-resolves", attr === (sysDark ? "dark" : "light"), "attr=" + attr + " prefersDark=" + sysDark);
      ok("theme/meta-tracks-system", meta("theme-color").toUpperCase() === (sysDark ? "#0B0E13" : "#F1F5FB"), meta("theme-color"));
    } else {
      ok("theme/persists-across-load", pref === SEED && attr === SEED, "seeded=" + SEED + " pref=" + pref + " attr=" + attr);
      ok("theme/persists-meta", meta("theme-color").toUpperCase() === (SEED === "light" ? "#F1F5FB" : "#0B0E13"), meta("theme-color"));
    }

    btn("light").forEach(function (b) { b.click(); });
    ok("theme/light-attr", root.getAttribute("data-theme") === "light", root.getAttribute("data-theme"));
    ok("theme/light-pref-attr", root.getAttribute("data-theme-preference") === "light", root.getAttribute("data-theme-preference"));
    ok("theme/light-persists", localStorage.getItem("dweb-theme") === "light", String(localStorage.getItem("dweb-theme")));
    ok("theme/light-theme-color", meta("theme-color").toUpperCase() === "#F1F5FB", meta("theme-color"));
    ok("theme/light-color-scheme", meta("color-scheme") === "light", meta("color-scheme"));
    ok("theme/light-bg-token", bgc() === LIGHT_BG, bgc());
    ok("theme/light-fg-token", fgc() === LIGHT_FG, fgc());
    // The custom properties themselves, not just the painted result: this is
    // the exact contract the rest of the stylesheet is written against.
    ok("theme/light-ink-var", token("--ink").toUpperCase() === "#F1F5FB", token("--ink"));
    ok("theme/light-paper-var", token("--paper").toUpperCase() === "#0E1B31", token("--paper"));
    ok("theme/light-blue-rgb-var", token("--blue-rgb") === "37, 99, 235", token("--blue-rgb"));
    ok("theme/light-aria-pressed", btn("light").every(function (b) { return b.getAttribute("aria-pressed") === "true"; }) &&
       btn("dark").every(function (b) { return b.getAttribute("aria-pressed") === "false"; }), "synced across all " + qa("[data-theme-choice]").length + " buttons");

    btn("dark").forEach(function (b) { b.click(); });
    ok("theme/dark-attr", root.getAttribute("data-theme") === "dark", root.getAttribute("data-theme"));
    ok("theme/dark-persists", localStorage.getItem("dweb-theme") === "dark", String(localStorage.getItem("dweb-theme")));
    ok("theme/dark-theme-color", meta("theme-color").toUpperCase() === "#0B0E13", meta("theme-color"));
    ok("theme/dark-color-scheme", meta("color-scheme") === "dark", meta("color-scheme"));
    ok("theme/dark-bg-token", bgc() === DARK_BG, bgc());
    ok("theme/dark-fg-token", fgc() === DARK_FG, fgc());
    ok("theme/dark-ink-var", token("--ink").toUpperCase() === "#0B0E13", token("--ink"));
    ok("theme/dark-paper-var", token("--paper").toUpperCase() === "#F4F1EA", token("--paper"));
    ok("theme/dark-blue-rgb-var", token("--blue-rgb") === "34, 104, 230", token("--blue-rgb"));
    var card = document.querySelector(".service-card, .project-card, .contact-tile, .feature-item, .focus-panel, .value-card, .beyond-card, .step-card, .why-card, .price-card, .journey-body, .story-aside, .faq-list details");
    if (card && card.classList.contains("contact-tile")) {
      var tileStyle = getComputedStyle(card);
      ok("theme/contact-directory-surface", tileStyle.boxShadow === "none" && tileStyle.borderBottomStyle === "solid", "unboxed row with divider");
    } else if (card) {
      ok("theme/shared-elevation", getComputedStyle(card).boxShadow !== "none", card.className.split(" ")[0] + " box-shadow present");
    }

    btn("system").forEach(function (b) { b.click(); });
    ok("theme/system-persists", localStorage.getItem("dweb-theme") === "system", String(localStorage.getItem("dweb-theme")));
    ok("theme/system-pref-attr", root.getAttribute("data-theme-preference") === "system", root.getAttribute("data-theme-preference"));
    btn("light").forEach(function (b) { b.click(); });
  }

  // ---- nav landmarks + current-page state -------------------------------
  // Static coverage in contract.mjs proves the markup is there; this proves the
  // browser actually sees it, and that the link marked current is the page you
  // are on (a stale copy-pasted header marks the wrong link, which reads as
  // correct on every page except one).
  function navTests() {
    var navs = qa("nav");
    ok("nav/landmarks-named", navs.length === 2 && navs.every(function (n) {
      return !!(n.getAttribute("aria-label") || n.getAttribute("aria-labelledby"));
    }), navs.length + " <nav> landmarks: " + navs.map(function (n) { return n.getAttribute("aria-label") || "(unnamed)"; }).join(" | "));

    var actives = qa(".nav-link.active");
    var currents = qa('[aria-current="page"]');
    var expected = window.__LIVE_PAGE__ === "404.html" ? 0 : 2;
    ok("nav/current-count-matches-active", actives.length === currents.length && currents.length === expected,
      actives.length + " .nav-link.active vs " + currents.length + " aria-current (expected " + expected + " on " + window.__LIVE_PAGE__ + ")");
    ok("nav/current-is-the-active-link", currents.every(function (a) { return /nav-link active/.test(a.className); }),
      currents.map(function (a) { return a.getAttribute("href") + "." + a.className; }).join(" | "));

    var here = location.pathname.split("/").pop();
    // project.html is a Work sub-page: no nav link names it, so the current
    // marker correctly stays on work.html while you are inside the case study.
    var currentTarget = here === "project.html" ? "work.html" : here;
    ok("nav/current-points-at-this-page", currents.every(function (a) { return a.getAttribute("href") === currentTarget; }),
      "current href=" + currents.map(function (a) { return a.getAttribute("href"); }).join(",") + " page=" + here);

    var opt = document.querySelector(".theme-option");
    ok("switcher/pointer-cursor", !!opt && getComputedStyle(opt).cursor === "pointer",
      opt ? getComputedStyle(opt).cursor : "no .theme-option");

    // The bar's only call to action. It is not a .btn, so it has to carry the
    // button family's affordances itself - it did not, and the arrow rendered
    // flush against the label.
    var cta = document.querySelector(".nav-cta");
    if (cta) {
      var cs = getComputedStyle(cta);
      ok("nav-cta/arrow-separated", parseFloat(cs.columnGap) >= 4, "column-gap=" + cs.columnGap);
      ok("nav-cta/pointer-cursor", cs.cursor === "pointer", cs.cursor);
      ok("nav-cta/never-wraps", cs.whiteSpace === "nowrap", cs.whiteSpace);
      ok("nav-cta/has-visual-presence", cs.boxShadow !== "none", cs.boxShadow.slice(0, 44));
      ok("nav-cta/has-an-arrow", !!cta.querySelector(".btn-arrow"), cta.textContent.trim());
    }
  }

  // ---- reveal-on-scroll -------------------------------------------------
  async function revealTests() {
    var all = qa(".reveal");
    if (!all.length) return;
    // Checked per-element rather than as a "scroll to the bottom and expect
    // everything" sweep: the observer unobserves on first intersection, and a
    // batched programmatic scroll can skip sections that were never on screen
    // in any single frame, which would look like a broken reveal.
    var first = all[0];
    await wait(250);
    ok("reveal/in-viewport-on-load", first.classList.contains("in"), "first .reveal has .in");

    // behavior:"instant" is required: the page sets scroll-behavior:smooth, and
    // in headless the smooth-scroll animation never advances (no compositor), so
    // the viewport is left parked part way and the element stays off screen.
    var last = all[all.length - 1];
    last.scrollIntoView({ block: "center", behavior: "instant" });
    await wait(500);
    var lr = last.getBoundingClientRect();
    ok("reveal/on-scroll-into-view", last.classList.contains("in"),
      "last=<" + last.tagName.toLowerCase() + " class='" + last.className + "'> top=" + Math.round(lr.top) + " h=" + Math.round(lr.height) + " vh=" + window.innerHeight + " scrollY=" + Math.round(window.scrollY) + " docH=" + document.documentElement.scrollHeight);

    var mid = all[Math.floor(all.length / 2)];
    mid.scrollIntoView({ block: "center", behavior: "instant" });
    await wait(500);
    ok("reveal/midway-element", mid.classList.contains("in"), "mid .reveal gains .in when scrolled to");
    ok("reveal/observer-unobserves", qa(".reveal.in").length >= 3, qa(".reveal.in").length + "/" + all.length + " revealed");
  }
  // ---- mobile drawer + breakpoint-aware switchers -----------------------
  async function mobileTests() {
    var narrow = window.innerWidth < 640;
    var burger = document.getElementById("hamburger");
    var drawer = document.getElementById("mobileDrawer");
    var backdrop = document.getElementById("mobileBackdrop");
    var closeBtn = document.getElementById("drawerClose");
    ok("drawer/elements-exist", !!(burger && drawer && backdrop && closeBtn), "hamburger/drawer/backdrop/close present");

    var serviceRow = document.querySelector(".features-row--service-categories");
    if (serviceRow) {
      var serviceCards = Array.prototype.slice.call(serviceRow.querySelectorAll(":scope > .feature-item"));
      ok("service-categories/all-open-services",
        serviceCards.length === 4 && serviceCards.every(function (card) { return card.getAttribute("href") === "services.html"; }),
        serviceCards.length + " category links");
      ok("service-categories/clear-link-cue",
        serviceCards.every(function (card) { return card.querySelector(".feature-go")?.textContent.indexOf("Explore services") !== -1; }),
        "each card names its destination");
      if (narrow) {
        ok("service-categories/single-column-on-mobile",
          getComputedStyle(serviceRow).gridTemplateColumns.split(" ").filter(Boolean).length === 1,
          getComputedStyle(serviceRow).gridTemplateColumns);
        ok("service-categories/no-horizontal-overflow",
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          "scroll=" + document.documentElement.scrollWidth + " client=" + document.documentElement.clientWidth);
      }
    }

    var desktopSwitch = document.querySelector(".nav-inner > .theme-switcher");
    if (narrow) {
      ok("switcher/desktop-hidden-on-mobile", !desktopSwitch || getComputedStyle(desktopSwitch).display === "none", "nav switcher display=" + (desktopSwitch ? getComputedStyle(desktopSwitch).display : "n/a"));
      var mobileSwitch = document.querySelector(".mobile-theme .theme-switcher");
      ok("switcher/mobile-shown", !!mobileSwitch && getComputedStyle(mobileSwitch).display !== "none", "drawer switcher present");
      var dOpt = drawer.querySelector(".theme-option");
      ok("switcher/drawer-touch-target", !!dOpt && parseFloat(getComputedStyle(dOpt).minHeight) >= 44,
        dOpt ? "min-height=" + getComputedStyle(dOpt).minHeight : "no drawer .theme-option");

      if (window.__LIVE_PAGE__ === "contact.html") {
        var contactBand = document.querySelector("#contact-band-cta .contact-band");
        var footerCta = document.querySelector("footer .footer-cta");
        var sectionToFooterGap = contactBand && footerCta
          ? footerCta.getBoundingClientRect().top - contactBand.getBoundingClientRect().bottom
          : Infinity;
        ok("contact/footer-gap-is-mobile-sized", sectionToFooterGap <= 100,
          "contact-to-footer CTA gap=" + Math.round(sectionToFooterGap) + "px");
      }
    }

    if (!narrow || !burger) return;
    ok("drawer/burger-visible", getComputedStyle(burger).display !== "none", "display=" + getComputedStyle(burger).display);
    ok("drawer/starts-closed", drawer.getAttribute("aria-hidden") === "true" && !drawer.classList.contains("open"), "aria-hidden=" + drawer.getAttribute("aria-hidden"));
    ok("drawer/label-says-open", burger.getAttribute("aria-label") === "Open menu", burger.getAttribute("aria-label"));

    burger.click();
    await wait(150);
    ok("drawer/opens", drawer.classList.contains("open") && backdrop.classList.contains("open"), "drawer+backdrop .open");
    var drawerContent = qa("#mobileDrawer .mobile-nav-list a, #mobileDrawer .mobile-theme .theme-option, #mobileDrawer .mobile-drawer-cta");
    ok("drawer/content-readable-during-entry",
      drawerContent.length > 0 && drawerContent.every(function (el) {
        return getComputedStyle(el).visibility === "visible" && parseFloat(getComputedStyle(el).opacity) >= 0.99;
      }),
      drawerContent.filter(function (el) { return parseFloat(getComputedStyle(el).opacity) < 0.99; }).length + " controls faded");
    var burgerRect = burger.getBoundingClientRect();
    var closeRect = closeBtn.getBoundingClientRect();
    ok("drawer/toggle-controls-share-position",
      Math.abs(burgerRect.left - closeRect.left) <= 1 &&
      Math.abs(burgerRect.top - closeRect.top) <= 1 &&
      Math.abs(burgerRect.width - closeRect.width) <= 1 &&
      Math.abs(burgerRect.height - closeRect.height) <= 1,
      "open " + Math.round(burgerRect.left) + "," + Math.round(burgerRect.top) +
      " close " + Math.round(closeRect.left) + "," + Math.round(closeRect.top));
    ok("drawer/aria-expanded", burger.getAttribute("aria-expanded") === "true", "aria-expanded=" + burger.getAttribute("aria-expanded"));
    // aria-expanded alone leaves the button announcing "Open menu" while it is
    // closing one, so the accessible name has to follow the state too.
    ok("drawer/label-flips-to-close", burger.getAttribute("aria-label") === "Close menu", burger.getAttribute("aria-label"));
    ok("drawer/aria-hidden-false", drawer.getAttribute("aria-hidden") === "false", "aria-hidden=" + drawer.getAttribute("aria-hidden"));
    ok("drawer/body-locks", document.body.classList.contains("menu-open"), "body.menu-open");

    // The drawer carries its own copy of the switcher, so it must work too.
    var inDrawer = drawer.querySelector('[data-theme-choice="dark"]');
    if (inDrawer) {
      inDrawer.click();
      ok("drawer/theme-switch-works", root.getAttribute("data-theme") === "dark", "data-theme=" + root.getAttribute("data-theme"));
      var back = drawer.querySelector('[data-theme-choice="light"]');
      if (back) back.click();
    }

    closeBtn.click();
    await wait(150);
    ok("drawer/closes", !drawer.classList.contains("open") && drawer.getAttribute("aria-hidden") === "true" && burger.getAttribute("aria-expanded") === "false" && !document.body.classList.contains("menu-open"), "fully reverted");
    ok("drawer/label-flips-back", burger.getAttribute("aria-label") === "Open menu", burger.getAttribute("aria-label"));
  }
  // ---- contact form validation -----------------------------------------
  async function formTests() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var status = document.getElementById("formStatus");
    var name = form.elements["name"], email = form.elements["email"], message = form.elements["message"];

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await wait(200);
    ok("form/empty-blocked", status.classList.contains("error") && status.classList.contains("show"), status.className);
    ok("form/blocks-network-call", status.textContent.indexOf("fix the highlighted fields") !== -1, status.textContent.slice(0, 60));
    ok("form/flags-required", name.getAttribute("aria-invalid") === "true" && email.getAttribute("aria-invalid") === "true" && message.getAttribute("aria-invalid") === "true", "name/email/message aria-invalid");
    var nameErr = document.getElementById("name-error");
    ok("form/field-messages", !!nameErr && nameErr.classList.contains("show"), nameErr ? nameErr.textContent : "missing");
    ok("form/focuses-first-invalid", document.activeElement === name, "active=" + (document.activeElement ? document.activeElement.name || document.activeElement.tagName : "none"));

    email.value = "not-an-email";
    email.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(100);
    ok("form/rejects-bad-email", document.getElementById("email-error").classList.contains("show"), document.getElementById("email-error").textContent.slice(0, 60));

    email.value = "dwebstudio00@gmail.com";
    name.value = "Test Client";
    message.value = "A test enquiry for the live harness.";
    ["name", "email", "message"].forEach(function (n) { form.elements[n].dispatchEvent(new Event("input", { bubbles: true })); });
    await wait(100);
    ok("form/clears-on-valid-input", ["name", "email", "message"].every(function (n) { return form.elements[n].getAttribute("aria-invalid") === null; }), "aria-invalid removed once valid");
    ok("form/submit-re-enabled", form.querySelector('button[type="submit"]').disabled === false, "submit enabled after validation failure");

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await wait(100);
    var consent = form.elements["privacy_consent"];
    var consentError = document.getElementById("privacy-consent-error");
    ok("form/consent-required", consent.getAttribute("aria-invalid") === "true" && consentError.classList.contains("show"), consentError.textContent);
    ok("form/consent-focuses-invalid", document.activeElement === consent, "active=" + (document.activeElement ? document.activeElement.name || document.activeElement.tagName : "none"));
    consent.checked = true;
    consent.dispatchEvent(new Event("change", { bubbles: true }));
    ok("form/consent-error-clears", consent.getAttribute("aria-invalid") === null && !consentError.classList.contains("show"), consentError.textContent);
    ok("form/validation-status-clears-after-corrections", !status.classList.contains("show"), status.className);
  }

  // ---- FAQ / accordion toggles -----------------------------------------
  async function faqTests() {
    var dets = qa(".faq-list details");
    if (!dets.length) return;
    var first = dets[0];
    var before = first.open;
    first.querySelector("summary").click();
    await wait(150);
    ok("accordion/faq-toggles", first.open !== before, "open " + before + " -> " + first.open);
    if (first.open) {
      first.querySelector("summary").click();
      await wait(150);
      ok("accordion/faq-closes-again", first.open === before, "open " + first.open);
    }
  }

  // ---- Core Capabilities expand-in-place accordion ----------------------
  // The detail panel is a sibling of the cards, not a child: js/main.js moves
  // it into the grid directly below the row of the card that opened it, one
  // panel at a time, and the whole card (not just its button) is the target.
  async function featureTests() {
    var toggles = qa(".feature-toggle");
    if (!toggles.length) return;

    // Scroll the section into view first: the cards carry .reveal, and their
    // entrance transform would offset any geometry measured against them.
    var row = document.querySelector(".features-strip--modules .features-row");
    if (row) {
      row.scrollIntoView({ block: "center", behavior: "instant" });
      await wait(450);
    }

    var panels = toggles.map(function (t) {
      return document.getElementById(t.getAttribute("aria-controls"));
    });
    ok("features/all-panels-present", panels.every(function (p) { return !!p; }),
      panels.filter(Boolean).length + "/" + toggles.length + " panels");
    ok("features/start-collapsed",
      toggles.every(function (t) { return t.getAttribute("aria-expanded") === "false"; }) &&
      panels.every(function (p) { return p.hidden; }),
      "all closed on load");

    // Open card 1: the panel lands below it as a full row.
    toggles[0].click();
    await wait(750);
    var t1 = toggles[0].getBoundingClientRect();
    var p1 = panels[0].getBoundingClientRect();
    ok("features/click-opens", toggles[0].getAttribute("aria-expanded") === "true" && !panels[0].hidden,
      "expanded=" + toggles[0].getAttribute("aria-expanded") + " hidden=" + panels[0].hidden);
    ok("features/panel-expands-below-card", p1.top >= t1.bottom - 10,
      "panel.top=" + Math.round(p1.top) + " card.bottom=" + Math.round(t1.bottom));
    ok("features/panel-lives-in-the-row", panels[0].parentElement === row && p1.width > 300,
      "inRow=" + (panels[0].parentElement === row) + " w=" + Math.round(p1.width));

    // Switching cards closes the previous panel - never two open at once.
    toggles[2].click();
    await wait(750);
    ok("features/switch-closes-previous", toggles[0].getAttribute("aria-expanded") === "false" && panels[0].hidden,
      "first hidden=" + panels[0].hidden);
    ok("features/switch-opens-new", toggles[2].getAttribute("aria-expanded") === "true" && !panels[2].hidden,
      "third hidden=" + panels[2].hidden);
    ok("features/never-multiple-open", qa('.feature-toggle[aria-expanded="true"]').length === 1,
      qa('.feature-toggle[aria-expanded="true"]').length + " expanded");
    var t3 = toggles[2].getBoundingClientRect();
    var p3 = panels[2].getBoundingClientRect();
    ok("features/switched-panel-below-its-card", p3.top >= t3.bottom - 10,
      "panel.top=" + Math.round(p3.top) + " card.bottom=" + Math.round(t3.bottom));

    // Clicking the open card again collapses it - via the card body rather
    // than the button, which also proves the whole card is the hit target.
    toggles[2].closest(".feature-item").click();
    await wait(750);
    ok("features/same-card-click-collapses",
      toggles[2].getAttribute("aria-expanded") === "false" && panels[2].hidden,
      "expanded=" + toggles[2].getAttribute("aria-expanded") + " hidden=" + panels[2].hidden);

    // A click on a closed card's body opens it too.
    toggles[1].closest(".feature-item").click();
    await wait(750);
    ok("features/card-body-click-opens", toggles[1].getAttribute("aria-expanded") === "true" && !panels[1].hidden,
      "expanded=" + toggles[1].getAttribute("aria-expanded"));
    toggles[1].click();
    await wait(750);

    ok("features/no-horizontal-overflow",
      document.documentElement.scrollWidth <= window.innerWidth + 1,
      "scrollWidth=" + document.documentElement.scrollWidth + " inner=" + window.innerWidth);
  }

  // ---- project.html?slug= rendering -------------------------------------
  // There is no server side to this page: js/project-detail.js reads the slug
  // from location.search and fills the panel. The run uses slug=attendx,
  // which has three gallery shots, four stack chips and a live URL.
  function projectTests() {
    if (window.__LIVE_PAGE__ !== "project.html") return;

    var h1 = document.getElementById("project-h1");
    ok("project/h1-shows-the-project-name", !!h1 && h1.textContent.indexOf("AttendX") !== -1,
      h1 ? h1.textContent.trim() : "missing #project-h1");
    ok("project/document-title-updated", document.title.indexOf("AttendX") !== -1, document.title);

    var panel = document.getElementById("project-detail");
    ok("project/panel-revealed", !!panel && panel.hidden === false,
      panel ? "hidden=" + panel.hidden : "missing #project-detail");
    var missing = document.getElementById("project-missing");
    ok("project/missing-state-stays-hidden", !!missing && missing.hidden === true,
      missing ? "hidden=" + missing.hidden : "missing #project-missing");

    var shot = document.getElementById("project-detail-shot");
    ok("project/gallery-shot-set", !!shot && /attendx-a\.jpg$/.test(shot.getAttribute("src") || ""),
      shot ? shot.getAttribute("src") : "missing #project-detail-shot");
    ok("project/thumbnails-rendered", qa("#project-detail-thumbs button").length === 3,
      qa("#project-detail-thumbs button").length + " thumbnails");
    ok("project/tech-chips-rendered", qa("#project-detail-tech .tech-tag").length === 4,
      qa("#project-detail-tech .tech-tag").length + " chips");
    ok("project/facts-rendered", qa("#project-detail-facts dd").length === 3,
      qa("#project-detail-facts dd").length + " fact values");

    var live = document.getElementById("project-detail-live");
    ok("project/live-link-points-at-the-real-site",
      !!live && live.hidden === false && live.getAttribute("href") === "https://attendx-ashy.vercel.app/",
      live ? "hidden=" + live.hidden + " href=" + live.getAttribute("href") : "missing #project-detail-live");
  }

  // Every handler on the page is attached from a DOMContentLoaded listener
  // (js/theme.js) or a deferred script (js/main.js), so driving the UI before
  // that point would be testing an inert page. DOMContentLoaded rather than
  // load, because the harness holds load open itself.
  function whenReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  whenReady(async function () {
    try { themeTests(); } catch (e) { ok("theme/suite", false, "threw: " + e.message); }
    try { navTests(); } catch (e) { ok("nav/suite", false, "threw: " + e.message); }
    try { await revealTests(); } catch (e) { ok("reveal/suite", false, "threw: " + e.message); }
    try { await mobileTests(); } catch (e) { ok("drawer/suite", false, "threw: " + e.message); }
    try { await formTests(); } catch (e) { ok("form/suite", false, "threw: " + e.message); }
    try { await faqTests(); } catch (e) { ok("accordion/suite", false, "threw: " + e.message); }
    try { await featureTests(); } catch (e) { ok("features/suite", false, "threw: " + e.message); }
    try { projectTests(); } catch (e) { ok("project/suite", false, "threw: " + e.message); }
    await wait(200);
    ok("runtime/no-js-errors", jsErrors.length === 0, jsErrors.join(" / ").slice(0, 200));
    var pre = document.createElement("pre");
    pre.id = "LIVE-RESULTS";
    pre.textContent = out.join("\\n");
    document.body.appendChild(pre);
    await wait(60);
    release();
  });
})();
</script>
`;
}

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

// The gate holds /__hold open until the page calls /__done, which keeps the
// window load event (and therefore Chrome's --dump-dom) pending for exactly as
// long as the assertions need. It auto-opens after a timeout so a harness
// exception fails the run instead of hanging it.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
let gateOpen = true;
let gatePromise = Promise.resolve();
let gateResolve = null;
function armGate() {
  gateOpen = false;
  gatePromise = new Promise((resolve) => { gateResolve = () => { gateOpen = true; resolve(); }; });
  setTimeout(() => { if (!gateOpen) gateResolve(); }, 60000).unref();
}
function openGate() { if (gateResolve) gateResolve(); }

let injected = "";
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);

  if (path === "/__done") { openGate(); res.writeHead(204).end(); return; }
  if (path === "/__hold") {
    res.writeHead(200, { "content-type": "image/gif", "cache-control": "no-store" });
    await gatePromise;
    res.end(PIXEL);
    return;
  }

  // Pages are served at their real paths, not under a /live/ prefix: the
  // markup uses root-relative and document-relative URLs (css/style.css,
  // js/theme.js, img/...), so serving it from a subdirectory would 404 every
  // asset and silently test a page with no CSS and no JS.
  if (path.endsWith(".html")) {
    if (!injected) { res.writeHead(503).end("no page armed"); return; }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(injected);
    return;
  }

  try {
    const buf = await readFile(path.slice(1));
    res.writeHead(200, { "content-type": MIME[extname(path).toLowerCase()] || "application/octet-stream" }).end(buf);
  } catch {
    res.writeHead(404).end("not found");
  }
});

function runChrome(url, width, height) {
  const profile = mkdtempSync(join(tmpdir(), "live-"));
  return new Promise((resolve) => {
    execFile(CHROME, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
      "--hide-scrollbars", "--force-device-scale-factor=1",
      "--user-data-dir=" + profile,
      "--window-size=" + width + "," + height,
      "--dump-dom", url
    ], { maxBuffer: 64 * 1024 * 1024, timeout: 120000 }, (err, stdout) => {
      resolve(String(stdout || "ERR:" + (err ? err.message : "no output")));
    });
  });
}

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
let pass = 0, fail = 0;
const failures = [];

for (const run of RUNS) {
  // Optional remote fonts and visual enhancers can delay local scripts when a
  // CDN is unavailable. Keep the runtime suite deterministic without them;
  // navigation, forms, theme state and disclosures still run normally.
  const source = (await readFile(run.page, "utf8"))
    .replace(/<link\b(?=[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com\/)[^>]*>/gi, "")
    .replace(
      /<script\b(?=[^>]*\bsrc="https:\/\/(?:unpkg\.com\/lucide@|cdnjs\.cloudflare\.com\/ajax\/libs\/anime\.js\/)[^"]+")[^>]*><\/script>/gi,
      ""
    );
  // Injected at the top of <head>, before js/theme.js: localStorage must already
  // hold the seed for it to win, and the harness needs to know which page it is
  // looking at (404 is the one page where no nav link is current).
  const seedValue = run.seed ?? "system";
  const seed = `<script>window.__LIVE_SEED__=${JSON.stringify(seedValue)};window.__LIVE_PAGE__=${JSON.stringify(run.page)};try{localStorage.setItem("dweb-theme",${JSON.stringify(seedValue)})}catch(e){}</script>`;
  injected = source.replace(/<head>/i, "<head>" + seed).replace(/<\/body>/i, harnessScript() + "</body>");
  if (injected === source) { console.log("SKIP " + run.tag + " (no <head>/</body> match)"); continue; }

  armGate();
  const target = `http://127.0.0.1:${port}/${run.page}` + (run.query ? `?${run.query}` : "");
  const dom = await runChrome(target, run.width, run.height);
  openGate();
  const match = dom.match(/<pre id="LIVE-RESULTS">([\s\S]*?)<\/pre>/);
  if (!match) { fail++; failures.push(`${run.tag}: harness produced no results (${dom.length} bytes dumped)`); continue; }

  const lines = decode(match[1]).split("\n").filter(Boolean);
  for (const line of lines) {
    const [status, name, detail = ""] = line.split("|");
    if (status === "PASS") pass++;
    else { fail++; failures.push(`${run.tag} :: ${name} :: ${detail}`); }
  }
  console.log(`ok  ${run.tag}  (${lines.length} assertions)`);
}

server.close();
console.log("");
console.log(`interaction: ${pass} passed, ${fail} failed`);
if (failures.length) { console.log(""); failures.forEach((f) => console.log("  FAIL  " + f)); process.exitCode = 1; }
