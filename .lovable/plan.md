## 1. Mindmap (`src/components/life/MindMapCanvas.tsx`)

- **Remove borders**: drop `stroke` from every shape (set `strokeWidth: 0`); rely on a soft drop-shadow for separation. Hover state becomes a slight scale/shadow bump instead of a thicker stroke.
- **Brighter palette**: swap the cool-mist palette for a brighter, more saturated set, e.g.
  `#A5B4FC` (indigo), `#7DD3FC` (sky), `#5EEAD4` (teal), `#C4B5FD` (violet), `#FCA5A5` (rose), `#FDE68A` (amber), `#86EFAC` (green), `#F0ABFC` (fuchsia). Root gets a stronger tint.
- **Non-overlap layout via a deterministic formula**: replace the current `RING.*` constants and per-level "sector half" math with a per-node radius computed from the actual subtree size. For every node:
  1. Compute its angular footprint: `leafCount(node)` recursively (subtask=1; collapsed=1).
  2. Allocate angles proportionally to leaf count (Reingold–Tilford-style radial layout). For each parent with subtree size `T`, each child `c` gets sweep `2π * leafCount(c)/T` (or sector size at deeper levels).
  3. Ring radius per depth grows with the max node box at that depth:
     `R(d) = R(d-1) + maxHalfH(d-1) + maxHalfH(d) + GAP`, where `GAP = 60`.
  4. Tangential spacing constraint: required arc length per child = `2 * halfW(c) + GAP`. If `R(d) * sweep < required`, push the ring outward by `required / sweep` (so siblings never overlap even when many short children share a small sector).
     This guarantees no two siblings collide at the same depth, and no parent collides with its children.
- Keep drag-to-rearrange, but the auto layout (seed positions) becomes the formula above instead of the current fixed `RING`.

## 2. Goals section (`src/components/life/Goals.tsx`, `src/lib/app-data.tsx`)

- **Remove the milestone progress bar** (`SkillProgress` line `<SkillProgress value={pct} … />` in `GoalCard`). Keep only the `Timeline` component beneath the header. Milestone count badge stays in the header chip row.
- **UI specialist sanity check on the timeline**: keep the horizontal track + dots + "today" pin (that pattern is the conventional best fit for a date-bounded goal with milestones — superior to a Gantt for a card). Tighten spacing now that the bar is gone: increase track height from `h-3` to `h-4`, give the start/end date labels a bit more contrast, and label dots with a small tooltip on hover (lead-in to item 3).
- **Cascading close** in `app-data.tsx`:
  - `toggleSubGoal`: when a sub-goal flips to `done: true`, also mark every task with `goalId == goal.id` that is tagged to this milestone as `done`, and all of their subtasks `done`. (Today tasks are linked to a goal, not directly to a sub-goal — so the scope is "all tasks under this goal whose `dueDate <= subGoal.targetDate` and still open". We'll add an explicit `subGoalId?: string` field to `Task` so the cascade is precise; existing tasks keep working because the field is optional.)
  - `toggleTask`: when a task flips to `done: true`, set every subtask to `done: true` in the same update. When it flips back to `done: false`, leave subtasks alone (only close cascades, never auto-reopen).
  - Hours-spent accumulation that already runs on `toggleTask` / `toggleSubtask` keeps working; cascaded completions also bump `spentHours` once per item.

## 3. In-progress promotion + timeline color + milestone popover

- **Auto-promote** in `app-data.tsx`:
  - `toggleTask` and `toggleSubtask`: if the parent goal's `status === "not_started"`, set it to `"in_progress"` the first time _any_ task or subtask under it is toggled (done or in-flight). The existing `promoteGoal` helper already exists for the "first completion" case — broaden it to also fire when an item is first checked or when a scheduled block is created.
  - Same when a sub-goal is toggled.
- **Timeline color reflects status** (`Goals.tsx` `Timeline`):
  - `not_started` → grey track + grey fill (`bg-muted` / `oklch(0.75 0.02 250)`), no glow.
  - `in_progress` → bright green gradient (`oklch(0.7 0.18 150) → oklch(0.82 0.16 150)`) with the existing glow. Overrides "due soon / overdue" tinting only when status is `not_started`; if `in_progress` we keep green but layer the overdue/due-soon pill on top.
  - `completed` → solid muted green, 100% fill.
- **Milestone dot popover**: convert each dot in `Timeline` from a bare `<div title>` into a Radix Popover (or a controlled lightweight tooltip) that opens on click, showing `{title} · {targetDate} · {done ? "Done" : "Open"}`. Auto-dismiss after 3.5s via `setTimeout`, and also dismiss on outside click (Popover handles outside-click natively). Same treatment for the "you are here" / decade dots in `LifeTimeline.tsx` so milestones in the life canvas behave identically.

## Technical notes

- New field: `Task.subGoalId?: string` (optional, normalized in `normalizeTask`, included in `TEMPLATE_PAYLOAD` and `AI_SYSTEM_PROMPT`). Goals UI gets a small "milestone" select on the task quick-add so the cascade has something to bite on; absent that, the cascade falls back to all open tasks under the goal.
- Mindmap layout formula is pure (no state); seeds are recomputed in the existing `useMemo`. Stored user-dragged positions in `localStorage` still win over computed seeds.
- No backend / data-model migrations beyond the optional `subGoalId` field; existing saved JSON keeps loading.

## Files touched

- `src/components/life/MindMapCanvas.tsx` — borders, palette, radial layout formula.
- `src/components/life/Goals.tsx` — remove progress bar, status-driven timeline color, milestone popover, optional milestone select on task add.
- `src/components/life/LifeTimeline.tsx` — dot popover parity.
- `src/lib/app-data.tsx` — cascading close in `toggleSubGoal` / `toggleTask`, broader auto-promotion in `toggleTask` / `toggleSubtask`, `Task.subGoalId` field + normalizer + template/system-prompt updates.
