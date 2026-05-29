# Today view, onboarding flow, mindmap shape/typography polish

## 1. "Today" tab (new)

Add a new top-level tab between Dashboard and Overview in `src/components/life/AppShell.tsx` (`TabId` gets `"today"`; icon `CalendarCheck`). Wire into the tab switch in `src/routes/index.tsx`.

New component `src/components/life/Today.tsx`:

- **Header**: greeting with user name (from new `settings.userName`) + today's date + count of "due today / overdue / scheduled hours".
- **Section A — Due today & overdue** (top): list of tasks where `dueDate <= today && !done`, grouped by goal (goal title as section header, colored dot from skill). Each row: checkbox, title, priority chip, overdue badge if past. Tapping checkbox marks done (uses `updateTask`).
- **Section B — Time-blocked schedule**: a simple hour grid 6am–11pm. Tasks with `startDate === today` and an `endDate` render as blocks in their slot; unscheduled "due today" tasks appear in a side rail labeled "Unscheduled" and can be drag-assigned to an hour (sets `startDate`/`endDate` on the task). HTML5 drag-and-drop, no new deps.
- **Empty state**: "Nothing due today — pick something from Goals to focus on" with a button to jump to Goals.

Reuses existing `tasks`/`goals` from `useAppData()`; no schema change beyond storing `startDate`/`endDate` already on `Task`.

## 2. iPhone-style onboarding flow

A full-screen, step-by-step setup shown on first launch (when `settings.onboardedAt` is unset). Lives in new `src/components/life/Onboarding.tsx` and is rendered by `src/routes/index.tsx` *before* `AppShell` when not onboarded. The current `EmptyStateHero` "Start from a template" grid is removed from Dashboard and folded into step 4 here.

Steps (full screen each, progress dots at top, Back / Continue at bottom):

1. **Welcome** — brand mark, "Let's set up your life dashboard", Continue.
2. **Your name** — single text input, saves to `settings.userName` (new field on `Settings`).
3. **Pick your life areas** — multi-select chips of the default skills (Career, Health, Travel, Faith, Music, Creative, Financial, Social, Learning). Selected ones are kept; unselected are removed from `skills`. Travel/Faith/Music added via `addSkill` if missing.
4. **Pick a starter template (or skip)** — same template grid that used to live on the dashboard. Selecting one moves to step 5 pre-loaded; "Skip" jumps to step 5 with blank state.
5. **Your first goal** — title + target date inputs. If a template was picked in step 4, fields are pre-filled and editable. Saves via `addGoal`.
6. **Add sub-goals / milestones** — inline list editor under that goal. "Add milestone" row; each row title + optional date. Saves via `addSubGoal`. Can skip.
7. **Add first tasks** — inline list editor for tasks linked to the goal (title + due date + priority). Saves via `addTask` with `goalId`. Can skip.
8. **You're set** — summary card ("1 goal, N milestones, M tasks") + "Enter your dashboard" button. Sets `settings.onboardedAt = now()`.

Persistence: each step writes immediately so refresh mid-flow doesn't lose data. A small "Skip setup" link in the top-right at every step jumps to step 8 with whatever's entered.

`EmptyStateHero` is updated: the template grid is removed; only the "See a demo / Add a goal / Import JSON" CTAs remain (still shown on Dashboard when data is empty *after* onboarding, for users who skipped).

## 3. Mindmap UI polish (`src/components/life/MindMapCanvas.tsx`)

Logic stays as-is. Visual changes only:

- **Shape rules**:
  - **Center "Life (userName)" node** → ellipse, larger, bold.
  - **Goal nodes** → ellipse, sized to fit text (auto width based on measured label).
  - **Sub-goal, task, sub-task nodes** → parallelogram (`<polygon>` with ~12° skew), pastel fill matching current palette.
- **Text fitting**: measure label width with a hidden `<text>` ref (or canvas `measureText`), set shape width = `textWidth + paddingX*2`, height fixed per node type. No more text overflow.
- **Typography fix**: switch node labels from `Caveat` to `Patrick Hand` only (Caveat's thin strokes look "not properly filled" at small sizes). Increase `font-weight` to 700 and use `fill: hsl(var(--foreground))` instead of the current low-contrast color so text reads on every pastel fill. Add subtle `paint-order: stroke; stroke: white; stroke-width: 3px` halo so labels stay legible over connector lines.
- **Center node** uses user's name from `settings.userName` (falls back to "Life").
- Keep wavy connectors, drag, persistence, and the existing toolbar untouched.

## 4. Data model additions (`src/lib/app-data.tsx`)

Extend `Settings`:
```ts
interface Settings {
  birthYear?: number;
  userName?: string;
  onboardedAt?: string; // ISO timestamp
}
```
Add `updateSettings(patch)` helper if not already present. No migration needed (fields optional).

## 5. Sharing

Out of scope this round per your reply.

## Files touched

- new: `src/components/life/Today.tsx`
- new: `src/components/life/Onboarding.tsx`
- edit: `src/components/life/AppShell.tsx` (add Today tab)
- edit: `src/routes/index.tsx` (gate on `settings.onboardedAt`; add Today tab render)
- edit: `src/components/life/EmptyStateHero.tsx` (remove template grid)
- edit: `src/components/life/Dashboard.tsx` (no template grid; greeting uses userName)
- edit: `src/components/life/MindMapCanvas.tsx` (shapes, font, text fitting, center label)
- edit: `src/lib/app-data.tsx` (`Settings` fields, `updateSettings`)
