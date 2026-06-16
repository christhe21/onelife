## Plan

### 1. Milestone dates can't exceed goal target date

**Files:** `src/components/life/NewGoalWizard.tsx`, `src/components/life/Goals.tsx`, `src/lib/app-data.tsx`

- In `NewGoalWizard` milestones step: set `max={targetDate}` and `min={today}` on each milestone date input; on blur, clamp to `targetDate` if exceeded. Disable "Save milestones / Next" if any milestone date is empty or `> targetDate`. Show inline error: "Must be on or before goal target date".
- In `Goals.tsx` `GoalCard` add-milestone inputs (and the inline sub-goal date input): apply same `max={goal.targetDate}`, `min={goal.startDate}` and block submit when out of range.
- In `app-data.tsx` `addSubGoal` / `updateSubGoal`: clamp `targetDate` so it is never `> goal.targetDate` and never `< goal.startDate` as a safety net.

### 2. Reorder task creation: goal/milestone BEFORE due date

**Files:** `src/components/life/NewTaskWizard.tsx`, `src/components/life/SubtaskFormDialog.tsx`, `src/components/life/Tasks.tsx`

- Change `NewTaskWizard` `STEPS` order from `[basics, priority, schedule, link, subtasks, done]` to **`[basics, priority, link, schedule, subtasks, done]`**.
- On the schedule step, once a goal (and milestone, when not daily) is selected, constrain the due date / start / end inputs:
  - `min` = today, `max` = selected goal's `targetDate` (and `min` not earlier than the goal's `startDate` for daily start; `endDate` capped at goal target).
  - If the user-chosen date falls outside the goal range, show inline error and disable Next.
  - When entering the schedule step, default `dueDate` to `min(today+1, goal.targetDate)` and `endDate` to `min(today+30, goal.targetDate)` so defaults are always valid.
- `SubtaskFormDialog`: accept new optional props `minDate` / `maxDate` for the deadline input. Wire `Tasks.tsx`'s `SubtasksPanel` to pass the parent task's goal range (resolved via `task.subGoalId` → goal, or `task.goalId`) so subtask deadlines also can't exceed the goal. Block save when out of range.
- In the wizard's subtasks step, pass the currently selected `goalId`'s `targetDate` as `maxDate` to `SubtaskFormDialog`.

### 3. Daily tasks cannot have subtasks

**Files:** `src/components/life/NewTaskWizard.tsx`, `src/components/life/Tasks.tsx`

- In `NewTaskWizard`: when `isDaily === true`, skip the `subtasks` step entirely (jump from `link` straight to the create action). Clear `subs` whenever `isDaily` is toggled on. Adjust the progress dots and the "Create task" button placement so it appears on the `link` step when daily.
- In `Tasks.tsx` `SubtasksPanel` / `TaskRow`: hide the "Add subtask" button when `task.recurrence === "daily"`. If a daily task somehow has subtasks (legacy), still render them read-only but disable add.
- In `EditTaskDialog` (if it exposes a recurrence toggle): same rule — hide subtask UI for daily.

### Out of scope
- No data migration for existing milestones already past target date.
- No changes to calendar rendering or recurrence projection.

### Technical notes
- Date comparisons use string `YYYY-MM-DD` (lexicographic compare is correct for ISO dates).
- Clamping helper: `const clampDate = (d, min, max) => d < min ? min : d > max ? max : d;` — colocate in `src/lib/utils.ts`.
- The wizard's `canNext` for the new `schedule` step also requires the chosen date(s) to be within the selected goal's range.
