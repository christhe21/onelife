# Auto-scheduling: expose it, make it configurable, make free slots visible

## 1. Visible auto-schedule actions

**Goals view / goal detail** — add an "Auto-schedule this goal" button in the goal
details dialog header area (and a compact icon action on the goal card). It calls
the existing `autoScheduleGoal(goalId)`.

**Skills view** — the "Schedule next sessions" button already exists; relabel it to
"Auto-schedule skill" and always show it when the skill has any unscheduled work
(today it is hidden unless `unscheduled > 0`, which stays the gate but the label
becomes explicit).

**Feedback** — both actions currently return only a count. They will return a small
result object `{ blocks, firstStart, lastEnd }` so the toast can say:
_"Scheduled 7 blocks · Aug 17 – Aug 26"_, with a **"Go to first block"** action on
the toast.

**Preview (optional step in the same dialog)** — before committing, show a confirm
dialog listing the proposed blocks (title · day · time), with Cancel / Schedule.
Built on a new pure `planAutoSchedule(...)` that returns the proposed blocks without
writing state; the commit path then applies them.

## 2. Configurable preferred work hours

- Add to `Settings`: `workDayStart` and `workDayEnd` (minutes from midnight,
  defaults 540 / 1260), plus `autoScheduleSnapMinutes` (15 / 30 / 60, default 15).
- New card in Settings → "Scheduling" with two time pickers (existing custom
  `TimePicker`) and a snap selector. Validation: end must be after start by at least
  one session.
- `autoScheduleTasks` gains an options argument `{ dayStartMin, dayEndMin, stepMin }`
  replacing the hard-coded `DAY_START_MIN` / `DAY_END_MIN` / 30-minute scan step;
  defaults keep existing behaviour so current tests keep passing.
- `autoScheduleGoal` / `autoScheduleSkill` pass the settings values through.
- `CalendarView`'s `WORK_START` / `WORK_END` in `findNearestFreeSlot` read the same
  settings instead of the local 9–21 constants.

## 3. Free-slot discoverability while dragging

- While a drag is active in week/day view, render a subtle striped/tinted overlay on
  the slots inside working hours where the dragged item's full duration fits without
  a conflict. Computed once per drag start (memoised per visible day range) so
  pointer moves stay cheap.
- Outside working hours the column dims slightly, making the preferred band obvious.
- The current drop target keeps its existing highlight; conflict styling (red ghost +
  "⚠ n conflicts") is unchanged.
- **Snap control**: a small 15 / 30 / 60 segmented control in the calendar toolbar,
  defaulting to the settings value, used by the drag resolver's rounding
  (`Math.round(raw / snap) * snap`) and by nearest-free-slot stepping.

## 4. Jump to first created block

After a successful auto-schedule, the toast's "Go to first block" action switches to
the Calendar tab, sets the cursor to that block's day, and opens day view (mobile) /
week view (desktop). Implemented via the existing tab-navigation callback plus a
one-shot "focus date" value passed to `CalendarView`.

## Technical notes

- Files: `src/lib/app-data.tsx` (settings fields, options on `autoScheduleTasks`,
  richer return from the two auto-schedule functions, new `planAutoSchedule`),
  `src/components/life/Goals.tsx`, `Skills.tsx`, `Settings.tsx`,
  `CalendarView.tsx`, `AppShell.tsx` (focus-date plumbing).
- Existing unit tests in `src/lib/__tests__/app-data.test.tsx` must keep passing;
  new tests cover custom work hours, snap steps, and that free-slot computation
  never proposes an overlapping block.
- No database or backend changes — settings ride along in the existing settings
  snapshot that already syncs to the cloud.

## Out of scope

- Rescheduling already-scheduled blocks (auto-schedule still only fills empty ones).
- Per-goal or per-day-of-week work hours (single global window for now).
