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
| `--nav-scrim` | `rgba(11,14,19,.85)` | `rgba(241,245,251,.86)` | The floating header bar's glass fill. The page colour at partial alpha, because `backdrop-filter` needs something translucent to blur — on the light theme it composites to the page colour, so there the hairline and the shadow are the only things separating the bar from what is behind it |
| `--nav-radius` | `18px` | `18px` | Corner radius of the header bar. A decision, not a default: 18px on a 60px-tall, 1200px-wide bar reads as a rounded rectangle. The 999px the bar, the CTA and the theme switcher used to carry read as a lozenge stretched across the viewport |
| `--nav-shadow` / `--nav-shadow-scrolled` | 2-layer, black | 2-layer, navy | The bar's elevation at rest, and once it has content moving underneath it. Per theme for the same reason `--card-shadow` is |
| `--hero-scrim` | dark, left→right | light, left→right | Hero copy scrim |
| `--glass` / `--glass-border` | dark glass | white glass | The two floating hero UI cards |
| `--hero-heading` | `#F2F6FD` | `#0E1B31` | Hero `h1` only |
| `--wave-cursor-fill` | pale wash | blue wash | Travelling highlight in the contact band |

Brand gradient (`--grad-brand`) runs silver → blue; text gradient (`--grad-text`) runs blue → blue on both themes — `#4D96FF` → `#2E7BE6` in dark and `#1D4ED8` → `#2563EB` in light. Neither ramp starts near its own theme's heading colour, which is what keeps the accent visible rather than blending into the words beside it. No orange/amber tones are used anywhere in the palette.

### Surface hierarchy

Both themes get their structure from the same three-step scale plus one shared rule, not from per-component patches:

- **Dark** — a surface is a *lighter* patch: page `#0B0E13` → card `#141922` → inset `#1D242F` (1.10:1 and 1.13:1 between steps).
- **Light** — a surface has to be lifted *off* the page: page `#F1F5FB` → card `#FFFFFF` → inset `#E9EFF8` (1.09:1 and 1.16:1). The card step is only 1.09:1, which is why `--card-shadow` is mandatory in light mode and near-optional in dark: on white, a border and a shadow are the only pair of values that can separate a card from the page.

Every raised surface on the site — `.service-card`, `.project-card`, `.step-card`, `.why-card`, `.price-card`, `.contact-tile`, `.feature-item`, `.story-aside`, `.faq-list details`, `.beyond-card`, `.journey-body`, `.value-card`, `.focus-panel`, `.feature-support` — takes its `box-shadow` from one shared rule in `css/style.css`. Adding a new card means adding its selector to that list, not writing a new shadow.

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

The header is a floating bar, and it is two boxes rather than one. `.site-nav` is a full-width fixed strip whose padding is the gutter and which paints nothing; `.nav-inner` is the bar, carrying the glass fill, the hairline, the radius and the shadow. That split is what lets the bar be a bounded rounded rectangle instead of a full-bleed strip running off both sides of the screen, and it keeps the bar's edges on the same `--edge` / 1200px column as `.container`. `.site-nav` also sets `pointer-events: none` with `.nav-inner` opting back in — without it the transparent gutter either side of the bar swallows clicks meant for the hero, which is what the old full-bleed bar did across its whole height.

The brand lockup is the one place the name is deliberately *not* spaced: the markup is `Divy Web<span class="studio">Studio</span>`, with no space before the span, so "Web" and "Studio" touch and the navy-to-blue change reads as a split inside one name. Two things make that work, and both are easy to undo by accident. `.nav-brand` must not declare a `gap` — a flex container wraps every run of child text in an anonymous flex item, so "Divy Web" and the span are siblings, and a 10px column-gap lands squarely on the `b`/`S` seam the markup exists to close; the icon-to-text distance is a `margin-right` on the mark instead. And the trailing space in the text node is what the trailing-whitespace rule removes, so the two runs end up flush. Everything else on the site (footer, titles, JSON-LD) keeps the spaced "Divy Web Studio" display name; `contract.mjs` pins both halves so a blanket find/replace cannot quietly break either one.

