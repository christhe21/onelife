# Monthly Focus Pillars

## Goal
Keep the workspace calm by limiting newly scheduled work to three chosen focus pillars per calendar month. A pillar may be either an entire skill or one specific goal. Health remains foundational and does not use a pillar slot.

## Experience
- Add a prominent **This month’s focus** row at the very top of the Dashboard with three large, equal highlight cards.
- Each card shows its selected skill or goal, type, progress, and the remaining days in the month. Empty cards invite the user to choose a focus.
- Opening a card shows one combined picker for skills and goals, clearly grouped by type. No more than three can be selected.
- Treat the built-in **Health** skill and every goal under it as always active, without occupying one of the three cards.
- At the start of a new calendar month, show a calm review prompt. The previous selections are carried forward for review, and the user can keep or replace them before scheduling new non-health work.
- Existing goals and tasks remain visible and editable. Existing calendar blocks are not removed when pillars change.

## Hard scheduling rule
- Allow scheduling when the work belongs to:
  - the always-active Health skill;
  - a selected skill pillar, including every goal under that skill; or
  - a selected goal pillar, limited to that goal and its milestones, tasks, and subtasks.
- Block every route that can add or move non-focus work onto the calendar: manual scheduling, task/subtask scheduling forms, drag/reschedule actions, goal/skill auto-scheduling, and scheduling during goal creation or marketplace import.
- Show a warning when blocked: **“This is outside your three focus pillars. Adding more active work has a high chance of burnout and stress. Replace a focus pillar first.”** Include a direct action to review the three pillars.
- Do not block creating, editing, completing, or browsing goals and tasks outside the current focus. Only calendar scheduling is restricted.

## Data and continuity
- Store the current calendar-month key and up to three typed references (`skill` or `goal`) in the existing synced app snapshot.
- Normalize old or invalid saved data safely, remove references to deleted items, prevent duplicate selections, and preserve the selections in backup/restore.
- Keep a small monthly history so the Dashboard can show the just-finished month during review without creating a separate database table.

## Technical details
- Add shared focus helpers that resolve whether a task/subtask belongs to an allowed health, skill, or goal pillar and return a consistent scheduling decision.
- Put the final guard in the central data actions as well as the scheduling UI, so every scheduling path follows the same hard rule.
- Return structured blocked results from auto-scheduling and use the existing notification system for the warning and review action.
- Add focused tests for mixed skill/goal pillars, the three-item cap, Health bypass, month rollover, deleted references, manual schedule/reschedule, and auto-scheduling.
- Verify the complete flow on desktop and mobile, including all three cards, month review, allowed scheduling, blocked scheduling with warning, and unchanged existing calendar entries.
