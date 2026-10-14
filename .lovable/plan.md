# Life Editor (replaces the Overview "Map" view)

A draw.io-style canvas where your real skills, goals, milestones and tasks appear as cards you can drag, connect and edit. Changes on the board update your data everywhere else.

## What you get
- **Canvas**: pan by dragging, scroll/pinch to zoom, zoom buttons, fit-to-screen, minimap, snap-to-grid.
- **Life cards**: every skill, goal, milestone and task appears as a coloured card (skill colour). Double-click to rename; side panel to edit details (dates, done, status).
- **Toolbar ("+ Add")**: add a Goal, Milestone, Task, or free Shape (box, circle, sticky note) and Text label.
- **Connectors**: drag from a card's handle to another card.
  - Task → Milestone, Milestone → Goal, Goal → Skill connections re-link the real data (respects the Task → Milestone → Goal hierarchy).
  - Invalid links (e.g. Task → Skill) are rejected with a short message.
  - Connections between free shapes/text are just drawings, labels allowed.
- **Delete** a card or connector with the Delete key or a toolbar button (real items ask for confirmation).
- **Auto-layout** button to tidy the board; your manual positions are remembered.
- Works in light/dark theme and on mobile (touch pan/pinch).
- Focus pillars still apply: dates set from the editor go through the same guarded actions.

## Technical details
- Use `@xyflow/react` (React Flow) inside a client-only lazy component, replacing `MindMapCanvas` in `Overview.tsx` map mode (Tree view unchanged).
- Custom node types: skill, goal, milestone, task, shape, text; custom edge with optional label.
- Edges between real items derived from data (`goal.skill`, `subGoals`, `task.subGoalId/goalId`); `onConnect` calls `updateGoal`, `updateTask` (subGoalId/goalId) via existing app-data actions; validation function per kind pair.
- New `editor` slice in the synced JSON snapshot: `{ positions, shapes, freeEdges }` with normalization — no new database table.
- Auto-layout via existing tidy-tree logic (dagre-like, top-down).
- Remove old `MindMapCanvas.tsx` once replaced; update product tour step targeting the map.
- Record rule in AGENTS.md: editor link changes must go through app-data actions.
- Verify with Playwright: add card, connect task to milestone, rename, reload persists.