The header is copy-pasted across all seven pages, which is how three bugs survived review: `aria-current` and the nav's `aria-label` existed on `index.html` only, and its switcher block was misindented. `contract.mjs` now checks all three statically, including a nav-block indentation/nesting pass (a closing tag must line up with the line that opened it, and a line nested one level deeper must be indented further). None of it is visible in a screenshot.

The "Core capabilities" cards on the home page are the one place where a shared class is deliberately restyled for a single page. `.feature-item`, `.feature-num`, `.feature-toggle`, `.feature-panel` and `.feature-support` all appear on `about.html` too ("How I Work" — four numbered steps, no accordion, no icons, no CTA band) and inside the home page's own contact section (a second `.features-row` of eight plain cards). Editing the base rules would have quietly redesigned all three. So the strip carries a `features-strip--modules` modifier and every rule is scoped to it, one level deeper than the rule it overrides. Two consequences follow from that and are easy to trip over: the base media queries are `(0,1,0)` and therefore outranked, so the tablet and phone values for `.features-row` / `.feature-item` / `.feature-support` have to be restated inside the scoped block rather than inherited; and the shared elevation rule sits *later* in the file than the scoped block, so a `box-shadow` written here would be silently replaced by `--card-shadow` — which is the intent, and why `.feature-support` was added to that shared list instead.

Two decisions in there are design rather than restyling:

- **Equal heights, without the hole.** The base row is `align-items: start`, chosen so one open card would not leave its neighbours with a gap under them. That does buy ragged card heights, though, so the scoped row goes to `stretch` and `.feature-panel` gets `margin-top: auto`. The panel is a flex child, so the auto margin absorbs the card's free space: a closed card's panel sits flush against the bottom padding with nothing showing, and an open one opens upward from the card's baseline. All four grow together instead of one card growing past three.
- **The plus control tracks state, not the pointer.** The base rule rotated it 90° on `.feature-toggle:hover`, which meant the glyph was a minus the moment the pointer crossed the card and snapped back on the way out — a rotation that carried no information. It now takes colour on hover and rotates 45° on `aria-expanded="true"`, which is the only moment the rotation means something. That needed a second override: the base open rule turns the vertical bar to 0° to draw a minus, and a 45° rotation would carry that on to a backslash, so the scoped rule puts the bar back at 90° and lets the rotation alone read as the close.

The gold index pill on `.feature-num` became plain tracked-out mono in `--muted` for this section only. A filled, bordered, coloured chip sitting on the same card as the title made "01" compete with "Custom Web Development" for the first read, and gold is not part of this section's palette. `about.html` and the contact-section cards keep their pills, because they are outside the scope. The number's face is unchanged — mono is what makes a two-digit index look like an index.

## The About section

The home page's "About Me" block is the second place a shared class is restyled for a single page, and it is a wider trap than the capabilities strip. `.about-grid` and `.about-text` are genuinely home-page-only, but `.stack-grid` / `.stack-chip` are not: `about.html` renders that exact pair three times over (Frontend, Backend & Data, Tooling) and `experience.html` renders it again inside `.focus-panel`, next to its own copy of `.now-list`, `.dot2` and `.section-cta`. Four of the six classes in this section are shared with two other pages. So the section carries an `about--profile` modifier and every rule is scoped to it, exactly as `features-strip--modules` does.

Three consequences, all of which are silent failures rather than errors:

- The base `@media (max-width: 1080px)` rule for `.about-grid` is `(0,1,0)` and the scoped rules are `(0,2,0)`, so the base "stack to one column" rule is outranked and the two columns never collapse. The stacked value has to be restated inside the scoped block. This is the same trap the capabilities strip documents, and it is worth knowing that a section can look right at every width you happen to open it at while being wrong in the stylesheet.
- The site-wide `*` rule sets `transition-property` to colours only. Any `transform` on `:hover` is therefore instant unless the element declares its own `transition`, so `.stack-chip` and `.about-fact::before` both restate one. Without it the chip lift and the row's blue edge still work, they just snap.
- The hover states all live on *children* of the `.reveal` elements, never on them. `.reveal.in` is `(0,2,0)` and a bare `:hover` is `(0,1,1)`, so a hover transform written on a revealed element would be silently cancelled the moment it scrolled into view. The wrappers (`.about-col`, `.about-facts`, `.about-services`) carry the reveal; the rows, chips and icons inside them carry the interaction. The `.about-cta` deliberately does *not* take `reveal`, matching the existing note on `.section-cta`.

