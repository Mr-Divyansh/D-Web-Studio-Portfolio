# D Web Studio — Design System

## 1. Design Vision

The D Web Studio portfolio should feel like a premium digital studio website, not a generic developer portfolio or AI-generated template.

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

The design should make a potential client feel that D Web Studio can build a serious digital product for their business.

---

## 2. Brand Identity

The visual identity should be directly inspired by the D Web Studio logo.

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

Suggested:

```text
#0C0F13
```

### Implemented Palette

The values below are what `css/style.css` actually uses, and are the source of truth going forward. The dark column is `:root`; the light column is `:root[data-theme="light"]`, applied by `js/theme.js` from the Light / Dark / System switcher.

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--ink` | `#0C0F13` | `#F4F7FC` | Primary background |
| `--ink-2` | `#11151B` | `#FFFFFF` | Raised surfaces (cards, drawer, form fields) |
| `--ink-3` | `#171C24` | `#EAF0F8` | Deeper raised surfaces (tech chips, icon panels) |
| `--paper` | `#F4F1EA` | `#14213A` | Primary text |
| `--silver` | `#C3CAD6` | `#2C3C58` | Metallic accents, brand gradient, footer headings |
| `--muted` | `#8B93A2` | `#55637D` | Secondary body text |
| `--muted-2` | `#949FB0` | `#44526E` | Tertiary text / form labels |
| `--blue` | `#2268E6` | `#2563EB` | Primary brand accent |
| `--blue-rgb` | `34, 104, 230` | `37, 99, 235` | `rgba()` glows, gradients, shadows |
| `--blue-light` | `#6FB2FF` | `#1D4ED8` | Links, highlights, active states |
| `--gold` | `#D4AF6A` | `#8A5A0E` | Secondary metallic accent (used sparingly) |
| `--on-media` | `#F4F1EA` | `#F4F7FC` | Text on always-dark scrims (`.tagpill`) |
| `--on-media-accent` | `#6FB2FF` | `#7FB4FF` | Accents on always-dark thumbnails |
| `--scroll-thumb` | `#262D37` | `#C3CCDA` | Scrollbar thumb |
| `--grad-text-fallback` | `#9CC8FF` | `#2563EB` | `.text-grad` colour for engines without `background-clip: text` |

**Text ramp.** In both themes the four text tokens form one ordered ramp — `--paper` strongest, then `--silver`, `--muted-2`, `--muted`. Light-mode values are tuned so every step clears WCAG AA (4.5:1) against the *lightest* surface it can land on (`--ink-3`): `--muted` 5.3:1, `--muted-2` 6.8:1, `--silver` 9.7:1, `--paper` 14.0:1.

**Theme-independent surfaces.** Project thumbnails, the glass hero cards and `.tagpill` are dark in *both* themes, so anything sitting on them must use `--on-media` / `--on-media-accent` rather than a themed colour. Letting `.tagpill` inherit the body colour is what previously made it dark-on-dark in light mode.

**Adding a light override.** Only add colours here that genuinely differ per theme, and always match the specificity of the dark rule being replaced. An ID selector outranks `:root[data-theme="light"]`, so a light override for a `#id`-scoped rule has to repeat that `#id` — e.g. `:root[data-theme="light"] #top .hero-tags b`, not `:root[data-theme="light"] .hero-tags b`.

Brand gradient (`--grad-brand`) runs silver → blue in dark and `#1D4ED8` → `#2563EB` in light. Text gradient (`--grad-text`) runs near-white → light blue in dark, and `#2563EB` → `#3D82F5` in light — the light ramp must start in a *lighter, bluer* tone than `--paper`, otherwise accent words inside headings render in the same colour as the words around them and vanish. No orange/amber tones are used anywhere in the palette.

**Decorative 3D art.** The homepage cube scene, orbit rings and glows are painted for the near-black hero using pale-blue tints (`rgba(111,178,255,.12)` and friends). Those disappear on a light background, so each one needs a light override: a solid blue edge plus a real drop shadow instead of a light fill, or the cube collapses to just its inner core. Same trap as `--on-media`, in reverse.