
## Goal
When a user schedules a task/sub-task from the Today view, it should appear in a built-in **Calendar** tab — a lightweight, responsive calendar (no external libs, no Google sync).

## Scope
Frontend-only. Reuses existing `startDate` / `endDate` fields already on tasks and sub-tasks. No data model changes.

## Changes

### 1. New tab: Calendar
- Add `"calendar"` to `TabId` in `src/components/life/AppShell.tsx` with a `CalendarDays` icon, placed between Today and Overview.
- Wire it in `src/routes/index.tsx` to render a new `<Calendar />` view.

### 2. New component: `src/components/life/CalendarView.tsx`
A lightweight custom calendar (no `react-day-picker` — that's a date picker, too heavy for an event grid).

Three view modes via Tabs, persisted in local state:
- **Month** — 7×N grid. Each day cell shows up to 3 event chips (color = skill color, label = task title) + "+N more" overflow. Click a day → opens a Day drawer.
- **Week** — 7 columns × hour rows (6:00–23:00, reuses Today's `HOUR_PX = 48`). Positioned blocks like Today's schedule, spanning across days.
- **Day** — single-column timeline identical in style to Today's Schedule panel, but for any selected date.

Header controls:
- Prev / Today / Next buttons
- Current month/week/day label
- View switcher (Month · Week · Day)
- "Add to schedule" button that opens the same dialog already in `Today.tsx` (extract dialog into shared component — see below).

Mobile:
- Default to **Day** view on `useIsMobile()`.
- Month grid uses 2-letter weekday headers and compact 28px cells with dot indicators instead of chips.

### 3. Extract scheduling dialog
Move the "Add to Schedule" dialog out of `Today.tsx` into `src/components/life/ScheduleDialog.tsx` so both Today and Calendar can open it. Accepts an optional `defaultDate` so clicking a calendar day pre-fills that date.

### 4. Event sourcing
Single helper `getScheduledItems(tasks)` in `CalendarView.tsx`:
- Flattens tasks + subtasks with a `startDate`.
- Returns `{ id, title, start: Date, end: Date, color, parentTitle? }`.
- Color resolved via existing skill → goal → task chain (same logic as Today).

### 5. Styling
- All colors via existing skill tokens / semantic tokens — no hardcoded colors.
- Cells use `bg-card`, `border-border`, today = `ring-2 ring-primary`, selected = `bg-accent`.
- Uses existing `Card`, `Button`, `Tabs`, `Dialog`, `ScrollArea`.

## Technical notes
- No new dependencies.
- Pure date math with `Date` (start-of-week = Monday, configurable later).
- Memoize event grouping by `yyyy-mm-dd` key.

## Out of scope
- Editing/deleting events from the calendar (link "Open in Today" instead — can add later).
- Drag-to-reschedule inside the calendar.
- Recurrence and external (Google/ICS) sync.
