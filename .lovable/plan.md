## Calendar interaction & mobile fixes

Three small fixes scoped to `src/components/life/CalendarView.tsx`.

### 1. Week & Month: clicking a date opens Day view

Currently:
- **Week view** day headers (Mon 26 / Tue 27 …) call `onAddOnDay(d)` → opens the Add dialog.
- **Month view** day cells call `onAddOnDay(d)` on click; only the small number badge calls `onPickDay`.

Change to:
- Week header buttons call a new `onPickDay(d)` prop → `setCursor(d); setView("day")`.
- Month cells `onClick` → `onPickDay(d)` (switch to Day view). The `+ Add` toolbar button still handles adding; long-press / explicit add path is removed from the day cell click. Keep drop targets for drag-to-reschedule unchanged.

### 2. Event details modal — mobile-safe

The dialog footer renders 4 buttons (Close / Unschedule / Reschedule / Mark complete) in a single `flex-row` that overflows on a 384px viewport. Update:
- `DialogContent`: `w-[calc(100vw-1rem)] max-w-md p-4 sm:p-6` and `max-h-[90dvh] overflow-y-auto` (matches `AddToScheduleDialog`).
- `DialogFooter`: stack vertically on mobile (`flex-col gap-2 sm:flex-row sm:justify-end`), full-width buttons on mobile (`w-full sm:w-auto`).
- Title row already truncates; keep.

### 3. Day view — content overflowing right edge

Root cause: nothing constrains the Day grid's width inside `CardContent` on mobile, and the absolute event boxes use `left-1 right-1` while the hour-label column is `w-12 shrink-0` inside a `flex` row — the parent grid implicitly inherits the page width but events can still spill if Card padding/scroll is off.

Fix:
- Wrap `DayGrid` outer in `overflow-hidden` and switch the events overlay to use a left offset (`left-12 right-2`) on an absolutely-positioned layer scoped to the scroll container — guarantees chips never escape the right edge regardless of viewport.
- Ensure long titles wrap via existing `break-words line-clamp-2` (already present), and confirm `min-w-0` on the title span.

No new dependencies. No data-layer changes. Only `CalendarView.tsx` is edited.