Decisions that are design rather than restyling:

- **The highlights are one panel, not three cards.** A shared border plus hairline dividers gives the "these belong together" signal at a third of the visual weight of three separately-bordered cards, and the rows stay 64px tall on desktop. Below ~420px the third row wraps to two lines and the rows become 64/64/65 — left alone deliberately. A `min-height` can only set a floor; it cannot make a two-line row match a one-line one, so forcing it would add dead space above the short rows. The dividers make the variation read as rhythm.
- **The services became a ruled list, and that is the point.** They were `<strong>Title</strong><br>description` inside `.about-text`, which put the title and the description at the same size with only a weight between them, so none of the three were findable without reading them. They are now `h3` at 15.5px/700 in full `--paper` against `p` at 14px/400 in `--muted` — a size *and* a weight apart. No cards: the brief asked for scannable, and a card per service would have made the right-hand column heavier than the story on the left.
- **The CTA is 12px, not a pill.** `.btn` is `border-radius: 999px` site-wide, and at 50px tall and 207px wide that lozenge reads as a badge rather than a button. The override is scoped, so every other button on the site keeps the pill.
- **The grid is `--line`, not a blue.** The one decorative element is a 34px technical grid in the top-right corner, faded out with a radial mask so it has no hard edge. It is drawn in `--line` so it re-tints itself for the light theme instead of needing a second value, and it is `pointer-events: none` so the row hovers underneath stay reachable.
- **The column split moved from 1.15fr/0.85fr to 1.05fr/0.95fr.** At 0.85 the capability column was 380px and "Tailwind CSS" wrapped to its own line, which made the tech list read as a column of orphans. Both tracks are `minmax(0, 1fr)` rather than `1fr`: the default `auto` minimum is the content's min-content width, and a single `white-space: nowrap` chip is enough to push the grid past the container and start a horizontal scrollbar. The chips now carry `nowrap` and a fixed 38px height, which is what keeps a four-across row reading as four identical objects instead of four slightly different ones.

Verified in Chrome at 1440 / 1280 / 1024 / 900 / 820 / 390 / 360 / 320: two columns above 1080 and one below, no horizontal overflow and no element crossing the section's box at any width, all 17 chips measuring exactly 38px tall and 10px round, all 6 Lucide icons rendering, the measure capped at 54ch on desktop and relaxing to 62ch once stacked. The mobile order is the source order — About → highlights → CTA → tech → services — because the two columns are grid tracks, so stacking them is all that is needed.

Checked for bleed by serving each of the other six pages twice, swapping only `css/style.css` between the working tree and `HEAD` and diffing the *computed* styles of every shared class. All six come out identical. That is deliberately not done with screenshots: an earlier attempt pixel-diffed them, reported all four pages as changed, and was simply wrong — the "before" server was a partial copy with no `css/` subdir, so `about.css` and `services.css` 404'd and the page rendered unstyled. Two more things a probe page has to get right, both of which look exactly like a broken site: it must be served from the **same origin** as the frame (a `file://` wrapper makes the frame cross-origin, `contentDocument` is `null`, and every measurement throws), and the measurement code must take the framed document as a parameter rather than reaching for a bare `document`, or it measures the probe instead of the site.

Two things that look like page bugs in that harness but are not, and should not be "fixed" in the site:

- **Transitions must be disabled before reading computed colours.** The tokens swap in one tick, but a `background-color` transition is still tweening when `getComputedStyle` runs, so the assertion samples a mid-fade value. This is also why the old washed-out light screenshot was a sampling artefact, not a broken theme.
- **`scrollIntoView` needs `behavior: "instant"`.** The site sets `scroll-behavior: smooth`, and headless never advances a smooth-scroll animation, so the viewport stays parked part way and the target element never intersects.

