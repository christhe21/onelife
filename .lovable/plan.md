## Scope

Four focused changes, all frontend / data-shape:

1. Tasks UI redesign (less bulky, mobile-first)
2. Goals & Sub-goals — collapsed by default, description hidden until expand
3. Mindmap "Map view" — draggable/pannable canvas
4. JSON template — richer example + new optional fields (progress, startDate, endDate, evidence)

---

### 1. Rebuild Tasks UI (`src/components/life/Tasks.tsx`)

Acting as UI expert: current card uses a 6-control row + always-visible badges + 4 icon buttons + separate subtasks panel. On a 384px viewport it wraps awkwardly and feels heavy.

New layout per task (single compact row):
```text
[ ✓ ]  Title here…                              ⋯
       • Due Mar 4   • Goal: Fitness   • 2/5 sub
```
- One row, two text lines max. Priority shown as a thin colored left border (red/amber/slate) instead of a pill — saves horizontal space.
- Trailing `⋯` opens a popover menu: Edit, Sub-tasks, Delete. Removes 3 always-visible icon buttons.
- Tap anywhere on the row body (not the checkbox) expands the inline sub-tasks panel.
- Overdue: red dot + red due text only (no full border-red card).
- "Add task" collapses to a single floating bar with Title only; advanced fields (date, priority, goal) appear in a popover via a `+ details` button. Keeps top of screen clean on mobile.
- Move the `Export schedule (.ics)` button into the page header next to the title, with a subtler `outline` style.

Sub-tasks panel: tightened to 1-line rows using small inputs; the h/wk + endDate move behind a "schedule" toggle per sub-task so the row is short by default.

### 2. Goals & Sub-goals — collapsed default (`src/components/life/Goals.tsx`)

- Default `expanded = false` (already the case) — but ALSO hide `description`, current activity, timeline labels, and sub-goal counts in the collapsed view. Only show: skill dot, title, status badge, progress bar, timeline bar.
- Description, current activity, sub-goal list, and quick-add task only render inside `expanded`.
- Tap the card body to expand (not just the chevron button) for easier mobile use.
- Grid stays `md:grid-cols-2`; collapsed cards become ~40% shorter so more fit on screen.

Outline taxonomy (Goals → Sub-goals → Tasks → Sub-tasks) is already the data model. No schema change needed; just clarify in the Overview legend ("Goals can skip Sub-goals and link Tasks directly").

### 3. Mindmap "Map view" (`src/components/life/Overview.tsx`)

Add a toggle button: `[ Tree ] [ Map ]` in the Overview card header.

- Tree = current accordion view.
- Map = new component `MindMapCanvas.tsx`:
  - Full-width canvas (~70vh tall) with pan via pointer-drag and pinch/wheel zoom.
  - Nodes laid out radially: central "You" → skill nodes (colored) → goal nodes → task nodes → sub-task leaves.
  - Pure SVG inside a `transform: translate/scale` wrapper. No new dependency.
  - Single-tap node = expand/collapse children. Long-press = inline rename (reuse existing `useLongPress`).
  - Legend stays at top.
  - Minimap / reset-view button bottom-right.

### 4. JSON template & import (`src/lib/app-data.tsx`)

Extend Task schema (all optional, backward-compatible):
- `progress?: number` (0–100) — partial completion when not fully done.
- `startDate?: string` — when user began.
- `endDate?: string` — actual completion date (separate from `dueDate`).
- `evidence?: string` — free-text "what they've done so far" / link to artifact.

Goal already has `startDate`, `targetDate`, `manualProgress`, `currentActivity` — keep as-is.

Update:
- `normalizeTask` to accept the new fields.
- `TEMPLATE_PAYLOAD` to include 2 example skills' worth of fully-populated goals/tasks/sub-tasks/bucket items showing every field, plus inline `_comments` per top-level key explaining the schema.
- `AI_SYSTEM_PROMPT` updated to mention new fields.
- Surface `progress` in the Task row (thin secondary bar under the title when 0 < progress < 100 and not done).
- Show `evidence` in the EditTaskDialog as a textarea.

Upload flow unchanged — existing imports still work because all new fields are optional.

---

## Technical notes

- No backend / no new dependencies.
- All edits in: `src/components/life/Tasks.tsx`, `src/components/life/Goals.tsx`, `src/components/life/Overview.tsx`, `src/lib/app-data.tsx`. New file: `src/components/life/MindMapCanvas.tsx`.
- Pan/zoom uses pointer events + a `transform` style; no canvas/WebGL. Works on touch.
- Keep all colors via semantic tokens / existing skill colors.
