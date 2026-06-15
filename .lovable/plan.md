# Tasks & Subtasks: Required Fields + Unified Scheduling

## Goals

1. Every task and every subtask requires the same core fields — **title** and **deadline (due date)**.
2. Subtask creation uses the same form/fields as tasks (just linked to a parent under the hood).
3. A **Schedule** button on each item opens the calendar's scheduler modal (existing `AddToScheduleDialog`) prefilled with that item, where the user picks date + from/till time. After saving, the block appears in the calendar.
4. **Visibility rule:** a parent task with one or more subtasks does NOT show the Schedule button on the parent — only its subtasks do. A task with zero subtasks shows the Schedule button on itself.

## Changes

### 1. `NewTaskWizard.tsx` — required fields + better subtask step
- Make the **due date** required for non-daily tasks (block "Next" on the Schedule step if empty; current logic already pre-fills, just enforce non-empty).
- Replace the inline 3-input subtask rows with a **mini sub-form** that mirrors the task fields:
  - Title (required)
  - Description (optional)
  - Priority (low/medium/high, default medium)
  - Deadline / due date (required)
  - Sub-tasks are saved with `{ title, endDate (deadline), ... }`.
- Block "Create task" if any added subtask is missing title or deadline.
- Parent linkage is implicit (subtasks belong to the task being created).

### 2. `Tasks.tsx` — `SubtasksPanel` rewrite
- Replace the freeform "Add sub-task" input with an **"+ Add subtask"** button that opens a small modal (same shape as the wizard's subtask form: title, description, priority, deadline — all required except description).
- Each subtask row shows: checkbox, title, deadline pill, then a **Schedule** icon button and a Delete button.
- Remove the old inline h/wk + date row that appeared on click.

### 3. Per-item Schedule button
Add a single shared dialog instance per `CalendarView` is overkill — instead reuse the existing `AddToScheduleDialog` from `Tasks.tsx`:

- Extend `AddToScheduleDialog` props with an optional `preselect?: { taskId: string; subId?: string }`. When provided, the dialog skips the search list and locks the selection to that item (chip with X removed or disabled).
- In `TaskRow`: render the Schedule button **only when `task.subtasks.length === 0`**. Clicking it opens `AddToScheduleDialog` with `preselect={{ taskId: task.id }}` and `defaultDate` = today (or task.dueDate).
- In `SubtasksPanel`: each subtask row's Schedule button opens `AddToScheduleDialog` with `preselect={{ taskId, subId }}`.
- The dialog already writes `startDate`/`endDate` via `updateTask`/`updateSubtask`, which is what `CalendarView` reads to render events — so scheduled items appear in the calendar automatically with no calendar-side changes.

### 4. `EditTaskDialog` — minor
- Mark the Due field as required (asterisk + disable Save when empty).

## Out of scope
- No changes to `CalendarView` rendering, drag/drop, or recurrence projection.
- No data migration: existing tasks/subtasks without a deadline keep working; required-field enforcement applies only to new creates/edits going forward.
- Daily-recurring tasks continue to use Start/End instead of a single deadline (unchanged).

## Technical notes
- `SubTask` already has `endDate` — reuse it as the deadline field (no schema change).
- `AddToScheduleDialog` already accepts `defaultDate`; add `preselect` and, when set, initialize `selected` from `flat` on open and hide the search UI.
- No changes to `app-data.tsx` types beyond possibly storing subtask `priority` — if we want priority on subtasks, add `priority?: "low"|"medium"|"high"` to `SubTask` and `normalizeSubTask`. (Confirm in build step.)
