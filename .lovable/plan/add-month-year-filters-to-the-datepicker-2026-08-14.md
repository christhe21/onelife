# Add month/year filters to the DatePicker

## Goal

Upgrade the custom `DatePicker` so the calendar header becomes a month/year navigator: clicking the month shows a month list, and clicking the year shows a year list. This speeds up selecting far-away dates (e.g., November 2026) while staying within the allowed date range.

## Changes

### 1. Enable dropdown header in `DatePicker.tsx`

- Pass `captionLayout="dropdown"` to the internal `<Calendar />`.
- Compute and forward `fromYear` / `toYear` (and `fromMonth` / `toMonth` when `min`/`max` are provided):
  - If no `min`/`max` is set, default to a 40-year window centered around the current year (e.g., current year ± 20).
  - If `min` or `max` are provided, clamp the dropdown bounds to those years.
- Keep the existing `min`/`max` day-level disabling logic unchanged.

### 2. Polish the Calendar dropdown UX

- In `src/components/ui/calendar.tsx` ensure the dropdown styling classes are clean and theme-aware.
- Make the month/year dropdown selects fill the header width, use the current `--color-input` / `--color-border` tokens, and have legible text in both light and dark modes.
- If needed, slightly widen the DatePicker popover content so the dropdowns don't feel cramped.

### 3. Verify compatibility

- Ensure the change only affects the `DatePicker` usage; other consumers of `<Calendar />` keep the default `label` caption behavior.
- Check that the component still outputs the same `YYYY-MM-DD` string format.

## Acceptance

- Opening a `DatePicker` and clicking the month/year header reveals dropdowns for month and year.
- Selecting a year and month updates the calendar view to that month.
- Selecting a day still returns `YYYY-MM-DD` and closes the popover.
- `min` and `max` dates continue to disable out-of-range days.
- The component remains usable on mobile widths.
