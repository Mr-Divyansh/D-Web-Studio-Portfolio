# Divy Web Studio — Design System

## 1. Design Vision

The Divy Web Studio portfolio should feel like a premium digital studio website, not a generic developer portfolio or AI-generated template.

The overall experience should communicate:

- Premium
- Modern
- Professional
- Confident
- Clean
- Smooth
- Human-made
- Trustworthy
- Conversion-focused

The design should make a potential client feel that Divy Web Studio can build a serious digital product for their business.

---

## 2. Brand Identity

The visual identity should be directly inspired by the Divy Web Studio logo.

### Brand Characteristics

The logo communicates:

- Dark premium background
- Metallic / silver visual elements
- Strong blue accent
- Modern technology feeling
- Professional studio identity

The website should carry the same visual language.

---

## 3. Color System

### Primary Background

Use a deep charcoal / near-black background.

```text
#0B0E13
```

### Implemented Palette

The values below are what `css/style.css` actually uses as CSS custom properties, and are the source of truth going forward. Every token is declared twice — once on `:root` (dark, the default) and once on `:root[data-theme="light"]` — so a component only ever references the token name, never a literal. A literal is what made the light theme drift: a `rgba(255,255,255,.05)` fill can only lighten, so on a white page it composited to nothing.

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--ink` | `#0B0E13` | `#F1F5FB` | Page background |
| `--ink-2` | `#141922` | `#FFFFFF` | Raised surfaces (cards, bands, drawer, fields) |
| `--ink-3` | `#1D242F` | `#E9EFF8` | Inset surfaces (chips, icon tiles) |
| `--paper` | `#F4F1EA` | `#0E1B31` | Primary text (warm off-white ↔ deep navy) |
| `--silver` | `#C3CAD6` | `#51617B` | Metallic accents, brand gradient |
| `--muted` | `#AEB9CA` | `#475873` | Secondary text |
| `--muted-2` | `#8894A8` | `#5A6A85` | Tertiary / label text |
| `--blue` | `#2268E6` | `#2563EB` | Primary brand accent |
| `--blue-rgb` | `34, 104, 230` | `37, 99, 235` | Blue at low alpha — washes, glows, tints |
| `--blue-light` | `#6FB2FF` | `#1D4ED8` | Links, highlights, active states |
| `--blue-deep` | `#1A57CF` | `#1A57CF` | Solid primary-button fill |
| `--gold` | `#E3BE78` | `#8A5A0B` | Secondary metallic accent (used sparingly) |
| `--gold-rgb` | `227, 190, 120` | `138, 90, 11` | Gold at low alpha — index pills, wip chip |
| `--live` | `#4ADE9A` | `#0A7A4B` | "Live" status, availability dot, form success |
| `--live-rgb` | `74, 222, 154` | `10, 122, 75` | The same, at low alpha |
| `--danger` | `#FF8A8A` | `#B42318` | Field errors, form failure |
| `--danger-rgb` | `255, 138, 138` | `180, 35, 24` | The same, at low alpha |
| `--wash-1` / `--wash-2` / `--wash-3` | light-on-dark | dark-on-light | Fills for secondary buttons, switchers, pills. The three steps form the fill ladder for segmented controls: transparent → `--wash-2` (hover) → `--wash-3` (selected), so a selected segment can never be mistaken for a hovered one |
| `--on-surface` | `paper @ 62%` | `paper @ 66%` | Text sitting on a raised surface |
| `--card-shadow` | 2-layer, black | 2-layer, navy | Elevation for every card (see below) |
| `--card-shadow-hover` | deeper | deeper | Hover / open state lift |
| `--nav-scrim` | `rgba(11,14,19,.85)` | `rgba(241,245,251,.86)` | Scrolled nav background |
| `--hero-scrim` | dark, left→right | light, left→right | Hero copy scrim |
| `--glass` / `--glass-border` | dark glass | white glass | The two floating hero UI cards |
| `--hero-heading` | `#F2F6FD` | `#0E1B31` | Hero `h1` only |
| `--wave-cursor-fill` | pale wash | blue wash | Travelling highlight in the contact band |

Brand gradient (`--grad-brand`) runs silver → blue; text gradient (`--grad-text`) runs near-white → light blue in dark and deep-blue → blue in light. No orange/amber tones are used anywhere in the palette.

### Surface hierarchy

Both themes get their structure from the same three-step scale plus one shared rule, not from per-component patches:

