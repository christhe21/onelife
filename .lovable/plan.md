## Goal

Get rid of the OS-native color/time/date pickers (screenshots show Android's color dialog and clock time picker) and replace every `<Input type="color|time|date">` in the app with custom-built, theme-aware components that render inside our own UI so the experience is identical across web, mobile browser, and the Android WebView.

## What to build

Three new reusable components under `src/components/ui/pickers/`:

1. **`ColorPicker.tsx`** — trigger button showing the current swatch; opens a `Popover` with:
   - A curated palette grid (12–16 tokens matching our design system).
   - A "Custom" section with H/S/L sliders + hex input.
   - Live preview + Set / Cancel.

2. **`TimePicker.tsx`** — trigger button (`HH:MM`) opens a `Popover` with:
   - Two scrollable wheel columns (hours 00–23, minutes in 5-min steps) plus a free-type `HH:MM` field.
   - AM/PM label derived from 24h value; still stores `HH:MM` 24h string so existing consumers don't change.

3. **`DatePicker.tsx`** — thin wrapper over the existing shadcn `Calendar` (`src/components/ui/calendar.tsx`) inside a `Popover`. Trigger shows the formatted date; value stays a `YYYY-MM-DD` string so callers don't change. Respects `min` / `max` props for the goal-window clamping we already do.

All three:
- Use design tokens only (no hardcoded colors).
- Accept the same `value` / `onChange` shape their current `<Input>` uses, so swapping is a one-line change per call site.
- Work inside `Dialog`s (add `pointer-events-auto` on the calendar wrapper per project rule).

## Call sites to migrate

- **Color** (`type="color"`): `Skills.tsx` (2).
- **Time** (`type="time"`): `AddToScheduleDialog.tsx` (2), `SubtaskFormDialog.tsx` (2), `CreateGoalWizard.tsx` (1).
- **Date** (`type="date"`): `Goals.tsx` (3), `Tasks.tsx` (4), `NewTaskWizard.tsx` (3), `NewGoalWizard.tsx` (3), `CreateGoalWizard.tsx` (4), `SubtaskFormDialog.tsx` (1), `Onboarding.tsx` (3), `OnboardingWizard.tsx` (1).

Each replacement preserves the existing `min`/`max` constraints and value format so no data-layer changes are needed.

## Out of scope

- No changes to data model, scheduling logic, or Android bridge.
- Native Android date/time system dialogs (only invoked from JS `<input>`s) disappear automatically once these inputs are replaced.
