
## 1. Auto-schedule prompt after marketplace import

**Flow change in `GoalMarketplace.tsx`:**
- When the user clicks "Import" on a template, do NOT immediately call `onImport`.
- Open a small confirmation `Dialog` with three actions:
  - **Yes, auto-schedule** — import and distribute blocks on the calendar.
  - **No, I'll schedule manually** — import only (current behavior).
  - **Cancel** — abort.

**API change in `src/lib/app-data.tsx`:**
- Extend `importMarketplaceGoal(template, opts?: { autoSchedule?: boolean })`. Default `autoSchedule = false` (preserves current tests/behavior).
- When `autoSchedule` is true, after creating tasks call a new internal helper `autoScheduleTasks(tasksJustImported, goal)`.

**Scheduling rules (mirrors existing test/behaviour conventions):**
- **If a task has subtasks → schedule only the subtasks**, never the parent task. The parent auto-completes when all subtasks are done (already implemented in `toggleSubtask`, kept unchanged).
- **If a task has no subtasks → schedule the task itself.**
- Block size: prefer the item's `plannedHours` (clamped to 0.5–3h per session). If `plannedHours > 3`, split into multiple ~2h sessions across consecutive eligible days. If unset, default to **2h**.
- Day window: between the item's `startDate`/`endDate` (or goal's start/target) — weekdays first, then weekends if needed.
- Time-of-day: start at **09:00** local and walk forward in 30-min steps to find a slot that does not overlap any existing scheduled task/subtask `startDate`/`endDate`. Cap searching at 21:00; if no slot that day, advance to the next eligible day.
- For subtasks the rule that `startDate` and `endDate` must fall on the **same calendar day** is preserved (existing invariant in app-data prompt at line 321).
- Recurring items (`recurrence !== "none"`) are scheduled once at the first occurrence only; existing `toggleSubtask` recurrence bump logic handles the rest.
- Toast on completion: "Scheduled N blocks across M days" (Frieren variant respected via `getFrierenVocabulary`).

## 2. Skill time estimates + quick schedule

**In `src/components/life/Skills.tsx` (skill card):**
- Compute `estimatedRemainingHours` for each skill = sum over not-done tasks/subtasks linked to goals of that skill, using `plannedHours - spentHours` (fallback 2h when `plannedHours` missing, matching the auto-schedule default).
- Show a small line: "≈ Xh remaining · ~Y sessions @ 2h".
- Add a "Schedule next sessions" button that runs the same `autoScheduleTasks` helper over the skill's unscheduled (no `startDate`) tasks/subtasks, following the same subtask-vs-task rule.

## 3. Tests (extend `src/lib/__tests__/app-data.test.tsx`)

Add a new `describe("importMarketplaceGoal auto-schedule", ...)` block:

1. **Imports without scheduling by default** — call `importMarketplaceGoal(template)`; assert every new task/subtask has no `startDate`/`endDate`.
2. **Auto-schedules only subtasks when task has subtasks** — template has one task with 2 subtasks; with `autoSchedule: true`, assert the parent task has no `startDate`, and both subtasks have `startDate`/`endDate` on the same calendar day.
3. **Auto-schedules the task itself when it has no subtasks** — single task, no subtasks, `plannedHours: 2`; assert the task gets a 2h block.
4. **Splits long plannedHours into multiple ~2h sessions on consecutive days** — task with `plannedHours: 6`, no subtasks; assert it produces 3 blocks across 3 distinct days (one block per day, fits within goal window).
5. **No overlap with existing scheduled items** — pre-create a task scheduled 09:00–11:00 today, then auto-schedule; assert new block starts ≥ 11:00.
6. **Completing all subtasks auto-completes the parent task** — regression test for existing behavior (not currently covered): toggle every subtask done, assert `task.done === true`.

## Files touched

- `src/lib/app-data.tsx` — extend `importMarketplaceGoal`, add `autoScheduleTasks` helper (pure, exported for tests).
- `src/components/life/GoalMarketplace.tsx` — add confirm dialog between click and import.
- `src/components/life/Skills.tsx` — estimate line + "Schedule next sessions" button.
- `src/lib/__tests__/app-data.test.tsx` — new test cases above.

## Out of scope

- Calendar UI changes, recurrence engine changes, marketplace JSON edits, dashboard, mindmap, radar.
- Changing the existing `toggleSubtask` auto-complete behavior (kept as-is, only adds a regression test).
