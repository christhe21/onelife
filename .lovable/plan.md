## 1. Starting page redesign — "Warm & Motivational"

Locked tokens (added to `src/styles.css`):

- Surfaces: cream `#f5f0e8`, soft sage tint `#dce5d4`
- Accent: muted sage `#7d9b76`, with a lighter `#a8c0a0` for hover/gradients
- Ink: deep forest for headings, warm slate for body
- Typography: **Manrope** (display + body) — single family, weights 300/500/700
- Radius bumped to `1rem` (rounded-2xl default); generous spacing scale

Two starting-page experiences:

- **First-run (no onboardedAt)** → keep Onboarding but apply the new welcome treatment (warm gradient, sage gradient CTA, sun/leaf motif, encouraging copy).
- **Returning empty dashboard** → redesign `EmptyStateHero` into a hero block with:
  - Warm sage-to-cream gradient + soft grain texture
  - Big serifless display headline + supportive subline
  - Three intent cards (See a demo · Add your first goal · Import) as roomy stacked cards on mobile, 3-col on ≥sm
  - A "Why you're here" micro-section with 3 affirming bullets (Long-term clarity · Today's focus · Visual mindmap)

No backend or data-model changes.

## 2. Cramped inputs — "All of the above"

Global form polish:

- New input sizing: `h-11` default, `text-base`, `px-4`, `rounded-xl`
- Add a shared wrapper `Field` (label + input + helper) with `space-y-1.5` and rows separated by `gap-4`/`gap-5`
- Inputs in `Onboarding`, `NewGoalWizard`, `Goals`, `Tasks` inline forms updated to use the new sizing and consistent vertical rhythm
- On `sm+`, two-column grid for paired fields (date + select); single column on mobile

Per-step focus for long lists (Typeform-feel) in wizards:

- In `Onboarding` "milestones" and "tasks" steps, when list grows past 1 item, switch to a paged "one row at a time" mode with a small ••• step indicator and Prev/Next chevrons; "Add another" appends and focuses the new row
- Same pattern applied to `NewGoalWizard` milestones/tasks/subtasks steps
- Short lists (≤1 row) keep the inline view so it doesn't feel ceremonial

## 3. Mindmap polish (`MindMapCanvas.tsx`)

- **Shapes**: root and skills = ellipse/circle. Goals, tasks, sub-tasks = rounded rectangle (`<rect rx={14} ry={14}>`). Replace existing parallelogram branch.
- **Palette (cool mist)**: `#eef2ff`, `#e0f2fe`, `#ecfeff`, `#f5f3ff` rotated per skill; root uses `#eef2ff`. Strokes use the skill's own color at reduced opacity. Replace `PALETTE`, `ROOT_FILL`, `PAPER`.
- **Typography**: drop Patrick Hand/Caveat. Use **Manrope** for all labels; weights: root 700, skill 600, others 500. Remove the `stroke`/`paintOrder` outline on text — light fills make solid ink readable.
- **Ink color**: switch from `#2d3f2a` to a neutral slate (`#1f2937`) for crisper contrast on cool tints.
- **Keyword cap (auto-truncate)**: new helper `toKeywords(label, max=3)` that strips stopwords (a/the/of/to/for/and/in/on/with/my/your), keeps first 1–3 significant words, joins with space, and falls back to first 3 words if all are stopwords. Used only inside the mindmap. Source data (titles in lists) untouched.
- **Fit-to-shape**: re-measure with Manrope metrics (`0.55` glyph factor); for rectangles compute width from longest keyword line + padding so text always fits; wrap to max 2 lines, ellipsis on overflow.
- **Tooltip**: add `<title>{fullLabel}</title>` inside each node `<g>` so hovering shows the original title.
- **Badges/arrows**: unchanged behavior; badge background switches to white for the lighter palette.

## Files touched

- `src/styles.css` — Warm & Motivational tokens, Manrope import, radius scale
- `src/components/life/EmptyStateHero.tsx` — hero redesign
- `src/components/life/Onboarding.tsx` — welcome polish, roomier inputs, paged rows for milestones/tasks
- `src/components/life/NewGoalWizard.tsx` — same input polish + paged rows for long lists
- `src/components/ui/input.tsx` (only if needed) — default sizing bump; otherwise apply via classes
- `src/components/life/MindMapCanvas.tsx` — shapes, palette, fonts, keyword truncation, tooltip

## Out of scope

- Data model changes, goal-entry validation/length limits, sharing, music, business logic.