It skips cleanly (exit 0) when no Chrome or Edge is found; set `CHROME_PATH` to point at a specific binary.

## The two card rows in the contact section

The last of the three places `.features-row` / `.feature-item` / `.feature-num` are restyled per page, and the third instance of the same trap:

- `about.html` — four numbered steps, no icons, no links
- `index.html` `#features` — the accordion, scoped `.features-strip--modules`
- `index.html` `#contact` — the two rows upgraded here

So the row carries a `features-row--services` modifier and every rule is scoped to it. Three of the base declarations had to be restated rather than inherited, and each for a different reason:

- **`.feature-item > .feature-num { align-self: flex-start }`** is written for the about.html markup, where the number is a direct child of the column-flex card. Here it is a child of `.feature-top`, so it is cancelled explicitly rather than left to be outranked by luck.
- **`.feature-num + h3 { margin-top: 14px }`** is the gap that adjacency used to need. It is gone from this markup, so the gap is `.feature-top`'s `margin-bottom` instead and the old margin is set back to 0.
- **The base media queries are `(0,1,0)` and this block is `(0,2,0)`**, so the tablet and phone values for `.features-row` and `.feature-item` are outranked and never apply. They have to be restated at matching width, exactly as `.features-strip--modules` does.

The gold pill is dropped here for the same reason it is dropped in the accordion: a filled, bordered, coloured chip sitting a few pixels from the title competes with it for the first read, and gold is not this section's palette. The number keeps its mono face and moves to the top-right corner, where it annotates the card instead of introducing it. `about.html` keeps its pills, because it is outside the scope.

**Both rows were upgraded, not just the one that was pasted.** They sit about 35px apart in the same section and are the same component in the same markup shape. Upgrading one and leaving the other as a gold-pill wall would have read as a mistake rather than as a deliberate distinction, and there is no semantic difference between them to justify one — the first row is what can be built, the second is the process, and both are sets of four parallel items.

**The first row became real links.** Its four cards describe what the studio builds and each one pointed nowhere, so the card was four lines of text carrying a hover lift that implied interactivity it did not have. They now link to `services.html` — the same target the footer already uses for these exact four categories — and the arrow is an honest "there is a page behind this" rather than decoration. That is the one behavioural change here: the whole card is the hit target, so it needed a `:focus-visible` ring, and the arrow is pinned to the card's foot with `margin-top: auto` so all four sit on one baseline. The second row is a process, not a destination, so it has no arrow and no link — the same reasoning that keeps a card from looking clickable when it is not.

The icon chip, the number treatment and the 17px/800 title are copied from `.features-strip--modules` rather than invented. The two card families now sit on one page about 1200px apart, and making them the same object is most of the work.

Verified in Chrome at 1440 / 1280 / 1080 / 1024 / 900 / 820 / 640 / 390 / 360 / 320: four columns above 1080 and one below 640, all eight icons rendering, all four arrows on a shared baseline, no horizontal overflow and no card crossing its row's box at any width. At 900px the first row's two grid rows measure 252px and 229px — that is correct, not ragged: a grid row is as tall as its own tallest card, and every card there is a link whose arrow reserves the same space in all four.

The other six pages were re-checked the same way as the About section: served twice over one origin, swapping only `css/style.css` between the working tree and `HEAD`, then diffing the computed styles of every shared class. All six come out identical at 1440 and 390, and `about.html`'s pills still measure `rgba(227, 190, 120, 0.12)` on gold with a 999px radius and no icons on the page at all.

## The footer

The footer is the one piece of the site that is **identical on all seven pages**, which is the single most important fact about it. Anything typed into `index.html`'s `<footer>` and not rolled out is a bug, not a variant. It was rolled out with a script rather than seven hand edits for exactly that reason, and `memory.md` now says so.

