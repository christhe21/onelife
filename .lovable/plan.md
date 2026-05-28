# Onboarding, Templates & Auto-Progress

## 1. Empty-state onboarding (Dashboard)

Replace the current "Your dashboard is waiting" card in `src/components/life/Dashboard.tsx` with a richer empty state shown whenever `goals + tasks + bucketList` is empty. It exposes three prominent CTAs side-by-side (stack on mobile):

- **Try a demo** — calls `replaceAll(DEMO_DATA)` to load a curated sample dataset so the user can explore a populated app instantly.
- **Add your first goal** — opens a new `OnboardingWizard` dialog (see §2).
- **Import JSON** — primary outlined button that opens a file picker and calls `importJSON(file)` (same logic as the menu item, just surfaced).

Below the CTAs: a small "Start from a template" grid showing the 5 suggested categories with one science-backed template each (see §3) — click to insert that goal + its starter tasks/sub-goals.

## 2. Onboarding wizard (`src/components/life/OnboardingWizard.tsx`)

3-step dialog:

1. **Pick a category** — Career, Health, Travel, Faith, Music (chips, maps to existing skills; Travel/Faith/Music auto-created via `addSkill` if missing).
2. **Pick a template or start blank** — shows the templates filtered by category (see §3). User can also tweak title + target date inline.
3. **Confirm** — calls `addGoal` then `addSubGoal` for each milestone and `addTask` for each starter task.

After finishing, dialog closes; dashboard re-renders with populated data.

## 3. Science-backed templates (`src/lib/templates.ts` — new)

Curated list, each item: `{ id, category, title, description, rationale, durationDays, subGoals[], tasks[] }`. Rationale cites the research model so it's transparent (shown as small footnote in wizard).

Starter set (5, one per category; expandable later):
- **Career — Deliberate practice project** (Ericsson, 1993): 12-week skill sprint with weekly reflection.
- **Health — Couch-to-5K** (NHS programme): 9-week progressive run plan.
- **Travel — One-trip-a-quarter** (experiential-purchase research, Van Boven & Gilovich 2003).
- **Faith — Daily 10-min contemplative practice** (Kabat-Zinn MBSR-style cadence).
- **Music — 20-hour rapid-skill ramp** (Kaufman, *The First 20 Hours*): daily 30-min focused practice.

Each template ships with 2–4 sub-goals (milestones) and 2–3 starter tasks so progress can auto-compute immediately.

## 4. Auto-calculated goal progress

Update `progressFor` in `src/lib/app-data.tsx` to remove manual input dependency. New rule (in priority order):

1. If goal has tasks linked (`tasks.filter(t => t.goalId === g.id)`), progress = `completed tasks / total tasks × 100`.
2. Else if goal has sub-goals, progress = `done sub-goals / total × 100` (current behavior).
3. Else if `status === 'completed'`, 100. Otherwise 0.

Because `progressFor` currently takes only a `Goal`, change its signature to `progressFor(g, tasks)` and update call sites: `Dashboard.tsx`, `Goals.tsx`, `MindMapCanvas.tsx`, `Overview.tsx` (and any other). Pass `tasks` from `useAppData()` at each call site.

Drop the "Manual progress override" input from the Goal create/edit dialog in `Goals.tsx`; replace with a read-only "Progress is auto-calculated from linked tasks and milestones" hint. Keep `manualProgress` in the type for backward-compat with imported JSON but no longer surface it in UI.

## 5. Out of scope

- No backend/Lovable Cloud changes (all local-storage as today).
- Mind-map, timeline, and existing tabs untouched except for `progressFor` call-site updates.

## Files touched

- new: `src/lib/templates.ts`
- new: `src/components/life/OnboardingWizard.tsx`
- new: `src/components/life/EmptyStateHero.tsx` (extracted from Dashboard for clarity)
- edit: `src/components/life/Dashboard.tsx` (swap empty state, pass `tasks` to `progressFor`)
- edit: `src/components/life/Goals.tsx` (remove manualProgress input, pass tasks)
- edit: `src/components/life/MindMapCanvas.tsx` & `Overview.tsx` (pass tasks to `progressFor`)
- edit: `src/lib/app-data.tsx` (`progressFor` signature; export `DEMO_DATA` reusing `TEMPLATE_PAYLOAD`)
