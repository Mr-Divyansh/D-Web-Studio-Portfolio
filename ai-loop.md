# D Web Studio — AI Build & Review Loop

An autonomous loop for building, reviewing, testing and correcting work on this
repository. Every change goes through the loop below until it passes every check.

---

## 1. Inputs

Read in this order before writing anything:

1. `prd.md` — what the website must do
2. `architecture.md` — how the project is structured
3. `design.md` — colours, typography, visual direction
4. `phases.md` — the order features are built in
5. `rules.md` — design, UX, development and content rules
6. `memory.md` — brand, contact details and current status
7. `readme.md` — public description of the studio
8. `data/services.json` — the services registry

### Missing or substituted inputs

| Expected input | Status | Handling |
| --- | --- | --- |
| `team.md` | not present | roles are defined by `rules.md` and `phases.md` |
| `execute_0.txt` | not present | no external script to execute; pages load `js/main.js` directly |
| `service.exe` | not present | a static site cannot run a binary. `data/services.json` is the registry equivalent: one entry per service, with its page and image |

### Adding a new service

1. Add an entry to `data/services.json` (`id`, `name`, `page`, `image`, `summary`).
2. Create the service page as a copy of an existing one, keeping the shared nav, drawer and footer exactly.
3. Link it from the services grid in `index.html` and from the Services column in the footer of every page.

---

## 2. The loop

1. **ATTEMPT** — write the smallest change that satisfies the requirement.
2. **VERIFY** — run the self-test checklist against the real files.
3. **FAIL** — name the exact defect: file, line, and what is wrong.
4. **REFLECT** — state why it happened (missing asset, wrong selector, duplicated CSS, invented content).
5. **RETRY** — fix only that defect.
6. **REVIEW** — re-read the fixed file; confirm nothing else broke.
7. **TEST** — re-run the full checklist, not just the failed check.
8. **REPEAT** — loop until every check passes.
9. **FINAL** — report files changed, checks run, fixes made and any open flags.

Never mark work FINAL while a check fails. Never ask a human unless genuinely blocked.

---

## 3. Self-review checklist

- Does it match the PRD sections: hero, services, pricing, why-a-website, work, about, contact?
- Is the copy written for a business owner, not a developer?
- Does it use the `design.md` palette (charcoal, silver, blue accent, cream type)?
- Are there unnecessary gradients, glass effects or decoration?
- Is any file, class, rule or script unused?
- Does it look like D Web Studio, not a generic template?
- Is anything duplicated that should exist once?

---

## 4. Self-test checklist

Run from the project root.

```bash
# 1. no comments in source
grep -n '<!--\|/\*' *.html css/style.css js/main.js
grep -n '^[[:space:]]*//' js/main.js

# 2. tags balanced
for f in *.html; do echo "$f $(grep -o '<div' $f | wc -l)/$(grep -o '</div>' $f | wc -l)"; done

# 3. every anchor resolves to an id
grep -o 'href="#[a-zA-Z-]*"' index.html | sed 's/href="#//;s/"//' | sort -u > /tmp/a.txt
grep -o 'id="[a-zA-Z-]*"' index.html | sed 's/id="//;s/"//' | sort -u > /tmp/i.txt
comm -23 /tmp/a.txt /tmp/i.txt

# 4. every linked page exists
grep -oh 'href="[a-zA-Z0-9_.-]*\.html' *.html | sed 's/href="//' | sort -u |
  while read f; do [ -f "$f" ] || echo "MISSING PAGE $f"; done

# 5. every image exists
grep -oh 'src="[^"]*"' *.html | sed 's/src="//;s/"//' | sort -u |
  while read f; do [ -f "$f" ] || echo "MISSING IMG $f"; done

# 6. classes used in HTML are defined in CSS
grep -oh 'class="[^"]*"' *.html | sed 's/class="//;s/"//' | tr ' ' '\n' | sort -u |
  while read c; do [ -z "$c" ] && continue; [ "$c" = "in" ] && continue
    grep -q "\.$c[ ,{:.]" css/style.css || echo "UNDEFINED: $c"; done

# 7. CSS classes unused in HTML (state classes added by JS are expected)
grep -oh '\.[a-zA-Z][a-zA-Z-]*' css/style.css | sort -u |
  while read s; do c=${s#.}; grep -qw "$c" *.html || echo "UNUSED: $c"; done

# 8. the ids main.js needs exist on every page
for id in siteNav hamburger mobileDrawer mobileBackdrop drawerClose; do
  echo "$id -> $(grep -l "id=\"$id\"" *.html | wc -l)/$(ls *.html | wc -l) pages"; done

# 9. registry entries resolve
grep -o '"page": "[^"]*"' data/services.json | sed 's/"page": "//;s/"//' |
  while read f; do [ -f "$f" ] || echo "MISSING $f"; done
```

Then check manually:

- **Responsive** — 1440, 1080, 900, 640, 375 px. No horizontal scroll, drawer opens and closes, grids collapse, no text overflow.
- **Accessibility** — `alt` on content images, empty `alt` on decorative icons, labels on icon-only buttons, `:focus-visible` visible, one `h1` per page.
- **Performance** — no repeated DOM queries in loops, no unused fonts or scripts, images reasonable in size.
- **No debug code** — no `console.log`, no commented-out markup.

---

## 5. Self-correction rules

1. Never ignore a failed check.
2. Fix the defect, not the symptom — if a selector is broken, fix the selector, do not add a duplicate rule.
3. After every fix, re-run the whole checklist.
4. If a fix breaks something else, that is a new defect; fix it too.
5. Never invent content that was not provided: no invented prices, URLs, phone numbers or testimonials.
6. Never delete a file or rule until every check confirms it is unused.
7. Keep the existing design unless a change fixes a real bug.
8. If a claim cannot be tested, do not report it as verified.

---

## 6. Final report format

1. Files changed, with one line each.
2. Checks run, with results.
3. Defects found, and how each was fixed.
4. Unused code and files removed.
5. Open flags that need a human decision.

---

## 7. Known open flags

- Favicon and nav mark use `img/logo.jpg` (204 KB); `img/logo.png` (1.6 MB) is
  kept in version control as a source asset only and is excluded from deploys
  via `.assetsignore`. If a true `.ico`/small-PNG favicon is produced, point
  every `<link rel="icon">` at it and replace this flag.
- WhatsApp contact uses `+91 80912 73525` (also in `memory.md` and every
  `wa.me/918091273525` link); confirm with the owner that it is still current.

Resolved since this list was first written: canonical / Open Graph URLs now
use the real `https://dwebstudio.com/` domain from `memory.md`, and the
services page quotes real starting prices (₹4,999 landing / ₹9,999 business).
