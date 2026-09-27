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
  // The studio's own portfolio, deployed on Vercel. It was a non-clickable
  // <div> until it was given a real live URL like every other shipped project.
  ["Divy Web Studio",     "https://divywebstudio-portfolio.vercel.app/"],
];

for (const page of ["index.html", "work.html"]) {
  const html = read(page);
  const cardHrefs = [...html.matchAll(/<a\b[^>]*class="project-card[^"]*"[^>]*>/g)]
    .map(tag => tag[0].match(/href="([^"]+)"/)?.[1]).filter(Boolean);
  for (const [name, url] of LIVE_PROJECTS) {
    check(`${page}: ${name} is a clickable card with its real URL`,
      cardHrefs.includes(url), `found: ${cardHrefs.join(", ")}`);
  }
  check(`${page}: DGYMX is NOT a link`, !/<a[^>]*class="project-card[^>]*>\s*<div class="project-thumb"[^>]*>\s*<span class="tagpill">SaaS Concept/.test(html) || !cardHrefs.some(h => /dgymx/i.test(h)));
  check(`${page}: DGYMX card shows its real screenshot`, /<img[^>]*DgymxImage\.png[^>]*alt="DGYMX gym management dashboard preview"/.test(html) && /width="1359" height="732"/.test(html));
  check(`${page}: DGYMX screenshot is the only img on that card, and lazy`, (() => {
    const i = html.indexOf("DgymxImage.png");
    const card = html.slice(html.lastIndexOf("project-card", i), html.indexOf("project-body", i));
    return (card.match(/<img\b/g) || []).length === 1 && /loading="lazy"/.test(card);
  })());
  check(`${page}: DGYMX labelled Concept · In Progress`, html.includes("Concept · In Progress"));
}

const css = read("css/style.css");
const themeScript = read("js/theme.js");
const mainJs = read("js/main.js");
const indexHtml = read("index.html");
for (const page of PAGES) {
  const html = read(page);
  check(`${page}: loads theme controller before stylesheet`,
    html.indexOf('src="js/theme.js"') > -1 &&
    html.indexOf('src="js/theme.js"') < html.indexOf('href="css/style.css"'));
  check(`${page}: has desktop and mobile theme controls`,
    (html.match(/class="theme-switcher"/g) ?? []).length === 2 &&
    ["light", "dark", "system"].every(theme => html.includes(`data-theme-choice="${theme}"`)));
}
check("theme: defaults to system and follows device appearance",
  themeScript.includes('"system"') && themeScript.includes('(prefers-color-scheme: dark)'));
check("theme: persists the selected option",
  themeScript.includes("localStorage.setItem") && themeScript.includes("storage"));
check("theme: light palette and accessible pressed states are defined",
  css.includes(':root[data-theme="light"]') && css.includes('.theme-option[aria-pressed="true"]'));

// ---------------------------------------------------------------------------
// Theme tokens
//
// These read the real custom-property values out of css/style.css and
// recompute WCAG ratios, so a palette change that quietly breaks contrast
// fails here instead of shipping. Nothing below trusts a comment.
// ---------------------------------------------------------------------------

// Pulls the custom properties out of one `:root` / `:root[...]` block.
// Comments are stripped first: the light block explains itself in prose that
// contains token names ("--paper:" inside a sentence), and a naive regex
// happily reads the sentence as the declaration and overwrites the real value.
const readTokens = (selector) => {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const at = source.indexOf(selector + " {");
  if (at < 0) return null;
  const block = source.slice(at, source.indexOf("}", at));
  const out = {};
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
};
const hex = (v) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v ?? "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map(c => c + c).join("") : m[1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};
const chan = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const lum = (rgb) => 0.2126 * chan(rgb[0]) + 0.7152 * chan(rgb[1]) + 0.0722 * chan(rgb[2]);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// An rgba(r, g, b, a) fill composited onto an opaque backdrop, for --line*.
const composite = (triplet, alpha, bg) => {
  const p = String(triplet).split(",").map(parseFloat);
  return [0, 1, 2].map(i => p[i] * alpha + bg[i] * (1 - alpha));
};
const MIN_TEXT = 4.5;      // WCAG AA for body-size text
const MIN_SURFACE = 1.08;  // non-text separation floor for this design

const darkTokens = readTokens(":root");
const lightTokens = readTokens(':root[data-theme="light"]');

check("theme: both token blocks are parseable", Boolean(darkTokens && lightTokens));
check("theme: the light block is not the dark block with the words swapped",
  Boolean(darkTokens && lightTokens && darkTokens["--ink"] !== lightTokens["--ink"]));

if (darkTokens && lightTokens) {
  for (const [label, tokens] of [["dark", darkTokens], ["light", lightTokens]]) {
    const page = hex(tokens["--ink"]);
    const card = hex(tokens["--ink-2"]);
    const chip = hex(tokens["--ink-3"]);
    check(`theme ${label}: --ink / --ink-2 / --ink-3 are valid colours`, Boolean(page && card && chip));

    // Text. --muted-2 is the *tertiary* token, so it has to be the
    // lower-contrast of the two - it used to be inverted in both themes.
    const paper = hex(tokens["--paper"]);
    const muted = hex(tokens["--muted"]);
    const muted2 = hex(tokens["--muted-2"]);
    for (const [name, value, surfaceName, surface] of [
      ["--paper", paper, "page", page], ["--muted", muted, "page", page],
      ["--muted-2", muted2, "page", page], ["--muted", muted, "card", card],
      ["--muted-2", muted2, "card", card], ["--muted-2", muted2, "chip", chip],
    ]) {
      check(`theme ${label}: ${name} on ${surfaceName} >= ${MIN_TEXT}:1`,
        Boolean(value && surface) && ratio(value, surface) >= MIN_TEXT,
        value && surface ? `${ratio(value, surface).toFixed(2)}:1` : "missing token");
    }
    check(`theme ${label}: --muted-2 is lower contrast than --muted (hierarchy)`,
      ratio(muted2, page) < ratio(muted, page),
      `muted ${ratio(muted, page).toFixed(2)} vs muted-2 ${ratio(muted2, page).toFixed(2)}`);

    // Accents that carry text.
    for (const name of ["--blue-light", "--gold", "--live", "--danger"]) {
      const v = hex(tokens[name]);
      check(`theme ${label}: ${name} on page >= ${MIN_TEXT}:1`,
        Boolean(v) && ratio(v, page) >= MIN_TEXT, v ? `${ratio(v, page).toFixed(2)}:1` : "not a hex value");
    }
    check(`theme ${label}: white on --blue-deep button >= ${MIN_TEXT}:1`,
      ratio(hex(tokens["--blue-deep"]), [255, 255, 255]) >= MIN_TEXT);

    // Surface separation. This is the check that catches a washed-out theme:
    // a white card on a near-white page measures about 1.03:1.
    check(`theme ${label}: page vs card surfaces >= ${MIN_SURFACE}:1`,
      ratio(page, card) >= MIN_SURFACE, `${ratio(page, card).toFixed(2)}:1`);
    check(`theme ${label}: card vs chip surfaces >= ${MIN_SURFACE}:1`,
      ratio(card, chip) >= MIN_SURFACE, `${ratio(card, chip).toFixed(2)}:1`);

    // A border has to be visible against the surface it sits on.
    for (const name of ["--line", "--line-strong"]) {
      const m = /rgba?\(([^)]+)\)/.exec(tokens[name] || "");
      const rgb = m ? m[1].split(",").map(parseFloat) : null;
      const alpha = rgb && rgb.length === 4 ? rgb[3] : 1;
      const mixed = rgb ? composite(rgb.slice(0, 3), alpha, card) : null;
      check(`theme ${label}: ${name} visible on its surface >= 1.3:1`,
        Boolean(mixed) && ratio(mixed, card) >= 1.3,
        mixed ? `${ratio(mixed, card).toFixed(2)}:1` : "unparseable");
    }

    // Every accent used at low alpha needs its -rgb companion. --gold-rgb was
    // missing from the light block, which left the gold pills on dark-theme
    // alphas over a white page. --blue-rgb is deliberately shared.
    for (const rgbName of ["--blue-rgb", "--gold-rgb", "--live-rgb", "--danger-rgb"]) {
      check(`theme ${label}: ${rgbName} is declared`, Boolean(tokens[rgbName]),
        "needed for the rgba() washes");
    }
  }

  check("theme: light redeclares --gold-rgb (the gold-pill bug)",
    Boolean(lightTokens["--gold-rgb"]) && lightTokens["--gold-rgb"] !== darkTokens["--gold-rgb"]);
  check("theme: elevation tokens are declared per theme",
    darkTokens["--card-shadow"] !== lightTokens["--card-shadow"]);
  check("theme: --wash-1 darkens on the light theme (a white wash cannot)",
    /rgba\(\s*244/.test(darkTokens["--wash-1"] || "") && /rgba\(\s*14/.test(lightTokens["--wash-1"] || ""));
}

// ---------------------------------------------------------------------------
// Overlay chip (project .tagpill)
//
// The pill sits on a project screenshot - a photograph, identical in both
// themes - so its scrim is a fixed near-black. It used to declare no `color`,
// so the label inherited the page ink: cream in dark mode (17:1) but the light
// theme's dark navy in light mode, which is the same colour as its own scrim.
// DGYMX's "SaaS Concept" measured 1.19:1 - invisible, which is exactly the
// report this block exists for.
//
// The rule that matters: a fixed scrim forces a fixed foreground. Assert the
// scrim/ink pair, assert it is declared once in :root and never redeclared in
// the light block, and recompute the worst case - the pill over pure white.
// ---------------------------------------------------------------------------
{
  const pillRule = (() => {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const at = clean.indexOf(".tagpill {");
    return at < 0 ? null : clean.slice(at, clean.indexOf("}", at));
  })();

  check("pill: .tagpill rule exists", Boolean(pillRule));
  if (pillRule) {
    // `color` must be stated outright. An inherited colour is the whole bug:
    // every value here is a fixed light, so a missing declaration is silent.
    check("pill: .tagpill states its own color (never inherited)",
      /(?:^|[;{\s])color\s*:/.test(pillRule),
      "an inherited color is the light-mode 1.19:1 regression");
    check("pill: .tagpill uses the --pill-* tokens for all three parts",
      /background\s*:\s*var\(--pill-scrim\)/.test(pillRule) &&
      /color\s*:\s*var\(--pill-ink\)/.test(pillRule) &&
      /border\s*:[^;]*var\(--pill-line\)/.test(pillRule));
    // The old rule hardcoded the scrim and borrowed --line-strong, so the
    // hairline flipped with the theme while the scrim did not.
    check("pill: .tagpill does not hardcode its scrim colour",
      !/background\s*:\s*rgba/.test(pillRule) && !/border\s*:[^;]*var\(--line/.test(pillRule));
  }

  for (const name of ["--pill-scrim", "--pill-ink", "--pill-line"]) {
    check(`pill: ${name} is declared in :root`, Boolean(darkTokens?.[name]));
    check(`pill: ${name} is NOT redeclared in the light block`,
      lightTokens?.[name] === undefined,
      "the scrim is a fixed dark in both themes, so its parts must not flip");
  }

  // Worst case is a pill sitting over pure white, which is the lightest a
  // project screenshot can be - the real DGYMX shot averages 248,238,239.
  const scrimRgb = (() => {
    const m = /rgba?\(([^)]+)\)/.exec(darkTokens?.["--pill-scrim"] || "");
    if (!m) return null;
    const p = m[1].split(",").map(parseFloat);
    return p.length === 4 ? p : [...p, 1];
  })();
  const pillInk = hex(darkTokens?.["--pill-ink"]);
  check("pill: --pill-ink is a valid colour", Boolean(pillInk));

  if (scrimRgb && pillInk) {
    const overWhite = composite(scrimRgb.slice(0, 3), scrimRgb[3], [255, 255, 255]);
    const r = ratio(pillInk, overWhite);
    check(`pill: label on its scrim over pure white >= ${MIN_TEXT}:1`, r >= MIN_TEXT,
      `${r.toFixed(2)}:1`);
  }
}

// theme.js writes the theme-colour meta tag in JS, so nothing in CSS can catch
// a drift. Assert both literals against the --ink tokens they mirror.
for (const [theme, ink] of [["light", lightTokens?.["--ink"]], ["dark", darkTokens?.["--ink"]]]) {
  check(`theme: js/theme.js theme-color meta matches --ink for ${theme}`,
    Boolean(ink) && themeScript.includes(`"${ink}"`),
    `expected meta theme-color "${ink}" - the browser chrome paints a colour matching neither theme if these drift`);
}

// One shared elevation rule, so the two themes cannot drift apart again.
const SHADOWED = [".service-card", ".project-card", ".step-card", ".why-card", ".price-card",
  ".contact-tile", ".feature-item", ".story-aside", ".faq-list details", ".beyond-card",
  ".journey-body", ".value-card", ".focus-panel"];
const sharedShadow = css.match(/(\.service-card,[\s\S]*?)\{\s*box-shadow:\s*var\(--card-shadow\);/);
check("css: every card surface takes its elevation from the shared rule",
  Boolean(sharedShadow) && SHADOWED.every(s => sharedShadow[1].includes(s)),
  sharedShadow ? "missing: " + SHADOWED.filter(s => !sharedShadow[1].includes(s)).join(", ") : "rule not found");
// A white fill can only lighten, so on a white page it composites to nothing -
// that was the original washed-out light theme. This forbids white fills in the
// *theme-agnostic* layer, leaving only the `:root[data-theme="light"]` override
// block, where white IS the point. The DGYMX card used to be an exception (its
// hand-built dark mock drew white chrome dots); it now uses a real screenshot
// like every other card, so no carve-out is needed.
const LAYER = css.replace(/:root\[data-theme="light"\][^{]*\{[\s\S]*?\n\}/g, "");
const whiteFills = [...LAYER.matchAll(/^([^{}]+)\{([^{}]*)\}/gm)]
  .filter(([, , body]) => /background:\s*rgba\(255,\s*255,\s*255/.test(body))
  .map(([, sel]) => sel.trim().split(",").pop().trim());
check("css: no themed surface is filled with a wash that cannot flip",
  whiteFills.length === 0,
  whiteFills.length ? "use var(--wash-1) / var(--wash-2) in: " + whiteFills.join(", ") : "");
check("css: the dead WIP-card mock is gone, not just unused",
  !/thumb-inner|thumb-mockbar|thumb-icon|wip-word/.test(css) && !/thumb-inner|thumb-mockbar|thumb-icon|wip-word/.test(indexHtml + read("work.html")),
  "stale mock styles/markup left behind after the screenshot landed");
check("css: the two CTA bands are painted on a real surface, not just a wash",
  /\.contact-band\s*\{[\s\S]{0,400}var\(--ink-2\)/.test(css) &&
  /\.github-band\s*\{[\s\S]{0,400}var\(--ink-2\)/.test(css));

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------
for (const page of PAGES) {
  const html = read(page);
  // The header lockup is the one place the name is deliberately NOT spaced.
  // "Web" and "Studio" touch, so the navy-to-blue change reads as a split
  // inside a single word - "Divy WebStudio" - rather than as two words that
  // happen to be adjacent. Everything else (the footer, titles, JSON-LD) keeps
  // the spaced display name, so both halves are pinned: a blanket find/replace
  // that dropped the space everywhere would fail the second check, and one that
  // missed the header would fail the first.
  check(`${page}: header brand is the tight "Divy WebStudio" lockup`,
    /class="nav-brand"><img src="img\/logo\.jpg" alt="Divy Web Studio logo">Divy Web<span class="studio">Studio<\/span>/.test(html),
    'expected: ...>Divy Web<span class="studio">Studio</span></a> with no space before the span');
  check(`${page}: the spaced display name survives everywhere else`,
    html.includes('Divy Web <span class="studio">Studio</span>'),
    "the footer lockup and the page copy must not lose the space");
  check(`${page}: no leftover "D Web Studio" display name`, !html.includes("D Web Studio"));
  check(`${page}: copyright line uses the new name`,
    /<span id="year">\d{4}<\/span> Divy Web Studio\./.test(html));
  check(`${page}: logo alt text uses the new name`, !/alt="D Web Studio/.test(html));
}
const allPagesHtml = PAGES.map(read).join("\n");
check("brand: real-world identifiers survived the display-name rename",
  allPagesHtml.includes("dwebstudio00@gmail.com") && allPagesHtml.includes("d__web_studio") &&
  allPagesHtml.includes("Mr-Divyansh") && allPagesHtml.includes("dwebstudio.com"),
  "domain / email / handles must not be renamed");
check("brand: theme storage key kept so saved preferences survive",
  themeScript.includes('"dweb-theme"'));

const featureToggleIds = [...indexHtml.matchAll(/<button class="feature-toggle" id="([^"]+)"/g)].map(match => match[1]);
const featurePanelIds = [...indexHtml.matchAll(/<div class="feature-panel" id="([^"]+)"/g)].map(match => match[1]);
check("index: four feature accordion controls are present",
  featureToggleIds.length === 4 && featurePanelIds.length === 4);
check("index: each feature control targets its own panel",
  featureToggleIds.every((id, index) => indexHtml.includes(`id="${id}"`) && indexHtml.includes(`aria-controls="${featurePanelIds[index]}"`)));
check("index: feature panels start collapsed and are labelled",
  (indexHtml.match(/class="feature-panel"[^>]* hidden/g) ?? []).length === 4 &&
  featurePanelIds.every(id => indexHtml.includes(`aria-labelledby="feature-toggle-${id.slice(-1)}"`)));
check("features: one-at-a-time accordion behavior is implemented",
  mainJs.includes("setFeatureExpanded") && mainJs.includes("featureItems.forEach") && mainJs.includes("panel.hidden = !expanded"));

const thumbRule = css.match(/\.project-thumb img \{[^}]*\}/)?.[0] ?? "";
check("css: .project-thumb img sets height:auto (kills attr-pinned height)", /height:\s*auto/.test(thumbRule));
for (const page of ["index.html", "work.html"]) {
  check(`${page}: thumbs have explicit dimensions (CSS wins via height:auto)`,
    /\.project-thumb img \{[\s\S]*?height:\s*auto/.test(css) &&
    /<img[^>]*ProjectImage[^>]*width="\d+"[^>]*height="\d+"/.test(read(page)));
}

// ---------------------------------------------------------------------------
// About: the "at a glance" card
//
// The card was an unlabelled two-column definition list whose last cell was a
// <span> addressed by `span:last-child`. Turning that cell into a real <a> link
// silently un-styled it - `span:last-child` no longer matched - so the
// assertions below pin the parts that regress quietly.
// ---------------------------------------------------------------------------

const aboutHtml = read("about.html");
const aboutCss = read("css/about.css");
const aside = aboutHtml.match(/<div class="story-aside[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? "";
const asideRows = [...aside.matchAll(/<div class="row">([\s\S]*?)<\/div>/g)].map(m => m[1]);

check("about: the story-aside card is labelled, not a bare definition list",
  /<span class="story-aside-title">[^<]+<\/span>/.test(aside) && /\.story-aside-title\s*\{/.test(aboutCss));
check("about: every story-aside row is a label/value pair",
  asideRows.length === 5 && asideRows.every(r => (r.match(/<(span|a)\b/g) ?? []).length === 2),
  `rows=${asideRows.length} cells=${asideRows.map(r => (r.match(/<(span|a)\b/g) ?? []).length).join(",")}`);
check("about: the story-aside GitHub cell is a real external link",
  /<div class="row"><span>Also on<\/span><a href="https:\/\/github\.com\/Mr-Divyansh" target="_blank" rel="noopener noreferrer">/.test(aside));
check("about: story-aside value column is styled tag-agnostically",
  /\.story-aside \.row > :last-child\s*\{/.test(aboutCss) && !/\.story-aside \.row span:last-child/.test(aboutCss),
  "a span-tagged selector would drop the <a> value back to unstyled");
check("about: story-aside rows stack on narrow viewports",
  /@media \(max-width: 420px\)[\s\S]*?\.story-aside \.row \{[\s\S]*?grid-template-columns: 1fr/.test(aboutCss));

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

// The "what happens next" panel that fills the form's empty right column.
// Each block is extracted *bounded* before it is asserted on. A loose
// `[\s\S]*` here would happily re-match the 980px media query's own copy of
// `.quick-start-grid` and pass even with the desktop rule broken, so the
// desktop rule, the media rule and the aside element are each pulled out
// separately and checked on their own.
const contactCss = read("css/contact.css");
const cssBlocks = (re) => (contactCss.match(re) || []);
const gridRules = cssBlocks(/\.quick-start-grid\s*\{[^}]*\}/g);
const gridDesktop = gridRules[0] || "";
const gridNarrow = cssBlocks(/@media[^{]*\{[\s\S]*?\.quick-start-grid\s*\{[^}]*\}/g)[0] || "";
// Scoped to the 980px block itself: the sticky release sits in that same media
// query, so the block is cut out first and then the override checked inside it.
const narrowBlock = (contactCss.match(/@media\s*\(max-width:\s*980px\)\s*\{[\s\S]*?\n\}/) || [])[0] || "";
const asideEl = (contact.match(/<aside class="quick-aside[\s\S]*?<\/aside>/) || [])[0] || "";

check("contact: quick-start uses a two-column grid", /display:\s*grid/.test(gridDesktop));
check("contact: the aside sits beside the form, not below it",
  /grid-template-columns:[^;]*minmax\(0,\s*660px\)\s+minmax\(0,\s*1fr\)/.test(gridDesktop));
check("contact: the aside drops to one column on narrow screens",
  /@media\s*\(max-width:\s*980px\)/.test(gridNarrow) &&
  /grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(gridNarrow));
check("contact: sticky aside is released when the grid stacks",
  /\.quick-aside\s*\{\s*position:\s*static/.test(narrowBlock));
check("contact: the aside is inside the same grid as the form",
  /<div class="quick-start-grid">\s*<form[^>]*id="contactForm"[\s\S]*?<\/form>\s*<aside class="quick-aside/.test(contact));
check("contact: the aside is a heading plus a real ordered list",
  /<h3 class="quick-aside-title">/.test(asideEl) && /<ol class="quick-steps">/.test(asideEl));
check("contact: step numbers are decorative, the list carries the order",
  (asideEl.match(/class="step-num" aria-hidden="true"/g) || []).length === 3);
check("contact: the aside adds no new form fields", !/<(input|select|textarea)\b/.test(asideEl));

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
check("no console.log in shipped JS", !/console\.log/.test(read("js/form.js") + read("js/main.js") + themeScript));

for (const f of ["js/form.js", "js/main.js", "js/theme.js"]) {
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

// ---- Header: landmarks, current-page state, markup shape ----------------
// The header is copy-pasted across all seven pages, which is exactly how the
// three bugs below survived review: aria-current and the nav's accessible name
// existed on index.html only, and the switcher block was misindented. None of it
// is visible in a screenshot.
const VOID_TAG = /<(?:img|br|hr|input|meta|link|source)\b[^>]*>/gi;
for (const page of PAGES) {
  const html = read(page);
  const is404 = page === "404.html";

  // Two <nav> landmarks per page (primary + mobile drawer), so both need names
  // or a screen reader announces two identical "navigation" regions.
  const navs = [...html.matchAll(/<nav\b[^>]*>/g)].map((m) => m[0]);
  check(`${page}: every <nav> landmark has an accessible name`,
    navs.length === 2 && navs.every((tag) => /aria-(?:label|labelledby)="/.test(tag)),
    `${navs.length} nav landmarks`);
  check(`${page}: primary nav is labelled "Main navigation"`,
    /<nav class="site-nav" id="siteNav" aria-label="Main navigation">/.test(html));

  // aria-current has to follow the page, in the desktop nav AND the drawer copy.
  // On 404 no page is current, so zero is the correct answer there.
  const currents = [...html.matchAll(/aria-current="page"/g)].length;
  check(`${page}: ${is404 ? "no" : "both"} nav copies mark the current page`,
    is404 ? currents === 0 : currents === 2,
    `aria-current=${currents}, nav-link active=${[...html.matchAll(/class="nav-link active"/g)].length}`);
  check(`${page}: aria-current sits on the active link, never elsewhere`,
    [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)]
      .every((tag) => /class="nav-link active"/.test(tag)) &&
    (is404 || [...html.matchAll(/class="nav-link active"/g)].length === 2));

  check(`${page}: hamburger is labelled and controls a drawer that exists`,
    /<button[^>]*id="hamburger"[^>]*aria-label="[^"]+"[^>]*aria-controls="mobileDrawer"/.test(html) &&
    /<nav[^>]*id="mobileDrawer"/.test(html));

  // Structure of the nav block, which is what caught the misindented switcher:
  // a closing tag must line up with the line that opened it, and a line nested
  // one level deeper than the previous one must be indented further.
  // From the start of the opening line, not from the tag itself, or the <nav>
  // opener is read at indent 0 and then "mismatches" its own closer.
  const block = html.slice(
    html.lastIndexOf("\n", html.indexOf('<nav class="site-nav"')) + 1,
    html.indexOf("</nav>") + 6);
  const stack = [];
  const problems = [];
  let depth = 0, prevLineDepth = -1, prevIndent = -1;
  for (const raw of block.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const indent = raw.length - raw.trimStart().length;
    const lineDepth = depth;
    const line = trimmed.replace(VOID_TAG, "");
    const closer = /^<\/[a-z0-9]+>$/i.test(line);
    if (closer) {
      const openedAt = stack.pop();
      if (openedAt !== undefined && openedAt !== indent) {
        problems.push(`${line} indent ${indent} != opener ${openedAt}`);
      }
      depth = Math.max(0, depth - 1);
    } else {
      if (lineDepth > prevLineDepth && indent <= prevIndent) {
        problems.push(`"${line.slice(0, 24)}" indent ${indent} not > parent ${prevIndent}`);
      }
      const opens = (line.match(/<[a-z][a-z0-9]*\b/gi) || []).length - (line.match(/<\//g) || []).length;
      for (let i = 0; i < opens; i++) stack.push(indent);
      depth += Math.max(0, opens);
    }
    prevLineDepth = lineDepth;
    prevIndent = indent;
  }
  check(`${page}: nav block is consistently indented and nested`, problems.length === 0,
    problems.slice(0, 2).join(" / "));
}

// aria-expanded alone is not enough: the accessible name has to flip too, or the
// button announces "Open menu" while it is closing one.
check("js/main.js: hamburger label follows the drawer state",
  /var openDrawer[\s\S]{0,500}aria-label", "Close menu"/.test(mainJs) &&
  /var closeDrawer[\s\S]{0,500}aria-label", "Open menu"/.test(mainJs));

// ---- Theme switcher interaction affordances ----------------------------
// The switcher is the one control that repaints the entire page, so it has to
// survive a keyboard, a thumb and reduced-motion. All of it is invisible in a
// screenshot and trivial to lose in a refactor.
const optRule = /\.theme-option\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
check("theme switcher: pointer cursor", /cursor:\s*pointer/.test(optRule));
check("theme switcher: declares its own focus ring",
  /\.theme-option:focus-visible\s*\{[^}]*outline:/.test(css));
// An ungated :hover latches on touch devices, so the rule must only exist
// inside a hover-capable media block, never at the top level as well.
check("theme switcher: hover gated behind a real pointer",
  /@media \(hover: hover\)[^{]*\{\s*\.theme-option:hover\s*\{/.test(css) &&
  !/\n\.theme-option:hover\s*\{/.test(css));
const mobileOpt = /\.mobile-theme \.theme-option\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
check("theme switcher: drawer copy is a 44px touch target", /min-height:\s*44px/.test(mobileOpt));
check("theme switcher: honours prefers-reduced-motion",
  /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.theme-option\s*\{[^}]*transition:\s*none/.test(css));

// ---- Nav CTA -------------------------------------------------------------
// .nav-cta is not a .btn, so nothing in the button family reaches it. It was
// missing the gap that keeps its arrow off the label, the arrow nudge (that rule
// is scoped to `.btn:hover`), any press feedback and a pointer cursor - the one
// call to action in the bar rendering with less care than the links around it.
const ctaRule = /\.nav-cta\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
check("nav CTA: arrow is separated from the label", /gap:\s*\d/.test(ctaRule), ctaRule.slice(0, 60));
check("nav CTA: pointer cursor", /cursor:\s*pointer/.test(ctaRule));
check("nav CTA: never wraps", /white-space:\s*nowrap/.test(ctaRule));
check("nav CTA: lifts and has a pressed state",
  /\.nav-cta:hover\s*\{[^}]*transform:/.test(css) && /\.nav-cta:active\s*\{[^}]*transform:/.test(css));
check("nav CTA: arrow nudges on hover, same as .btn",
  /\.nav-cta:hover \.btn-arrow\s*\{[^}]*translateX\(\s*3px\s*\)/.test(css));
for (const page of PAGES) {
  check(`${page}: nav CTA has a label and an arrow`,
    /class="nav-cta"[^>]*>[^<]*<span class="btn-arrow" aria-hidden="true">/.test(read(page)));
}

console.log(`\ncontract: ${pass} passed, ${fails.length} failed`);
if (fails.length) {
  console.log("\nFAILURES:");
  for (const f of fails) console.log("  ✗ " + f);
  process.exit(1);
}
