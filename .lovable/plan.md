# Desktop UX, Goal Modals & Science-Backed Marketplace Goals

## 1. Desktop view — bigger, fits the screen

`src/components/life/AppShell.tsx`
- Widen the main content container so large screens actually use the space.
  - Change `<main>` from `max-w-6xl` to a fluid cap: `max-w-[1600px] xl:px-12 2xl:px-16`.
  - Bump main padding: `lg:px-8 lg:py-8` → `lg:px-10 lg:py-10 xl:py-12`.
- Sidebar: keep `w-64` at `lg`, expand to `xl:w-72` for breathing room.
- Header row: increase title size on desktop (`lg:text-xl xl:text-2xl`).

`src/components/life/Goals.tsx`
- Goal grid currently `md:grid-cols-2 xl:grid-cols-3`. Add `2xl:grid-cols-3` cap and raise gap to `gap-4 lg:gap-5`. Cards already expand inline; we'll fix the expansion problem in section 2 by moving the body into a modal so the grid never reflows.

`src/components/life/GoalMarketplace.tsx`
- Grid view: keep `sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`.
- List view rows: use full width, no `max-w` clamp.

## 2. Replace dropdowns / inline expansion with clickable modals (Goals page)

Problem: clicking a goal card expands it inline, pushing the grid around and breaking desktop layout. Status uses a `Select` dropdown; milestone dots use hover `Popover`.

`src/components/life/Goals.tsx`
- **Remove inline expand**: delete `expanded` state, `ChevronUp/Down` toggle button, and the `{expanded && (...)}` body block (lines ~338, 372-383, 439-541).
- **New "Goal details" Dialog**: clicking the card title/body opens `<GoalDetailsDialog goal={goal} />` containing everything currently in the expanded section:
  - Description, Current activity (editable textarea), Sub-goals list with add/remove/toggle, Manual progress slider.
  - Width `max-w-2xl`, `max-h-[85vh] overflow-y-auto`, responsive `w-[calc(100vw-2rem)]`.
- **Replace status `Select` with a clickable status modal**: small badge-style trigger button → `Dialog` with 3 large buttons (Not started / In progress / Completed), each with a short description. Closes on pick.
- **Replace milestone-dot `Popover` with a click-to-open `Dialog`**: tapping a dot opens a modal showing milestone title, target date, done state, with Toggle done + Delete actions. Remove `openSubId`/`Popover` machinery.
- Edit (pencil) and Delete (trash) buttons remain in the card header; they already use `Dialog`/`AlertDialog`.

Filter `Select` at the top of the Goals page stays as-is (it's a simple filter, not a per-item action).

## 3. New scientifically-grounded marketplace goals

Add 4 new JSON templates to `src/data/marketplace/` and register them in `src/data/marketplace/index.ts`. Each template cites the principle in its `description` / `advice` fields and uses milestones aligned to evidence-based intervals.

| File | Goal | Scientific basis |
|---|---|---|
| `deep-work-90.json` | "90-Day Deep Work Habit" | Cal Newport's deep-work blocks, ultradian 90-min cycles, implementation intentions (Gollwitzer). 4 milestones at days 7/30/60/90. |
| `couch-to-5k.json` | "Couch to 5K (Evidence-Based)" | NHS Couch-to-5K progressive overload, HRV-guided rest, 3 sessions/week. 9-week ramp. |
| `language-fluency-b1.json` | "Reach B1 in a New Language (180 days)" | Spaced repetition (Ebbinghaus/SuperMemo), comprehensible input (Krashen i+1), 15-min daily Anki + 30-min input. CEFR milestones A1→A2→B1. |
| `meditation-mindfulness-8w.json` | "8-Week Mindfulness (MBSR-style)" | Kabat-Zinn MBSR curriculum, body scan → breath → open monitoring. Weekly milestones, 20 min/day. |

Each template includes:
- 3-5 `subGoals` with `dayOffset` and short `description` (the scientific rationale for that phase).
- 8-15 `tasks` with `recurrence` (daily/weekly), `plannedHours`, `priority`, `subGoalIndex`, and a `description` quoting the principle.
- `tags` (e.g. `["focus","habits","productivity"]`), `coverEmoji`, `difficulty`.
- `resources` pointing to primary sources (Newport, NHS, Krashen, Kabat-Zinn).
- `verified: true`, `creatorName: "Lovable Science"`.

## Out of scope
Skills, Tasks, Dashboard, Calendar, Mindmap, Radar chart, Frieren theme, backend/persistence changes, importer logic (existing importer already handles the new fields added in the previous turn).
