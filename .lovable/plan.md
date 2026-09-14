# Survival Mode: one list, smarter next action, working reduced day

## 1. Next action and the protocol list share one state
The featured "Next action" card and the list below become one source of truth. Marking the featured action done ticks the matching list item, and the card moves on to the following item. Any item in the list can be tapped directly to mark it done, in any order, and if it happens to be the featured one, the card advances too. The counter and progress bar reflect the same set.

## 2. Time-of-day aware next action
The featured action is chosen by the current local time rather than plain list order:
- Morning to late afternoon: daylight, movement, and food/water items are surfaced first.
- Midday to afternoon: the bounded work block.
- Before roughly 5pm: "Close the day deliberately" is never featured; it stays visible in the list and can still be ticked manually.
- Evening: closing the day and the quiet pause take priority.
Anything already done is skipped. If every eligible item is done but later items remain, the card shows the next remaining one instead of going blank.

## 3. Reduced day actually reduces the day
Turning on "Reduced day" trims the protocol to the essentials: quiet pause, food and water, and closing the day (plus daylight only if it is already part of the enabled set, capped at four items). A small inline line appears under the toggle: "Reduced day: showing your essentials only." Completions made earlier in the day are kept, not erased, and turning the toggle off restores the full list.

## 4. One-tap Survival Mode from the Workspace
The Survival Mode shield in the workspace header becomes persistent at every screen size (today it is hidden on larger screens, where only the sidebar button shows). It keeps its label/tooltip so it is obvious, and the existing sidebar and mobile-drawer entries stay.

## 5. Disclaimer becomes a top banner
"General guidance only. Adapt this protocol for your health, ability, responsibilities, and professional advice." moves into a small, quiet persistent banner just under the page heading on the Survival pages, replacing the footer-position note. The stronger "reduce demands / contact someone" message still appears in place when a check-in indicates concern.

## Style
No ranks, points, streaks, AI copy, or new colors. Same monochrome minimal styling, existing components and spacing.

## Technical notes
- All changes are in `src/components/survival/SurvivalMode.tsx` plus the header button visibility in `src/components/life/AppShell.tsx`. No data model or storage change; completion still writes to `SurvivalDay.completedRuleIds` via `toggleSurvivalRule`.
- Add a small pure helper in the component file: given enabled rules, completed ids, reduced-day flag, and an hour, return the ordered visible list and the featured rule. Time is read once per render from `new Date().getHours()` and the essential set is matched on the default rule ids with a category fallback for custom rules.
- Split the safety note into a persistent `GuidanceBanner` rendered by `PageIntro` consumers and keep the conditional concern message as today's `SafetyNote`.