**There is exactly one deliberate exception, and it is YouTube.** The studio channel `@divyanshwebstudio` is the brand's channel and is what the six client-facing pages link to. `about.html` links instead to the personal Minecraft channel `@DG2_BOSS/shorts`, because About is the personal page and its "Beyond The Code" section is specifically about making Minecraft cinematic videos — the studio channel would be the wrong destination there. Both URLs are live and verified. Anything else that diverges between two footers is a bug.

**Every control in the footer does something.** This was the governing constraint, and it drove several decisions that would otherwise look arbitrary:

- **The CTA panel points at `contact.html`, not `#contact`.** A `#contact` fragment is the more natural-looking choice on the homepage, and that section does exist there. But the footer ships on all seven pages and only four of them have a `#contact` id — `contact.html` has `#get-in-touch` and `#contact-band-cta`, and `404.html` has no sections at all. A `href="#contact"` would have been a working link on four pages and a dead one on three. `contact.html` is real everywhere, and it is where the form, the WhatsApp tile and the email tile all already live, so the button lands on the actual contact surface rather than a section that is mostly marketing copy.
- **The availability chip is a `<span>`, not a link.** "Available for new projects" is a statement of fact. Giving it an `href` would have made it the exact thing this footer is not: a control that looks interactive and does nothing. It has a live dot and a green tint, and `cursor: auto`, and that is the whole of its behaviour.
- **The four `Services` links all point at `services.html#services`.** The site has no per-service anchors — `services.html` carries one `#services` section holding all four cards — so either they share that one real target or they point at fragments that do not exist. Sharing a real destination beats four plausible-looking dead ones. Adding per-service ids to the service cards is the obvious next improvement, and it is deliberately *not* done here because it is an edit to another section.
- **The five social buttons are the only icon row, and there are exactly five.** GitHub, Instagram, WhatsApp, Gmail, YouTube. No LinkedIn, Facebook, X, Telegram or Discord, and the audit fails the build if any of those strings appears.

**Lucide has no WhatsApp icon.** Verified against the shipped 0.544.0 bundle: `github`, `instagram`, `youtube` and `mail` exist as icon keys, `whatsapp` does not. Writing `data-lucide="whatsapp"` renders an empty `<i>` and a blank button that still looks clickable — the worst possible outcome for this brief. WhatsApp uses `message-circle`, which is what `contact.html` has always used for it.

**The icons are 42px rounded squares (11px radius), not circles.** Five 40px-plus circles in a row read as a strip of lozenges, and the brief asked not to lean on pill shapes. The radius is enough to read as a button and square enough to read as an icon target.

### The bug this surfaced

Adding five icons to every page exposed a latent one. **Four of the seven pages never loaded Lucide at all** — `about`, `experience`, `work` and `404` had zero `data-lucide` attributes before this change, so nothing rendered and nothing looked broken. The moment the footer put five icons on them, four pages showed five empty boxes.

The contract test then failed, and the failure was the interesting part. It asserted that the set of pages loading Lucide equals a **hardcoded list of three** — a list that had gone stale the instant a fourth page grew an icon, and which the footer change proved had been quietly wrong-shaped all along. Rather than append four names to that list, the expectation is now derived from the markup: what is under test is the invariant ("Lucide is loaded exactly on the pages that use it"), not a list a future change has to remember to edit. The four pages now load the same pinned `0.544.0` tag as the other three.

### Verified

Every href in all seven footers was resolved: no `#`, no empty `href`, no `javascript:`, no `mailto:` without a real address, and every internal link checked against both the file existing on disk *and* the fragment existing as an id in the target page. 22 hrefs per footer, 154 in total, all resolving. All five external destinations were fetched and confirmed live — the GitHub profile, the Instagram profile, the YouTube channel, and the WhatsApp link resolving to a chat with +91 80912 73525.

Then in Chrome across 7 pages x 2 themes x 4 widths (1440 / 900 / 640 / 320): all five icons render as real SVGs, every one at or above a 40px tap target, the availability chip measuring `SPAN` with `cursor: auto` and no href on every single page, and no horizontal overflow anywhere. The CTA is two columns on desktop, single column below 900px, and full-width below 520px via the existing `.btn { width: 100% }`; the social row is 5x42 + 4x10 = 250px and stays on one line down to 320px.
