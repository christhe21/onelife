# Advanced recurrence for tasks and subtasks

Add richer repeat rules (weekdays, weekends, bi-weekly, custom days, end conditions) without breaking the existing simple `recurrence` enum.

## 1. Data model (additive, backward compatible)

Keep `recurrence?: Recurrence` exactly as-is on `Task` and `SubTask`. Add an optional sibling field:

```ts
interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;              // 1 = every, 2 = bi-weekly
  byWeekday?: number[];          // 0=Sun..6=Sat, weekly only
  end: { type: "never" } | { type: "count"; count: number } | { type: "until"; date: string };
}
recurrenceRule?: RecurrenceRule;
```

Rules in a new `src/lib/recurrence.ts`:

- `resolveRule(task)` — returns the effective rule: `recurrenceRule` if present, otherwise derived from the legacy enum (`daily` → freq daily/interval 1/never, etc.), `null` for `none`.
- `ruleToLegacy(rule)` — keeps `recurrence` in sync when a rule is set, so all existing code paths (`Tasks.tsx` badges, completion bumping in `app-data.tsx`, marketplace JSON) keep working unchanged.
- `describeRule(rule)` — human summary ("Every weekday until Dec 31, 2026").
- `expandRule(rule, start, end, horizonStart, horizonEnd)` — generates occurrence start/end pairs, honouring interval, weekday set, and the end condition, with a hard safety cap.
- Presets: Every day, Weekdays (Mon–Fri), Weekends, Weekly on <day>, Bi-weekly, Monthly, Yearly, Custom days.

`normalizeTask` / `normalizeSubtask` in `app-data.tsx` validate and default `recurrenceRule` (drop malformed values), so old snapshots load untouched.

## 2. Shared recurrence editor UI

New `src/components/life/RecurrenceEditor.tsx`: preset chips, a 7-day multi-select (S M T W T F S toggle row) shown for weekly/custom, an interval stepper for bi-weekly/custom, and end-condition controls (Never / After N times / On date, using the existing `DatePicker`). Compact, touch-sized targets, single column on mobile.

Wired into:
- `NewTaskWizard` — replaces the current "daily" checkbox with "Repeats" using the editor; a repeating task still links to a goal directly and skips subtasks (existing rule preserved).
- `SubtaskFormDialog` — optional repeat section.
- `CreateGoalWizard` / `NewGoalWizard` task+subtask rows — replaces the plain recurrence select.
- `Tasks.tsx` edit dialog and the event details/edit dialog in `CalendarView.tsx` — same editor, plus the `describeRule` summary shown on badges.

## 3. Calendar projection

Rewrite `getProjectedEvents` in `CalendarView.tsx` to delegate to `expandRule` from the new module (legacy enum flows through `resolveRule`, so simple recurrence behaves as today). Projection stays bounded to a horizon window and each instance keeps a stable id (`<baseId>#<occurrenceISO>`), so Month/Week/Day/Agenda, drag-reschedule, conflict detection, and the details dialog continue to act on individual instances exactly as they do now.

## 4. .ics export

`src/lib/calendar-export.ts` emits a full RRULE from the effective rule: `FREQ`, `INTERVAL`, `BYDAY` (weekday list), and `COUNT` or `UNTIL`. Tasks with only the legacy enum still emit the plain `FREQ=` line they do today.

## 5. Tests

New `src/lib/__tests__/recurrence.test.ts`: legacy enum → rule mapping, weekday-only and weekend expansion, bi-weekly interval, `count` and `until` end conditions, horizon clipping, and RRULE string generation.

## Notes

- No changes to points, goals, or scheduling logic beyond reading the effective rule.
- Completion-bump logic for recurring tasks in `app-data.tsx` advances to the next occurrence from the rule instead of a fixed period.
- All new UI uses existing design-system components; verified at 384px width.
