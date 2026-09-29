# D Web Studio — Project Memory

## Brand

**Name:** D Web Studio

**Founder:** Divyansh Kumar

**Role:** Full-Stack Web & App Developer, Founder

**Location:** Baijnath, Himachal Pradesh, India

---

## Contact Details

**Website:** https://dwebstudio.com

**Email:** dwebstudio00@gmail.com

**Instagram:** @d__web_studio — https://www.instagram.com/d__web_studio/

**GitHub:** Mr-Divyansh — https://github.com/Mr-Divyansh

**WhatsApp:** +91 80912 73525 — https://wa.me/918091273525

**YouTube (studio):** @divyanshwebstudio — https://www.youtube.com/@divyanshwebstudio

**YouTube (Minecraft/personal):** @DG2_BOSS — https://www.youtube.com/@DG2_BOSS/shorts

These values are mirrored in the markup of every page (`nav`, footer `Connect` column, `mailto:` links and the `Organization` JSON-LD block in `index.html`). Keep them in sync when any of them changes.

Notes on the footer specifically:

- The footer CTA panel, the availability chip and the five social buttons are the same on every page. **The one deliberate exception is YouTube:** the six brand pages point at the studio channel `@divyanshwebstudio`, and `about.html` points at the personal Minecraft channel `@DG2_BOSS/shorts`. About is the personal page, and its "Beyond The Code" section is about Minecraft cinematics, so the personal channel is the honest link there. Everything else in the footer must stay identical across all seven pages.
- **The five social platforms are GitHub, Instagram, WhatsApp, Gmail and YouTube. Nothing else.** LinkedIn, Facebook, X/Twitter, Telegram and Discord are deliberately absent and must not be reintroduced.
- Lucide 0.544.0 ships **no `whatsapp` icon** (it does ship `github`, `instagram`, `youtube`, `mail`). WhatsApp therefore uses `message-circle`, which is the mapping `contact.html` already used. Don't swap in `data-lucide="whatsapp"` — it renders nothing.


---

## Business

D Web Studio creates:

- Websites
- Landing Pages
- Business Websites
- Web Applications
- Digital Products

---

## Target Clients

Primary client categories include:

- Gyms
- Restaurants
- Salons
- Small businesses
- Local businesses
- Coaches
- Creators
- Startups
- Service providers

---

## Main Website Purpose

The D Web Studio portfolio is designed to:

1. Showcase work
2. Explain services
3. Explain why a business needs a website
4. Present pricing
5. Build trust
6. Make contact easy
7. Convert visitors into potential clients

---

## Brand Style

Preferred visual style:

- Premium
- Smooth
- Clean
- Human-made
- Modern
- Professional

Primary brand visual direction:

- Dark charcoal/navy backgrounds
- Blue accents
- Warm white/cream typography
- Subtle premium highlights

---

## Developer Direction

Divyansh works across web development and application development.

The technology stack is not permanently fixed.

Choose technology according to the project requirement.

Possible technologies:

- HTML
- CSS
- JavaScript
- Tailwind CSS
- React
- Next.js
- Backend technologies
- APIs
- Databases

---

## Current Status

The project is an actively developing portfolio/studio website.

The design, content, technology, services, pricing, and project showcase may evolve over time.

**Rebrand history:** the display name has changed twice. It began as "D Web Studio", was briefly rebranded to "Divy Web Studio", and is now back to "D Web Studio" — the current, correct name. Every occurrence in titles, meta tags, JSON-LD, the nav brand, the footer brand, the copyright line and the self-referencing project card now reads "D Web Studio" (the nav/footer mark is rendered as `D Web <span class="studio">Studio</span>`, where `.studio` colours the word blue). `tests/contract.mjs` pins both halves of that lockup and asserts the string "Divy Web Studio" no longer appears on any page. The old `divywebstudio@gmail.com` address and the old `instagram.com/divywebstudio` handle were replaced earlier. Do not reintroduce either of those.

**Unchanged by the rename, deliberately:** the domain (`dwebstudio.com`), the email (`dwebstudio00@gmail.com`), the Instagram handle (`@d__web_studio`) and the GitHub handle (`Mr-Divyansh`) are real-world identifiers, not display strings. The name changed; those did not. The `dweb-theme` localStorage key in `js/theme.js` is likewise kept so returning visitors do not silently lose their saved theme choice.

**Two test suites, both dependency-free, run them after any theme or layout change:**
- `node tests/contract.mjs` (225 checks) — static. Parses the CSS/HTML/JS as text: token pairs, recomputed WCAG ratios, surface separation, border visibility, the shared elevation list, branding, preserved identifiers, and that `js/theme.js`'s `theme-color` literals still match `--ink` in `css/style.css`.
- `node tests/interaction.mjs` (343 checks) — runtime. Serves the project on a throwaway HTTP origin and drives Chrome headless over all seven pages: theme switching and localStorage persistence, the `theme-color`/`color-scheme` meta tags, the resolved light-theme custom properties, the mobile drawer, contact-form validation, the reveal observer and the FAQ accordions. Skips with exit 0 if no browser is found; `CHROME_PATH` overrides discovery.

Why the runtime suite exists: the light theme produced screenshots that looked washed out while every token was in fact correct. The cause was sampling, not CSS — a `background-color` transition read mid-tween by `getComputedStyle`, and `scroll-behavior: smooth` never advancing in headless. A static suite structurally cannot catch either, so anything verified by reading a computed colour or scrolling needs `interaction.mjs` behind it.