- **Dark** — a surface is a *lighter* patch: page `#0B0E13` → card `#141922` → inset `#1D242F` (1.10:1 and 1.13:1 between steps).
- **Light** — a surface has to be lifted *off* the page: page `#F1F5FB` → card `#FFFFFF` → inset `#E9EFF8` (1.09:1 and 1.16:1). The card step is only 1.09:1, which is why `--card-shadow` is mandatory in light mode and near-optional in dark: on white, a border and a shadow are the only pair of values that can separate a card from the page.

Every raised surface on the site — `.service-card`, `.project-card`, `.step-card`, `.why-card`, `.price-card`, `.contact-tile`, `.feature-item`, `.story-aside`, `.faq-list details`, `.beyond-card`, `.journey-body`, `.value-card`, `.focus-panel` — takes its `box-shadow` from one shared rule in `css/style.css`. Adding a new card means adding its selector to that list, not writing a new shadow.

### Contrast floor

Verified by `tests/contract.mjs`, which recomputes WCAG ratios from the token values in the stylesheet rather than trusting a comment:

- body, secondary and tertiary text: **≥ 4.5:1** against the page, the card and the inset chip
- surface-to-surface: **≥ 1.08:1**
- both borders: **≥ 1.3:1** against their own surface

Do not reintroduce the old values: `--muted-2` was *brighter* than `--muted` in dark mode and *darker* in light, which inverted the hierarchy in both; and `--gold-rgb` was never redeclared for light, so the gold pills kept dark-theme alphas on a white page.

### Test suites

```
node tests/contract.mjs      # static: tokens, contrast, surfaces, branding, JS/CSS coupling
node tests/interaction.mjs   # runtime: drives the real pages in Chrome
```

`contract.mjs` reads the files as text and needs nothing installed. `interaction.mjs` serves the project over a throwaway HTTP origin and drives Chrome headless, because a purely static suite cannot catch the things that only exist at runtime:

- the theme switcher setting `data-theme` *and* `data-theme-preference`, writing `dweb-theme` to localStorage, and restoring that choice on the next page load (run twice with a pre-seeded localStorage to prove persistence);
- the `theme-color` / `color-scheme` meta tags tracking the active theme;
- the resolved `--ink` / `--paper` / `--blue-rgb` custom properties flipping to the light values (`#F1F5FB` / `#0E1B31` / `37, 99, 235`);
- the mobile drawer below 640px: open/close, `aria-expanded`, `aria-hidden`, the `body.menu-open` scroll lock, the hamburger's accessible name following the drawer state, and the drawer's own copy of the theme switcher;
- the contact form refusing an empty submit, flagging `aria-invalid`, showing field messages, rejecting a malformed email and clearing the error once the value is valid;
- both `<nav>` landmarks resolving to an accessible name, and the link marked `aria-current="page"` actually being the page you are on (0 on 404, where no page is current);
- the reveal-on-scroll observer, the FAQ accordions, and a clean console on every page.

The nav CTA (`.nav-cta`) and the theme switcher (`.theme-option`) are the two controls in the header that are not `.btn`, so none of the button family's affordances reach them. Both were audited against it: the CTA's arrow was rendering flush against its label with no hover nudge, no pressed state and no pointer cursor; the switcher's focus ring landed on its container border, its `:hover` was ungated so it latched on touch devices, and its drawer copy had a 40px touch target. `contract.mjs` now pins the corrected behaviour of both.

The header is copy-pasted across all seven pages, which is how three bugs survived review: `aria-current` and the nav's `aria-label` existed on `index.html` only, and its switcher block was misindented. `contract.mjs` now checks all three statically, including a nav-block indentation/nesting pass (a closing tag must line up with the line that opened it, and a line nested one level deeper must be indented further). None of it is visible in a screenshot.

Two things that look like page bugs in that harness but are not, and should not be "fixed" in the site:

- **Transitions must be disabled before reading computed colours.** The tokens swap in one tick, but a `background-color` transition is still tweening when `getComputedStyle` runs, so the assertion samples a mid-fade value. This is also why the old washed-out light screenshot was a sampling artefact, not a broken theme.
- **`scrollIntoView` needs `behavior: "instant"`.** The site sets `scroll-behavior: smooth`, and headless never advances a smooth-scroll animation, so the viewport stays parked part way and the target element never intersects.

It skips cleanly (exit 0) when no Chrome or Edge is found; set `CHROME_PATH` to point at a specific binary.