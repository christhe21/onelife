# Create Goal route in Marketplace

Add a full goal-authoring flow accessible from the Goal Marketplace. Replace the "Submit a Goal" button with "Create Goal" which navigates to a dedicated route. Everything authored there must be editable before saving, and tasks/subtasks must be schedulable via presets (daily, weekdays, weekly, biweekly, monthly, custom days) — informed by common recurrence patterns (RFC 5545 RRULE-style: FREQ, INTERVAL, BYDAY, COUNT/UNTIL) but exposed as friendly presets.

## Scope

1. **Remove** the "Submit a Goal" button in `GoalMarketplace.tsx` (and the `handleContribute` helper).
2. **Add** a "Create Goal" button in its place that navigates to a new route `/create-goal`.
3. **New route** `src/routes/create-goal.tsx` rendering a `CreateGoalWizard` inside the existing `AppShell`.
4. **New component** `src/components/life/CreateGoalWizard.tsx`.
5. Reuse existing `app-data` mutations (`addGoal`, `addTask`, `autoScheduleTasks`) — no schema changes needed.

## Wizard structure (single page, sectioned, all editable)

Step layout (no forced step gating; all sections visible and editable, with a sticky "Save Goal" footer):

1. **Goal**: title, description, skill (dropdown), startDate, targetDate, plannedHours, status.
2. **Sub-goals** (repeatable rows): title, optional targetDate, optional description. Add/remove/reorder.
3. **Tasks** (repeatable rows, each linkable to a sub-goal): title, description, priority, startDate, dueDate, plannedHours.
   - **Subtasks** nested under each task: title, plannedHours, priority. Add/remove.
   - **Schedule** section per task or per subtask (rule: if a task has subtasks, schedule only at subtask level — matches existing autoSchedule rule).
4. **Review & Save**: summary of everything, "Save Goal" persists and routes back to `/` with a toast.

## Scheduling presets (per task/subtask)

Inline "Schedule" popover per item with:

- **Frequency preset**: `none`, `daily`, `weekdays` (Mon–Fri), `weekends`, `weekly`, `biweekly`, `monthly`, `custom`.
- **Custom**: weekday checkboxes (S M T W T F S) + interval (every N weeks).
- **Time of day**: start time (default 09:00), duration (default = item's `plannedHours` or 1h).
- **Range**: start date (default today), end via `until date` OR `count` (e.g. 12 occurrences).
- **Auto-schedule fallback**: button "Auto-place in free slots" — calls the existing `autoScheduleTasks` helper (9 AM–9 PM, no overlap) for items where the user doesn't define explicit recurrence.

On Save, the wizard:
- Creates the goal + subgoals via `addGoal`.
- Creates each task via `addTask` with `recurrence` populated from the preset (mapped to existing `Recurrence` type: `none|daily|weekly|monthly|yearly` — store advanced custom rules as additional task fields only if already supported; otherwise fall back to closest preset + a description note. Confirm scope below.).
- For items with auto-schedule selected, calls `autoScheduleTasks` after creation.

## Files

- **Edit** `src/components/life/GoalMarketplace.tsx`: replace Submit button with Create Goal `<Link to="/create-goal">`.
- **Create** `src/routes/create-goal.tsx`: route + AppShell wrapper.
- **Create** `src/components/life/CreateGoalWizard.tsx`: the wizard UI.
- **Create** `src/components/life/SchedulePresetPicker.tsx`: reusable popover used for tasks & subtasks.
- **Edit** `src/lib/app-data.tsx` only if we need to extend `Recurrence` for `weekdays|biweekly|custom`. Recommended: add optional `recurrenceRule?: { byDay?: string[]; interval?: number; count?: number; until?: string; time?: string }` on `Task`/`SubTask` so calendar/scheduling can render exact occurrences without breaking existing data.

## Out of scope

- No marketplace JSON edits, no submission flow, no calendar UI refactor, no auth/cloud changes.
- Editing existing goals stays in current Goals view (not touched).

## Open question (will assume default if not answered)

The existing `Recurrence` type only supports `none|daily|weekly|monthly|yearly`. To support weekdays/biweekly/custom-day patterns cleanly, I plan to add an optional `recurrenceRule` field on `Task`/`SubTask` (non-breaking). If you'd rather keep the data model untouched and limit presets to the existing five values, say so and I'll constrain the UI accordingly.