Header controls audited against the `.btn` family, which does not reach them because neither carries that class: `.nav-cta` (arrow rendering flush against its label, no hover nudge, no pressed state, no pointer cursor) and `.theme-option` (focus ring landing on its container border, `:hover` latching on touch devices, 40px drawer touch target). Both are now pinned by `contract.mjs`.

One inconsistency left in place deliberately: `contact.html`'s nav CTA is "WhatsApp Me →" pointing at `wa.me` with `target="_blank"`, i.e. an external new-tab link wearing the internal "onward to another page" arrow. `css/style.css` argues explicitly against exactly that (see the `.btn-github` comment: the GitHub button uses a mark instead of the arrow precisely because the arrow reads as a nudge further in, not a jump out to a new tab). It is a content/design call rather than a defect, so it was left alone — `contract.mjs` only pins that every nav CTA has a label and an arrow. Drop the arrow on the two external CTAs (the nav one and the drawer's "WhatsApp Us") if you want it consistent.

---

## Homepage Hero Visual

The homepage hero right side uses a pure CSS 3D scene (`.cube-scene` inside `.hero-visual-slot` in `index.html`): rotating glass cube, glowing inner core, two orbit rings, blue/violet ambient and floor glow, and two floating glass UI cards. It is fully decorative (`aria-hidden="true"`, `pointer-events: none`) and respects `prefers-reduced-motion`.

To swap in a real Spline scene later:

1. The Spline viewer script is already loaded in the `<head>` of `index.html`.
2. In `index.html`, replace the whole `<div class="cube-scene">...</div>` inside `.hero-visual-slot` with:
   `<spline-viewer url="PASTE-YOUR-SCENE-URL" events-target="global"></spline-viewer>`
3. Add sizing for it in `css/style.css`, e.g. `.hero-visual-slot spline-viewer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }`

Icons in the hero use Lucide via CDN (`lucide.createIcons()` is initialised in `js/main.js`).

---

## Experience Page

`experience.html` is the personal journey page, linked from the navbar, the mobile drawer and the footer `Explore` column of every page, and listed in `sitemap.xml`.

Structure:

1. `page-hero` — headline plus `.exp-hero-tags` chips.
2. `#journey` — the story as a 7-stage timeline (`ol.journey` > `li.journey-step` > `article.journey-body`), each stage with a `.journey-stage` label, copy and `.tech-tag` chips.
3. `#today` (`.band`) — "Where I am now" text next to a `.focus-panel` with `.now-list` and `.stack-chip` items.
4. `#value` — four `.value-card`s translating the journey into client value, plus a `.journey-note` closing paragraph with CTAs.
5. `#contact` — the shared `.contact-band` CTA block.

Page-specific styles live in `css/experience.css` (loaded after `css/style.css`); shared tokens and the nav/footer come from `css/style.css`. The page uses the same `siteNav` / hamburger / `mobileDrawer` IDs and `.reveal` class as every other page, so `js/main.js` drives it without changes.

When editing the narrative, keep the client-facing tone from `rules.md` (business value first) — the `#value` section exists for that purpose.

---

## Deployment (Cloudflare Workers)

The site is hosted as a **static-assets-only Cloudflare Worker** (no server-side code). Workers Builds is connected to this GitHub repository (branch `main`, deploy command `npx wrangler deploy`). The configuration lives in `wrangler.jsonc`:

- `assets.directory` = `"./"` — the repository root is the website.
- `assets.html_handling` = `"none"` — `/about.html` is served with a `200` instead of being redirected, matching the internal links, the `rel="canonical"` tags and `sitemap.xml`.
- `assets.not_found_handling` = `"404-page"` — unknown paths serve `404.html` with a real `404` status.
- `observability.logs` — Workers Logs stay enabled.

Because `html_handling` is `"none"`, the root path is rewritten by hand: `_redirects` starts with `/ /index.html 200` (Cloudflare only maps `/` to `index.html` automatically when trailing-slash handling is left on). `_redirects` then `301`s the friendly extensionless URLs (`/about`, `/services`, `/work`, `/experience`, `/contact`) to their `.html` pages.

`.assetsignore` keeps internal files off the public site — each pattern was verified to return `404`. It excludes `*.md` (all project docs), `wrangler.jsonc`, `.assetsignore`, `.gitignore`, `.git`, `.agents`, `.freebuff`, `.vscode`, `.github`, `node_modules`, `.wrangler`, `.dev.vars`, `.env`, `.env.*`, `*.log`, `.DS_Store` and `Thumbs.db`. **Anything not listed is published**, so add a pattern here before committing private files.

Local preview: `npx wrangler dev --persist-to "$env:TEMP/dws-wrangler-state"`. The `--persist-to` flag matters — with the default `.wrangler/state` inside the repository the asset watcher sees its own state writes and reloads the server in a loop.

Do not switch `html_handling` back to the default `auto-trailing-slash` unless every internal link, canonical tag and `sitemap.xml` entry is rewritten to extensionless URLs first: with the default, every request for a `.html` file becomes a `307` redirect to the slash-free URL.

---

## Long-Term Vision

D Web Studio should grow beyond a portfolio into a broader digital studio presence that can showcase:

- Client work
- Web applications
- Digital products
- Services
- Case studies
- Business solutions