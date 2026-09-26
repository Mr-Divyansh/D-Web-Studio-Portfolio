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

The values below are what `css/style.css` actually uses (as CSS custom properties on `:root`), and are the source of truth going forward:

| Token | Hex / value | Used for |
|---|---|---|
| `--ink` | `#0C0F13` | Primary background |
| `--ink-2` | `#11151B` | Raised surfaces (cards, drawer, form fields) |
| `--ink-3` | `#171C24` | Deeper raised surfaces |
| `--paper` | `#F4F1EA` | Primary (warm off-white) text |
| `--silver` | `#C3CAD6` | Metallic accents, brand gradient |
| `--muted` | `#8B93A2` | Secondary text |
| `--muted-2` | `#5F6775` | Tertiary / label text |
| `--blue` | `#2F7EF2` | Primary brand accent |
| `--blue-light` | `#6FB2FF` | Links, highlights, active states |
| `--gold` | `#D4AF6A` | Secondary metallic accent (used sparingly) |

Brand gradient (`--grad-brand`) runs silver → blue; text gradient (`--grad-text`) runs near-white → light blue. No orange/amber tones are used anywhere in the palette.