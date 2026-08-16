# Calendar drag: stop text/element selection while dragging

## Problem

When you press a task block and drag downward, the browser starts a native text
selection (and on touch, the long-press selection/callout). Neighbouring event
blocks, day numbers and labels get highlighted, which visually breaks the drag and
makes it hard to land the item on the intended slot.

Cause: the drag in `useCalendarDrag` never suppresses the browser's default
selection gesture — `preventDefault()` only runs on `pointermove` _after_ the drag
is active, by which point selection has already begun, and nothing sets
`user-select`/`touch-action` on the calendar surfaces.

## What to change (all in `src/components/life/CalendarView.tsx`, plus keyframe-free CSS in `src/styles.css`)

1. **Suppress selection at drag start**
   - In `begin()`, call `e.preventDefault()` on the pointerdown and
     `setPointerCapture` on the originating element so all subsequent pointer
     events route to it.

2. **Global no-select while a drag is in flight**
   - While `dragging` is true, add a `calendar-dragging` class to
     `document.body` that applies `user-select: none`, `-webkit-user-select: none`
     and `-webkit-touch-callout: none`. Remove it on drop/cancel.
   - Also cancel any stray selection created before activation via
     `window.getSelection()?.removeAllRanges()` when the drag activates.

3. **Touch behaviour on draggable blocks**
   - Give the event chips/blocks `touch-action: none` (they're drag handles) so
     the browser doesn't hand the gesture to scrolling/selection mid-drag, and
     keep vertical scrolling on the surrounding scroll containers.
   - Keep the existing 220 ms hold-to-drag threshold, but stop resetting the drag
     purely on movement once the hold has fired.

4. **Selection guards**
   - Add a `selectstart` listener that calls `preventDefault()` while a drag is
     active, and mark event blocks `draggable={false}` so the legacy HTML5 drag
     image never kicks in alongside the pointer drag.

## Out of scope

- Any change to snapping, conflict detection, nearest-free-slot, or long-press-to-create behaviour.
- Resizing blocks by their edges.
