## New Goal Wizard

Reuse the same step-by-step pattern from `Onboarding.tsx` so that every time the user creates a new goal, they're walked through defining it, breaking it into sub-goals, and adding starter tasks (with optional sub-tasks). Every step after step 1 is skippable.

### Steps

1. **Goal basics** *(required)* — title, life area (skill), target date, optional description.
2. **Pick a template?** *(skip)* — if the chosen life area has matching entries in `src/lib/templates.ts`, offer them to pre-fill milestones + tasks. Otherwise auto-skip.
3. **Milestones / sub-goals** *(skip)* — add any number of `{ title, targetDate }` rows. "Add milestone" + per-row delete, same UI as onboarding step 6.
4. **Starter tasks** *(skip)* — add tasks `{ title, dueDate, priority }` linked to this goal.
5. **Sub-tasks per task** *(skip)* — for each task added in step 4, optionally add sub-tasks `{ title, hoursPerWeek?, endDate? }`. Tabs or accordion per task so the screen stays compact. (New — onboarding doesn't have this step.)
6. **Done** — summary card ("1 goal · N milestones · M tasks · K sub-tasks") + "Go to goal" / "Add another".

Header: same progress-dot indicator + "Skip setup" → jumps to Done and saves whatever was filled.

### Where it's triggered

Every existing "Add goal" entry point opens the wizard instead of the current inline form:
- `Goals.tsx` — "Add goal" button
- `Dashboard.tsx` — empty-state CTA
- `EmptyStateHero.tsx` — primary CTA
- `Today.tsx` — if it has an "Add goal" affordance

The wizard opens as a centered modal (Dialog) on desktop and full-screen sheet on mobile, not a fixed-inset takeover like onboarding (since the app is already populated).

### Files

- **New**: `src/components/life/NewGoalWizard.tsx` — the wizard component, controlled via `open` / `onOpenChange` props. Exposes an optional `defaultSkill` so context-aware launchers (e.g. clicking add on a specific skill) can pre-select.
- **New**: `src/components/life/NewGoalButton.tsx` — small reusable trigger that mounts the wizard, so each call site is a one-liner.
- **Edit**: `Goals.tsx`, `Dashboard.tsx`, `EmptyStateHero.tsx`, `Today.tsx` — swap inline add-goal UI for `<NewGoalButton />`.
- **No data-model changes**. Uses existing `addGoal`, `addSubGoal`, `addTask`, `addSubtask` from `useAppData()`.

### Behavior details

- "Skip" on any step is allowed; the wizard commits the goal as soon as step 1 completes so partial progress isn't lost if the user closes mid-flow.
- Closing the dialog after step 1 = same as "Skip setup" (keeps the goal, drops the rest).
- Template selection in step 2 pre-fills steps 3 & 4 but leaves them editable.

### Out of scope

- No changes to the existing inline edit flow on goal cards.
- No changes to onboarding itself.
- No new templates.

---

**Questions before I build:**
1. **Modal vs. full-screen**: dialog on desktop / full-screen on mobile sounds right — or do you want the same full-screen takeover as onboarding everywhere?
2. **Replace inline add forms entirely** in Goals/Dashboard, or keep a "Quick add" (just title) alongside the wizard for power users?
