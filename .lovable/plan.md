# Calendar upgrade — Phase 1

Upgrade the existing Calendar tab in place (`src/components/life/CalendarView.tsx`) with visual progress and direct calendar interactions. Phase 2 (view modes + backlog drawer, inline notes) is deferred.

## Scope

### 1. Visual progress on the month grid

For each day cell compute:

- `completed` = tasks done that day + subtasks done that day
- `total` = tasks scheduled/due that day + subtasks scheduled that day
- `ratio` = completed / total (0 if total is 0)

Use that to render three layered visual cues:

- **Heatmap background**: cell `background-color` = `color-mix(in oklab, hsl(var(--primary)) <intensity>%, transparent)` where intensity scales with `completed` (e.g. 0→0%, 1→12%, 2→22%, 3→32%, 4+→45%). Pure days with zero activity stay transparent so "other month" styling is preserved.
- **Progress ring** on the day number badge: small SVG ring (16px) around the date showing `ratio`. Only rendered when `total > 0`.
- **Streak indicator**: compute streaks across consecutive days where `completed > 0`. For any day that is part of a streak ≥ 2, show a small flame dot in the corner; on the current streak's last day (today or most recent), show the streak length as a tiny badge.

All three are computed once in a `useMemo` keyed on `events` → `Map<ymd, {completed, total}>`, plus a second pass for streaks.

Add a compact legend row above the month grid: "Heat = completed · Ring = progress · 🔥 = streak".

### 2. Click-to-add (quick add)

Single click on any day cell currently navigates to day view. Change to:

- **Single click** on a cell → open `AddToScheduleDialog` with `defaultDate` = that day (currently this is double-click only).
- **Click on the date number** (or a new small "open day" chevron) → switch to day view for that date.

This makes the calendar a control center: the obvious tap creates work for that day, while drilling in is a secondary action. Same change applied to week-view day headers.

### 3. Drag-to-reschedule

Make each event chip draggable (HTML5 drag-and-drop, no new dependency):

- Chip `draggable`, `onDragStart` sets `dataTransfer` with the event id (`task:<id>` or `sub:<taskId>|<subId>`).
- Day cells (month + week) handle `onDragOver` (preventDefault + highlight ring) and `onDrop`.
- On drop, parse the id and call a new helper on `useAppData()`:
  - `rescheduleTask(taskId, newYmd)` → shifts `task.startDate`/`task.endDate`/`task.dueDate` to the new day, preserving time-of-day and duration.
  - `rescheduleSubtask(taskId, subId, newYmd)` → same for subtasks (`startDate`/`endDate`).
- Toast on success ("Moved to Mar 14").

Recurring events: dragging a projected instance moves the base event (`task.startDate`); we surface this in the toast ("Series moved — every weekly occurrence shifted"). No per-instance exceptions in this phase.

## Files touched

- `src/lib/app-data.tsx` — add `rescheduleTask` and `rescheduleSubtask` to the context value; pure date math, no schema change.
- `src/components/life/CalendarView.tsx` —
  - `useMemo` for `dayStats` (`Map<ymd, {completed, total}>`) and `streaks` (`Map<ymd, {inStreak: boolean, length: number, isTip: boolean}>`).
  - New `DayBadge` subcomponent: date number + SVG progress ring.
  - `MonthGrid` cell: heatmap bg, DayBadge, streak dot/badge; swap click handlers (single click → add, date badge → drill in); add `onDragOver`/`onDrop`.
  - Event chip rendering (month list items + week-grid blocks): add `draggable`, `onDragStart`.
  - `WeekGrid` day header: same single-click-adds behavior; drop targets on each day column.
- No new dependencies.

## Out of scope (Phase 2, not in this plan)

- View modes (Focus/Today, backlog drawer with drag-from-backlog).
- Inline notes/journal per day.
- Contextual time-of-day reminders beyond what tasks already store.

