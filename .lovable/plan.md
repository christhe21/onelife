# Plan

## 1. Mindmap respects dark theme
`src/components/life/MindMapCanvas.tsx` currently hardcodes `const PAPER = "#fafbff"` and uses `rgba(0,0,0,0.025)` dot grid, so the canvas stays light in dark mode.

- Replace the inline `background` style with theme tokens: use `hsl(var(--card))` (or `--background`) as the base color and `hsl(var(--foreground) / 0.04)` for the dot grid.
- Remove the `PAPER` constant (or keep it only as a light-mode fallback inside a `useTheme`-aware value). Simpler path: build the gradient string from CSS variables so it auto-switches.
- Audit node/edge stroke colors in the same file for any hardcoded `#xxx` values that disappear on dark; swap to `hsl(var(--border))` / `hsl(var(--foreground))` as needed.

## 2. Goal Marketplace: search, tags, list view
File: `src/components/life/GoalMarketplace.tsx` (+ `src/lib/marketplace.ts`, JSON files).

- Add optional `tags: string[]` to `MarketplaceGoalTemplate` and populate each JSON file (`dsa-mastery`, `piano-basics`, `frontend-mastery`) with 3–6 relevant tags (e.g. `["interview","algorithms","coding"]`).
- Toolbar above the grid:
  - Search `Input` with icon — filters by title, description, creator, skillName, tags (case-insensitive).
  - Horizontally-scrolling tag chips built from the union of all template tags; clicking toggles a multi-select filter.
  - Grid/List `ToggleGroup` (icons: `LayoutGrid`, `List`).
- List view: a vertical stack of compact rows (badge + title + tags + creator + duration on one line, "View" / "Use" buttons on the right). Reuses the existing `TemplateDialog`.
- Render tag badges inside each card and inside the dialog header.
- Empty state when filters return nothing.

## 3a. Edit-task modal overflow on mobile
File: `src/components/life/Tasks.tsx`, `DialogContent className="max-w-md"`.

- Change to `className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto"` so it shrinks below 28rem viewports and scrolls internally.
- Audit the form body for any fixed-width children (e.g. `w-80`, long input rows in a non-wrapping flex) and switch to `w-full` / `flex-wrap` so nothing forces horizontal overflow.

## 3b. Remove auto-milestone quick-add in Goals
File: `src/components/life/Goals.tsx`, lines ~543–577.

- Delete the entire "Quick-add task linked to this goal" block (Label, Input, Add button, and the related `quickTask` state + setter at the top of the component).
- No replacement — task creation continues through `NewTaskWizard`, which lets the user pick the milestone explicitly.

## 4. Marketplace JSON: fully represent all template data
`MarketplaceGoalTemplate` and the three JSON files currently omit fields the live `Goal` model supports. Make the JSON the single source of truth so imports don't silently drop information.

- Extend `src/lib/marketplace.ts`:
  - `MarketplaceGoalTemplate`: add `tags?: string[]`, `coverEmoji?: string`, `difficulty?: "beginner"|"intermediate"|"advanced"`.
  - `MarketplaceSubGoal`: add optional `description?: string`.
  - `MarketplaceTask`: add optional `description?: string`, `notes?: string`.
  - `MarketplaceSubTask`: add optional `plannedHours?: number`, `priority?: "low"|"medium"|"high"`.
- Update the importer (wherever `onImport` consumes the template in `Goals.tsx`/`NewGoalWizard.tsx`) to pass these new fields through to `addGoal`/`addTask`/`addSubGoal`.
- Backfill the three existing JSON files (`dsa-mastery.json`, `piano-basics.json`, `frontend-mastery.json`) with `tags`, `difficulty`, `coverEmoji`, and add `description`/`plannedHours` where it makes sense so the on-screen cards/dialog look complete.

## Out of scope
- No changes to skills, dashboard, radar, Frieren ambience, or analytics.
- No new marketplace templates; just enrich existing ones.
- No backend changes — everything stays in local app data.
