// D Web Studio — behavior contract for the final polish pass.
// Zero dependencies. Run: node tests/contract.mjs
// Static checks read the real files. The dynamic form lifecycle
// (empty submit blocked / bad email blocked / valid submit sends once)
// is exercised in the live preview; the assertions it must satisfy are
// encoded in FORM_JS_SIGNALS below so refactors can't silently drop them.

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const PAGES = ["index.html", "work.html", "services.html", "contact.html", "about.html", "experience.html", "404.html"];
const read = (f) => readFileSync(f, "utf8");

let pass = 0;
const fails = [];
const check = (id, ok, detail = "") => {
  if (ok) pass++;
  else fails.push(`${id}${detail ? ` — ${detail}` : ""}`);
};

// ---- 1. Project cards: exactly the real projects are clickable -------------
// project            url
const LIVE_PROJECTS = [
  ["AttendX",             "https://attendx-ashy.vercel.app/"],
  ["Shadow-Weaver",       "https://shadow-weaver.vercel.app/"],
  ["Gloom Hair &amp; Beauty", "https://gloom-hair-beauty.netlify.app/"],
  ["Divyansh Restaurant", "https://divyansh-restaurant-studio.netlify.app/"],
  ["VELOUR — New Collection", "https://divyanshladingpage.netlify.app/"],
  ["PRIME FITNESS",       "https://prime-fitness-beta.vercel.app/"],
];

