# Custom month & year pickers in the DatePicker

## Problem
The calendar header currently uses the browser's native `<select>` dropdowns, so on Android it opens the OS picker sheet instead of the app's own styled UI. The year list is also limited to roughly the current year ±20.

## What changes

### 1. Replace native dropdowns with in-calendar panels
In `src/components/ui/pickers/DatePicker.tsx`:
- Drop `captionLayout="dropdown"` (and the native select path) and render a custom caption header: two buttons, one showing the month (e.g. `November`) and one showing the year (e.g. `2026`), each with a chevron.
- Clicking the month button swaps the calendar body for a 3x4 grid of month names (Jan–Dec). Picking one returns to the day grid on that month.
- Clicking the year button swaps the body for a scrollable year list/grid (4 columns), scrolled to the currently displayed year. Picking one returns to the day grid.
- Months/years outside `min`/`max` are disabled and unclickable.
- The panels are plain React state inside the popover, styled with existing theme tokens — no native controls, so identical look on Android, iOS and desktop.

### 2. Wider year range
- Default range: 1900 through current year + 70 (covers a full human lifespan, i.e. past ~2096), instead of ±20 years.
- When `min`/`max` are supplied, clamp the range to those years as today.

### 3. Keep behaviour identical elsewhere
- Value format stays `YYYY-MM-DD`; selecting a day still closes the popover.
- `min`/`max` day-level disabling unchanged.
- Other `<Calendar />` consumers are untouched.

## Technical notes
- Uses `react-day-picker` v9's `month` + `onMonthChange` controlled props so the custom header can drive the visible month; the header itself is a custom `MonthCaption` (or wrapper above the calendar) rather than the built-in dropdown layout.
- Month labels via `date-fns` `format(..., "MMMM")` for consistency with the rest of the app.

## Acceptance
- Tapping the month or year opens an in-app panel, never the Android system picker.
- Year list reaches at least 2090.
- Selecting month → year → day works on a 384px-wide mobile viewport without overflow.
