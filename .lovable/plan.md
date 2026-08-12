# Auto-move to the nearest free slot on conflict

Today, dragging a task/subtask onto a busy slot opens the "Scheduling conflict" dialog with only two choices: "Keep original time" or "Move anyway" (which creates an overlap).

## What to add

A third option in the conflict dialog: **"Use nearest free slot"**.

- The dialog shows the suggested slot inline, e.g. *Nearest free slot: Wed, Aug 12 · 15:30 – 16:30*, so it's clear where the item will land before confirming.
- Clicking it reschedules the item to that slot instead of the dropped time.
- Button order: Keep original time · Use nearest free slot (primary) · Move anyway.
- If no free slot is found within the search window, the button is hidden and the dialog behaves as it does now.

## How "nearest" is chosen

- Search in 15-minute steps outward from the dropped time (alternating later/earlier), preferring the *later* slot on ties.
- A candidate is valid when the item's full duration fits without overlapping any incomplete event, and stays inside the day's working window (09:00–21:00, matching the existing auto-schedule range).
- Search the drop day first; if nothing fits, roll forward to following days (up to 7 days) at the start of the working window.
- Duration is always preserved.

## Technical notes

- All changes stay in `src/components/life/CalendarView.tsx`.
- New pure helper `findNearestFreeSlot(payload, day, time)` reuses the existing `findConflicts` overlap logic and `eventsByDay` map; returns `{ day, time } | null`.
- `pendingMove` state gains a `suggestion` field, computed once when the conflict dialog opens (in the drag `onDrop` handler), so the dialog does no work while rendering.
- Applying the suggestion calls the existing `applyMove` with the suggested day/time — no data-layer changes needed.

## Out of scope

- Silent auto-move without confirmation (the dialog always asks).
- Shifting the *other* conflicting items out of the way.
