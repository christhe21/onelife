# Feedback pass: simplify, tighten, clarify

Acting on the review notes. Six changes, ordered by impact.

## 1. Settings clean-up
- Text size drops from four options to two: Default and Comfortable (a modest step up), and the pages that break at the larger size get fixed — headers become a text column plus a fixed side column so long titles truncate instead of overlapping.
- Group the remaining settings into three cards: Account & profile, Appearance (theme, text size, sound), Reminders. Anything niche or duplicated gets folded in or removed so the page reads as one short screen.

## 2. Data migration
- CSV and ICS import removed — too easy to get wrong.
- One clear "Export to spreadsheet" button producing an Excel file with sheets for goals, milestones, tasks and schedule.
- Full backup and restore (single file) stays, labelled plainly as "Backup / Restore".

## 3. Mind map becomes a structured tree
- Replace the radial layout with a top-down layered graph: Skill → Goal → Milestone → Task, each level on its own row, with tidy right-angle connectors and no overlaps.
- Deterministic spacing so AI-generated hierarchies stay readable at any size; collapse/expand per branch, pan and zoom retained.
- Horizontal scroll for wide levels; mobile keeps the same layout at a smaller scale.

## 4. Calendar colour coding
- Each event takes the colour of its skill/category, with a small legend above the grid and matching tints in month, week, day and agenda views.
- The existing workload shading stays but is softened so category colours read first.

## 5. Bucket list reframed as "Someday"
- Renamed and described as things you want to do with no fixed date.
- Adds a "Turn into a goal" action that carries the title and notes into the goal wizard, so items graduate instead of living in two places.
- Items with a target year show it as a soft horizon, not a deadline.

## 6. Navigation and headers
- Remove page headings and subtitles that repeat the selected menu item; the top bar keeps only brand, rank chip and icon actions.
- Settings, install and export move behind icons with tooltips rather than labelled rows.

## Not changing
- AI generation stays as an optional assist, not the default path — typed entry remains first-class everywhere, which matches the concern about token use.
- Completion sound stays as is.

## Technical notes
- Text size: reduce the size list in `Settings.tsx`, audit header rows in Dashboard, Goals, Tasks, Calendar and Overview for `min-w-0` / `truncate` / grid split.
- Export: generate `.xlsx` client-side (xlsx writer), drop CSV/ICS parsers from `ExportImport.tsx`, keep JSON snapshot round-trip.
- Mind map: replace the cone layout in `MindMapCanvas.tsx` with a layered tree pass (per-level y, subtree-width-based x, orthogonal edge paths); keep existing keyboard handling.
- Calendar: derive event colour from skill colour tokens; add legend component; adjust heatmap opacity in `CalendarView.tsx` and `WeekGrid.tsx`.
- Bucket: rename tab and copy in `AppShell.tsx` / `BucketList.tsx`; add promote-to-goal handoff into the goal wizard.
