# Create Task wizard

Replace the inline "add task" bar in the Tasks section with a single **Create Task** button that opens a stepper modal styled like the existing **New Goal** wizard (rounded `DialogContent`, top progress dots, step body, footer Back / Next).

## Steps in the wizard

1. **Basics** — Title (required), Description (optional, stored in `evidence`).
2. **Priority** — Low / Medium / High (large card picker).
3. **Schedule** — toggle "Daily task" (off by default).
   - Off → standard task with a Due date.
   - On → Start date + End date; recurrence forced to `daily`.
4. **Link** —
   - If **not daily**: choose a Goal, then a Milestone under that goal (two selects). Required.
   - If **daily**: choose a Goal only. The task is linked directly to the goal (no milestone). Required.
5. **Sub-tasks** (optional) — same inline list UX as the New Goal wizard's sub-tasks step (title + optional h/wk + end date, add/remove rows).
6. **Done** — summary card with a "Create another" and "Close" action.

Footer: Back / Next on every step; Next disabled until that step is valid (e.g. title non-empty on step 1, goal selected on step 4). Skip is allowed only for the optional sub-tasks step.

## Data model change (`src/lib/app-data.tsx`)

Add `goalId?: string` to `Task` so a daily task can be linked directly to a goal without a milestone.

- `normalizeTask`: read/write `goalId`.
- `deleteGoal`: in addition to the existing milestone-based cascade, also remove tasks where `t.goalId === id`.
- `addTask` accepts `goalId` via the existing pass-through.

No other write paths need changes — `subGoalId` stays optional and unset for daily tasks.

## UI wiring

- New file `src/components/life/NewTaskWizard.tsx` modeled on `NewGoalWizard.tsx` (same `Dialog` shell, `STEPS` array, dot indicator, footer).
- `src/components/life/Tasks.tsx`:
  - Remove `AddTaskBar` from the rendered tree.
  - Replace the rounded card wrapper with a single full-width primary button: `+ Create task` that opens `<NewTaskWizard />`.
  - Keep `AddTaskBar`'s code only if still referenced elsewhere; otherwise delete it.
- `TaskRow` and `EditTaskDialog` need a tiny tweak: when displaying the linked goal, fall back to `goals.find(g => g.id === task.goalId)` if `subGoalId` is absent, so daily tasks still show their parent goal chip.

## Display semantics for daily tasks

- The recurrence chip (existing `Repeat` icon when `task.recurrence !== "none"`) already covers visual indication.
- In sorting / lists, daily tasks behave like normal tasks; the existing recurrence/scheduling logic continues to handle them.

## Out of scope

- Calendar view changes (it already reads `recurrence` + dates).
- Editing the existing `EditTaskDialog` beyond the goal-chip fallback above.
- Migrating already-stored tasks (the new `goalId` is purely additive and optional).
