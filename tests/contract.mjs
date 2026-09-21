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
  const dgymxBlock = html.slice(html.indexOf("DGYMX") - 400, html.indexOf("DGYMX") + 900);
  check(`${page}: DGYMX is NOT a link`, !/<a[^>]*class="project-card[^>]*>\s*<div class="project-thumb"[^>]*>\s*<span class="tagpill">SaaS Concept/.test(html) || !cardHrefs.some(h => /dgymx/i.test(h)));
  check(`${page}: DGYMX card has no <img>`, !/<img[^>]*DGYMX/i.test(dgymxBlock.replace(/DGYMX gym management system preview/g, "")) && !/GymSalonImg/.test(html));
  check(`${page}: DGYMX labelled Concept · In Progress`, html.includes("Concept · In Progress"));
}

const css = read("css/style.css");
const thumbRule = css.match(/\.project-thumb img \{[^}]*\}/)?.[0] ?? "";
check("css: .project-thumb img sets height:auto (kills attr-pinned height)", /height:\s*auto/.test(thumbRule));
for (const page of ["index.html", "work.html"]) {
  check(`${page}: thumbs have explicit dimensions (CSS wins via height:auto)`,
    /\.project-thumb img \{[\s\S]*?height:\s*auto/.test(css) &&
    /<img[^>]*ProjectImage[^>]*width="\d+"[^>]*height="\d+"/.test(read(page)));
}

const FORBIDDEN_PREFIXES = ["img/ServicesImage/", "img/Icone/", "img/PricingGridImage/"];
const allHtml = PAGES.map(read).join("\n") + "\n" + read("data/services.json");
for (const prefix of FORBIDDEN_PREFIXES) check(`no reference to deleted ${prefix}`, !allHtml.includes(prefix));
const imgRefs = [...new Set([...allHtml.matchAll(/(?:src)="(img\/[^"]+)"/g)].map(m => m[1]))];
for (const ref of imgRefs) check(`image exists: ${ref}`, existsSync(ref));

const ICON_PAGES = ["index.html", "services.html", "contact.html"];
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

check("form: honeypot is an unchecked checkbox that stays unsubmitted for humans",
  /<input[^>]*type="checkbox"[^>]*name="botcheck"/.test(contact) &&
  !/<input[^>]*name="botcheck"[^>]*checked/.test(contact) &&
  !/<input[^>]*checked[^>]*name="botcheck"/.test(contact));

for (const page of ["index.html", "work.html", "services.html", "contact.html"]) {
  const html = read(page);
  check(`${page}: canonical uses dwebstudio.com`, /rel="canonical" href="https:\/\/dwebstudio\.com\//.test(html));
  check(`${page}: no YOUR-DOMAIN placeholder`, !html.includes("YOUR-DOMAIN"));
  check(`${page}: exactly one h1`, (html.match(/<h1[\s>]/g) ?? []).length === 1);
}
check("index: twitter:card is summary (square logo)", /name="twitter:card" content="summary"/.test(read("index.html")));
check("index: unused Spline viewer removed", !read("index.html").includes("spline-viewer"));

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

check("js/from.js removed", !existsSync("js/from.js"));
check("css/index.css removed", !existsSync("css/index.css"));
for (const page of PAGES) check(`${page}: no from.js / css/index.css reference`, !/from\.js|css\/index\.css/.test(read(page)));
check("no console.log in shipped JS", !/console\.log/.test(read("js/form.js") + read("js/main.js")));

for (const f of ["js/form.js", "js/main.js"]) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); check(`${f}: parses`, true); }
  catch (e) { check(`${f}: parses`, false, String(e.stderr).slice(0, 120)); }
}

const PAGE_CSS = {
  "404.html": "css/404.css",
  "about.html": "css/about.css",
  "contact.html": "css/contact.css",
  "experience.html": "css/experience.css",
  "services.html": "css/services.css",
};
for (const page of PAGES) {
  const html = read(page);
  check(`${page}: loads css/style.css`, html.includes('href="css/style.css"'));
  const own = PAGE_CSS[page];
  check(`${page}: ${own ? `loads ${own}` : "loads no page-specific sheet"}`,
    own ? html.includes(`href="${own}"`) : !/href="css\/(?!style\.css)/.test(html));
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map(m => m[1]).filter(s => !/^\.reveal\{opacity:1!important;transform:none!important;\}$/.test(s.trim()));
  check(`${page}: no inline <style> block`, inline.length === 0, inline.join(" | ").slice(0, 80));
  check(`${page}: style.css is linked before page CSS`,
    !own || html.indexOf('href="css/style.css"') < html.indexOf(`href="${own}"`));
}
for (const sheet of ["css/style.css", ...Object.values(PAGE_CSS)]) {
  check(`${sheet} exists and is linked`, existsSync(sheet) && PAGES.some(p => read(p).includes(`href="${sheet}"`)));
}

check("img/logo.png excluded from deploys via .assetsignore",
  /^img\/logo\.png$/m.test(read(".assetsignore")) &&
  !PAGES.some(p => read(p).includes("logo.png")));

console.log(`\ncontract: ${pass} passed, ${fails.length} failed`);
if (fails.length) {
  console.log("\nFAILURES:");
  for (const f of fails) console.log("  ✗ " + f);
  process.exit(1);
}
