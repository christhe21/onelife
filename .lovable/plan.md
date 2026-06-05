## Goal

Three connected fixes in the Today view and data model:

1. Make the **Add to schedule** dialog truly mobile-friendly (no horizontal overflow, no zoom-in on iOS time inputs).
2. Track **estimated hours** on tasks and sub-tasks (and surface them in the JSON template), then automatically decrement remaining hours when a scheduled block is marked done.
3. Keep scheduled blocks visually **inside the hour cell** they belong to, so a 9:00 block never bleeds into 10:00 or the time-gutter label.

---

## 1. Mobile Add-to-Schedule dialog (`src/components/life/Today.tsx`)

Symptom: dialog content overflows horizontally, native `<input type="time">` triggers iOS zoom, footer buttons wrap awkwardly.

Changes inside `AddToScheduleDialog`:

- `DialogContent`: switch to `w-[calc(100vw-1rem)] max-w-md max-h-[85dvh] overflow-y-auto p-4 sm:p-6` and add `overflow-x-hidden`. Force every child container to `min-w-0` so long task titles can't push width out.
- Search results list: replace `truncate` on the row with `min-w-0` + `truncate`, and **drop** the right-side `goalTitle` chip on mobile (`hidden sm:inline` already exists — but the row itself currently has no `min-w-0`).
- Time inputs: wrap in a 2-column grid that becomes single column under 360px (`grid-cols-1 xs:grid-cols-2`), bump the input `text-base` (16px) so iOS Safari does not zoom, and add an inline **Duration** read-out ("1h 30m") so the user sees the planned hours immediately.
- Add a small **"Estimated hours"** number input (optional, defaults to the from/till span). Saved into the new `plannedHours` field (see §2) when the selected item has no estimate yet.
- Footer: stack vertically on mobile (`flex-col-reverse sm:flex-row`), each button `w-full sm:w-auto`, remove the conflicting `gap-2 sm:gap-0`.

No new dialog file — keep edits inside `Today.tsx` so `CalendarView` keeps importing `AddToScheduleDialog` unchanged.

---

## 2. Planned vs. spent hours across the data model

### 2a. Type & normalizer changes (`src/lib/app-data.tsx`)

Add two optional numeric fields, both in hours:

- `plannedHours` — total estimate set by the user.
- `spentHours` — accumulated from completed scheduled blocks (auto-managed).

Locations:

- `Goal` interface — add `plannedHours?`, `spentHours?`.
- `Task` interface — add `plannedHours?`, `spentHours?`.
- `SubTask` interface — add `plannedHours?`, `spentHours?` (keep existing `hoursPerWeek`).

Update `normalizeGoal`, `normalizeTask`, `normalizeSubTask` to parse them (`typeof === "number" && raw >= 0`).

### 2b. Auto-deduct on completion

Inside `toggleTask` and `toggleSubtask` (in `app-data.tsx`):

- When toggling from `done:false → done:true` **and** the item has both `startDate` + `endDate`, compute `hours = (end - start) / 3_600_000` and set `spentHours = (spentHours ?? 0) + hours`.
- When toggling back `true → false`, subtract the same amount (clamped to 0).
- Roll the same delta up to the parent goal's `spentHours` when the task/subtask has a `goalId` chain.

`remainingHours = max(0, plannedHours - spentHours)` is derived in the UI, not stored.

### 2c. JSON template / AI prompt (`src/lib/app-data.tsx`)

Update `AI_SYSTEM_PROMPT`, `_schema`, and the sample `TEMPLATE_PAYLOAD`:

- Add `"plannedHours": number` (and optional `"spentHours": number`) to the goal, task, and subtask shapes in the prompt.
- Add the same keys to the example records so a downloaded template demonstrates them.

### 2d. Surface hours in the UI

- **Add-to-schedule dialog**: show `Remaining: 3h 30m / 10h` chip when the selected item has `plannedHours`. Lets the user write/update `plannedHours` inline.
- **Schedule block** (Today's schedule card): below the time row, append `· {remaining}h left` when applicable.
- **Focus list rows**: small muted suffix `· {remaining}h` when planned hours exist.
- No new component files — small inline additions in `Today.tsx`.

Out of scope for this pass: editing planned hours from the Tasks tab UI (still editable via JSON import). Can follow up if requested.

---

## 3. Schedule blocks staying inside their hour cell (`src/components/life/Today.tsx`)

Current `Schedule` renders hour rows with `HOUR_PX = 56` and overlays absolutely-positioned blocks using `pointer-events-none absolute inset-0 pl-12 pr-2`. Two real issues:

- Blocks use `Math.max(28, durH * HOUR_PX - 4)` — a 15-min block (`durH = 0.25`) becomes 28px tall but its visual height is forced to ~half an hour, spilling into the next row.
- The block sits at `top = (start - 6) * HOUR_PX` but the hour label inside the row sits at `pt-1` with `text-[10px]`. The block's `left-1` slightly overlaps the gutter on narrow viewports because the wrapper's `pl-12` matches the gutter exactly with no breathing room.

Fixes:

- Replace the min-height clamp with `height = durH * HOUR_PX - 2` and instead give the block `min-h-0` + `overflow-hidden`; for sub-30-min blocks, collapse to a single-line variant (`py-0.5`, hide the secondary meta row) so it physically fits within its duration.
- Bump wrapper padding to `pl-14 pr-3` and align the gutter label container to `w-14` so the block's `left-1 right-1` always sits inside the content column with a 1px gap from the gutter line.
- Add a thin left border using the skill colour as today, but render it `inset-y-0` flush with the block — no change, just confirming the block no longer exceeds its row.
- Add a top `1px` border using `border-t border-border/40` on each block so the top edge visually snaps to the hour grid line.

No HOUR_PX change (keeps drag-drop math intact). Mirror the same min-height removal in `CalendarView`'s `WeekGrid` and `DayGrid` so the calendar matches.

---

## Technical notes

- No new dependencies, no new files.
- Backward compatible: missing `plannedHours` / `spentHours` are treated as undefined; old exports continue to import cleanly.
- All colours via existing skill tokens / semantic tokens.

## Out of scope

- Editing `plannedHours` from a dedicated Tasks tab form (only the inline dialog field this pass).
- Per-week burn-down charts for hours.
- Showing spent hours in the Overview / Dashboard cards.
