---
description: Use pbakaus/impeccable for all frontend design work — critique, audit, polish, typography, layout, motion, copy, responsive, and design-system tasks.
---

# Impeccable (pbakaus/impeccable)

This project uses the official [Impeccable](https://github.com/pbakaus/impeccable) skill, installed at
`.agents/skills/impeccable/SKILL.md` (skill version 4.5.0, engine 0.1.11).

## When to use
Any task that designs, redesigns, shapes, critiques, audits, polishes, clarifies, distills,
hardens, optimizes, adapts, animates, colorizes, typesets, lays out, delights, onboards, or
extracts frontend UI — across `*.html`, `css/*`, and `js/*` in this repo. Not for backend-only work.

## How to use (Cline)
1. Run the session context loader once per session (Windows):
   `.agents/skills/impeccable/scripts/impeccable.cmd context [--target <path>]`
   (On sh shells: `.agents/skills/impeccable/scripts/impeccable context`.)
2. Load the request's playbook from `.agents/skills/impeccable/reference/<command>.md`
   (`audit`, `critique`, `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard`,
   `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive`, `clarify`, `adapt`,
   `optimize`, `shape`, `init`, `document`, `extract`, `live`, `generate`).
3. Read `.agents/skills/impeccable/reference/craft-floor.md` immediately before any UI edit.
4. End UI work with a detector run: `npx impeccable detect <target>` (exit 2 = fix findings).

## Project pairing
Combine the skill with this repo's own authorities: `rules.md` (must-follow),
`design.md` (token source of truth), `memory.md` (brand/contact invariants), `prd.md` (scope).
Where they conflict on brand facts, this repo's files win; where they conflict on design
craft, prefer Impeccable's playbooks and reconcile explicitly.
