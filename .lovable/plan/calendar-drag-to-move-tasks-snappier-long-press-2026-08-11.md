# Calendar: drag-to-move tasks + snappier long-press

## What's there today

- Month view: chips are draggable, day cells accept drops — but the drop only changes the **date**, the time of day is kept as-is.
- Week view: blocks are draggable, whole day columns accept drops — dropping anywhere in a column also only changes the date, not the hour.
- Day view: blocks are **not** draggable at all and there are no drop targets.
- Drag uses HTML5 drag-and-drop, which does not fire on touch devices, so on phone/tablet nothing can be moved.
- Long-press to create a task runs for 2s with a box-shadow fill animation (`animate-long-press`, `animate-long-press-block`).

## What to build

### 1. Time-aware dragging everywhere

- **Week view**: drop on a day column computes the hour/minute from the pointer's Y position inside the column, snapped to 15-minute steps, and moves the item to that day *and* time. A live guideline + ghost block follows the pointer while dragging.
- **Day view**: make event blocks draggable and make the hour column a drop surface, so an item can be moved to another hour of the same day (15-min snap).
- **Month view**: keep the current day-level move (a month cell has no time), but preserve the item's original time-of-day and duration.
- In all cases the item's **duration is preserved** (end = new start + old duration).

### 2. Touch drag support

Replace/augment HTML5 drag with pointer-event based dragging (pointerdown → hold ~180ms → drag) so the same gesture works with a finger. While dragging: the block follows the pointer at reduced opacity, target slot highlights, and haptic feedback fires on mobile where available. Scrolling still works when the hold threshold isn't met.

### 3. Long-press to create: 1.2s + real animation

- Change both long-press timers from 2000ms to **1200ms** (month cell, week slot, day slot) and the matching CSS animations to `1.2s`.
- Upgrade the visual so the progress is obvious:
  - A radial/linear progress sweep filling the cell over 1.2s.
  - Slight scale-down press feedback plus a ring that tightens as it completes.
  - A short "pop" + haptic tick at completion right before the create dialog opens.
  - Animation cancels cleanly on pointer up / leave / when a drag starts instead.

## Technical notes

- All work stays in `src/components/life/CalendarView.tsx` plus the keyframes in `src/styles.css`.
- Data layer: current `rescheduleTask` / `rescheduleSubtask` in `src/lib/app-data.tsx` take only a `YYYY-MM-DD` string, so they drop the time. Extend them to accept an optional new start time (ISO or `HH:MM`) and shift `endDate` by the original duration, keeping the existing date-only call signature working for month view.
- Snapping helper: `pxToMinutes(y) = round((y / HOUR_PX) * 60 / 15) * 15`, clamped to the day.
- Long-press and drag share one pointer handler per slot so a long-press never triggers while dragging.
- Colors/rings use existing design tokens only.

## Out of scope

- Resizing blocks by dragging their edges.
- Cross-view drag (e.g. month cell into week column).
