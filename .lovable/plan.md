# Plan: Show milestones (sub-goals) in Mindmap & Tree views

## Problem

`Goal.subGoals[]` (milestones) exist in the data model but neither the **Tree view** (`Overview.tsx`) nor the **Map view** (`MindMapCanvas.tsx`) render them. The hierarchy currently jumps Skill → Goal → Tasks, hiding the milestone layer entirely.

## Target hierarchy

```text
Skill ─▶ Goal ─▶ Milestone ─▶ Task
                 └─▶ Task (unlinked to a milestone)
```

A task is associated with a milestone if it stores a milestone id (e.g. `task.subGoalId` / `task.milestoneId`). If no such field exists today, tasks remain directly under the goal — milestones still appear as siblings alongside an "Unassigned tasks" branch.

## 1. Tree view — `src/components/life/Overview.tsx`

In `SkillNode`, after rendering each goal row and before/instead of rendering its tasks directly:

- Render each `g.subGoals` item as a **milestone row** (flag/target icon, completed strikethrough, target date on right, expandable).
- Under each milestone, list tasks whose `subGoalId === milestone.id` (check task schema; fall back to all tasks under goal if no link field exists).
- Add an "Unassigned" milestone bucket showing tasks with no `subGoalId`.
- Add `openMilestones: Set<string>` state, mirroring `openGoals`.
- Reuse `EditableLabel` wired to a new `updateSubGoal(goalId, subId, patch)` (already exists in `app-data.tsx` as part of subgoal management — confirm and expose if needed).

Update the goal-row counter to read `g.subGoals.length + tasksByGoal(g.id).length` so users see the milestone count, not just tasks.

## 2. Map view — `src/components/life/MindMapCanvas.tsx`

Add a fourth node layer "milestone" between goal and task nodes:

- For each goal node, create child milestone nodes from `goal.subGoals`.
- Re-parent task nodes: if `task.subGoalId` matches a milestone, attach to that milestone; otherwise attach directly to the goal (or an "Unassigned" pseudo-node).
- Style milestones distinctly: smaller than goal, larger than task; use goal's skill color at ~50% opacity with a flag glyph; completed milestones get a check + reduced opacity.
- Update layout (radial / force) so the extra depth doesn't overlap — typically increase the per-level radius step or recursion depth in the existing layout function.
- Update the in-canvas legend to include "Milestone".

## 3. Task ↔ Milestone link (check first)

Before implementing, grep for `subGoalId` / `milestoneId` in `Task` interface (`app-data.tsx`). Two cases:

- **Field exists**: use it directly.
- **Field missing**: still render milestones as children of goals; place all tasks under the goal node. (No data-model change in this plan — adding the link is a separate feature.)

## Files touched

- `src/components/life/Overview.tsx` — add milestone layer, openMilestones state, render under each goal.
- `src/components/life/MindMapCanvas.tsx` — add milestone node type, re-parenting, layout/legend updates.
- `src/lib/app-data.tsx` — only if `updateSubGoal` patch helper isn't exposed (small addition).

No schema changes, no migrations.
