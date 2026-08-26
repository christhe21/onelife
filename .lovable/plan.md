# Keyboard accessibility pass (whole app)

Make every action in OneLife reachable and operable with a keyboard alone — no mouse required — across the marketing site and the workspace app. Findings below come from a code audit of `src/routes`, `src/components/marketing`, and `src/components/life`.

## 1. Skip links and landmarks

- Add a "Skip to content" link as the first focusable element in both `MarketingLayout` and `AppShell`, visually hidden until focused, jumping to `#main-content` on the existing `<main>`.
- Keeps current landmark structure (header / nav / main / footer) — no restructuring needed.

## 2. Click-only controls get real buttons

- Overview tree rows (`src/components/life/Overview.tsx`) currently expand/collapse via a plain `div onClick`, so keyboard users cannot open goals at all. Convert the row toggle to a real `<button>` with `aria-expanded`, keeping the same visuals.
- Sweep the rest of `src/components/life` for the same pattern and convert each to a button element rather than bolting on `role`/`onKeyDown`.

## 3. Keyboard alternatives for drag-only actions

Drag is currently the only way to move scheduled work.

- Calendar chips (`CalendarView.tsx`) and week-grid blocks (`WeekGrid.tsx`): make each chip focusable and add keyboard moves — arrow keys shift the block by one slot/day while focused, `Enter` opens the existing reschedule dialog, `Escape` cancels an in-progress keyboard move. Existing pointer drag stays untouched.
- Mind map (`MindMapCanvas.tsx`): make nodes focusable and tab-navigable, `Enter`/`Space` to expand/collapse, arrow keys to pan the canvas, and keep the existing zoom/reset toolbar buttons as the zoom path.
- Update the helper text under the calendar so it mentions the keyboard path alongside dragging.

## 4. Focus behaviour in custom overlays

- Product tour (`ProductTour.tsx`): add `aria-modal`, move focus into the tooltip/invite dialog on open, trap Tab inside it while visible, and restore focus to the previously focused element on dismiss. Escape already works and stays.
- Mind map fullscreen: same initial-focus + trap treatment; Escape already exits.

## 5. Visible focus everywhere

- Add a global `:focus-visible` fallback ring in `src/styles.css` so any control that forgets a Tailwind focus class still shows a ring.
- Fix the calendar day badge, which sets `outline-none` with no replacement ring.

## 6. Accessible names on icon-only buttons

Add `aria-label` to icon-only buttons currently relying on nothing or on `title` alone: `BucketList` (delete), `Tasks` (delete subtask, more-menu), `NewGoalWizard` (delete milestone/task/subtask), `NewTaskWizard` (edit/delete subtask), `AiInterview` (send), plus a sweep of remaining `size="icon"` buttons in `src/components/life`.

## 7. Rank ladder strip

`RankLadder.tsx` is a horizontal scroller with no focusable children, so off-screen tiers are unreachable. Make the strip a focusable scroll region with arrow-key scrolling (or focusable tier items), matching the dialog version's focus ring.

## 8. Marketing tabs polish

`ShotTabs` already uses real tab buttons; add roving tabindex plus Left/Right arrow navigation to match the ARIA tabs pattern.

## Verification

- Run the existing accessibility and component tests (`NewGoalWizard.a11y`, `Onboarding.a11y`, `ProductTour`).
- Drive a keyboard-only pass with Playwright: tab from page load through skip link, nav, calendar chip move, mind map node expand, tour open/close — capturing screenshots of focus rings in light and dark mode.

## Notes

Purely presentation and interaction layer: no data model, scheduling logic, or backend changes. Pointer and touch behaviour stays exactly as it is today.
