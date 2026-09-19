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

**WhatsApp:** +91 80912 73525

These values are mirrored in the markup of every page (`nav`, footer `Connect` column, `mailto:` links and the `Organization` JSON-LD block in `index.html`). Keep them in sync when any of them changes.

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

**Rebrand:** the site files previously used the name "DivyWebStudio" in titles, meta tags, JSON-LD, the nav brand, the footer brand and the copyright line. Every occurrence now reads "D Web Studio" (the nav/footer mark is rendered as `D Web <span class="studio">Studio</span>`, where `.studio` colours the word blue). The old `divywebstudio@gmail.com` address and the old `instagram.com/divywebstudio` handle have also been replaced. Do not reintroduce the old name.

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

## Long-Term Vision

D Web Studio should grow beyond a portfolio into a broader digital studio presence that can showcase:

- Client work
- Web applications
- Digital products
- Services
- Case studies
- Business solutions