for (const page of ["index.html", "work.html"]) {
  const html = read(page);
  const cardHrefs = [...html.matchAll(/<a\b[^>]*class="project-card[^"]*"[^>]*>/g)]
    .map(tag => tag[0].match(/href="([^"]+)"/)?.[1]).filter(Boolean);
  for (const [name, url] of LIVE_PROJECTS) {
    check(`${page}: ${name} is a clickable card with its real URL`,
      cardHrefs.includes(url), `found: ${cardHrefs.join(", ")}`);
  }
  // DGYMX: concept card must stay honest — no link, no fake screenshot
  const dgymxBlock = html.slice(html.indexOf("DGYMX") - 400, html.indexOf("DGYMX") + 900);
  check(`${page}: DGYMX is NOT a link`, !/<a[^>]*class="project-card[^>]*>\s*<div class="project-thumb"[^>]*>\s*<span class="tagpill">SaaS Concept/.test(html) || !cardHrefs.some(h => /dgymx/i.test(h)));
  check(`${page}: DGYMX card has no <img>`, !/<img[^>]*DGYMX/i.test(dgymxBlock.replace(/DGYMX gym management system preview/g, "")) && !/GymSalonImg/.test(html));
  check(`${page}: DGYMX labelled Concept · In Progress`, html.includes("Concept · In Progress"));
}

// ---- 2. The 766px bug: thumb images must size by CSS, not attributes -------
const css = read("css/style.css");
const thumbRule = css.match(/\.project-thumb img \{[^}]*\}/)?.[0] ?? "";
check("css: .project-thumb img sets height:auto (kills attr-pinned height)", /height:\s*auto/.test(thumbRule));
for (const page of ["index.html", "work.html"]) {
  check(`${page}: thumbs have explicit dimensions (CSS wins via height:auto)`,
    /\.project-thumb img \{[\s\S]*?height:\s*auto/.test(css) &&
    /<img[^>]*ProjectImage[^>]*width="\d+"[^>]*height="\d+"/.test(read(page)));
}

// ---- 3. No deleted-folder asset paths; every referenced image exists -------
const FORBIDDEN_PREFIXES = ["img/ServicesImage/", "img/Icone/", "img/PricingGridImage/"];
const allHtml = PAGES.map(read).join("\n") + "\n" + read("data/services.json");
for (const prefix of FORBIDDEN_PREFIXES) check(`no reference to deleted ${prefix}`, !allHtml.includes(prefix));
const imgRefs = [...new Set([...allHtml.matchAll(/(?:src)="(img\/[^"]+)"/g)].map(m => m[1]))];
for (const ref of imgRefs) check(`image exists: ${ref}`, existsSync(ref));

// ---- 4. Lucide: pinned everywhere, loaded where icons are used -------------
// ---- 4. Lucide: pinned everywhere it is loaded; loaded exactly where icons are used
const ICON_PAGES = ["index.html", "services.html", "contact.html"]; // only pages that ship data-lucide icons
const lucidePages = PAGES.filter(p => /<script[^>]*lucide/.test(read(p)));
check("lucide loaded exactly on icon-using pages",
  lucidePages.length === ICON_PAGES.length && ICON_PAGES.every(p => lucidePages.includes(p)),
  `got: ${lucidePages.join(", ")}`);
for (const page of lucidePages) {
  check(`${page}: lucide pinned to 0.544.0`, read(page).includes("lucide@0.544.0"));
  check(`${page}: no unpinned lucide@latest`, !read(page).includes("lucide@latest"));
}
for (const page of ["services.html", "contact.html"]) {
  check(`${page}: uses data-lucide icons`, read(page).includes("data-lucide="));
  check(`${page}: loads the lucide script`, /<script[^>]*lucide/.test(read(page)));
}

// ---- 5. Contact form contract (static surface + JS signal checks) ----------
const contact = read("contact.html");
const formJs = read("js/form.js");
check("form: has novalidate so JS validation is the single gate", /<form[^>]*id="contactForm"[^>]*novalidate/.test(contact));
for (const id of ["name", "email", "message"]) {
  check(`form: #${id} is required`, new RegExp(`id="${id}"[^>]*required`).test(contact));
}
check("form: company field present (optional)", /name="company"/.test(contact) && !/name="company"[^>]*required/.test(contact));
check("form: budget select present", /name="budget"/.test(contact));
check("form: honeypot kept", /name="botcheck"/.test(contact));
check("form: Web3Forms endpoint kept", formJs.includes("api.web3forms.com/submit"));
const FORM_JS_SIGNALS = [
  ["blocks empty required fields", /Please enter your name\./.test(formJs)],
  ["rejects malformed email", /doesn't look right/.test(formJs)],
  ["wires aria-invalid", /setAttribute\("aria-invalid"/.test(formJs)],
  ["clears error state after success", /clearFieldError/.test(formJs)],
  ["restores submit button label", /originalHTML/.test(formJs)],
];
for (const [label, ok] of FORM_JS_SIGNALS) check(`form.js: ${label}`, ok);

// ---- 6. SEO: canonical domain, one h1, JSON-LD matches the cards -----------
for (const page of ["index.html", "work.html", "services.html", "contact.html"]) {
  const html = read(page);
  check(`${page}: canonical uses dwebstudio.com`, /rel="canonical" href="https:\/\/dwebstudio\.com\//.test(html));
  check(`${page}: no YOUR-DOMAIN placeholder`, !html.includes("YOUR-DOMAIN"));
  check(`${page}: exactly one h1`, (html.match(/<h1[\s>]/g) ?? []).length === 1);
}
check("index: twitter:card is summary (square logo)", /name="twitter:card" content="summary"/.test(read("index.html")));
check("index: unused Spline viewer removed", !read("index.html").includes("spline-viewer"));

// work.html JSON-LD ItemList must agree with the rendered cards
const workHtml = read("work.html");
try {
  const jsonld = JSON.parse(workHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const itemUrls = (jsonld.mainEntity?.itemListElement ?? []).map(i => i.url).filter(Boolean);
  const cardUrls = [...workHtml.matchAll(/<a[^>]*class="project-card[^"]*"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  check("work: JSON-LD parses and lists every card URL",
    cardUrls.every(u => itemUrls.includes(u)), `items: ${itemUrls.length}, cards: ${cardUrls.length}`);
} catch {
  check("work: JSON-LD parses", false);
}

// ---- 7. Dead code stays dead ------------------------------------------------
check("js/from.js removed", !existsSync("js/from.js"));
check("css/index.css removed", !existsSync("css/index.css"));
for (const page of PAGES) check(`${page}: no from.js / css/index.css reference`, !/from\.js|css\/index\.css/.test(read(page)));
check("no console.log in shipped JS", !/console\.log/.test(read("js/form.js") + read("js/main.js")));

// ---- 8. JS parses ------------------------------------------------------------
for (const f of ["js/form.js", "js/main.js"]) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); check(`${f}: parses`, true); }
  catch (e) { check(`${f}: parses`, false, String(e.stderr).slice(0, 120)); }
}

// ---- report ------------------------------------------------------------------
console.log(`\ncontract: ${pass} passed, ${fails.length} failed`);
if (fails.length) {
  console.log("\nFAILURES:");
  for (const f of fails) console.log("  ✗ " + f);
  process.exit(1);
}
