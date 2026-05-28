# Mindmap: Hand-drawn Redesign + Drag + Hover Fix

## Visual overhaul (`MindMapCanvas.tsx`)

- Load Google Font **Patrick Hand** (headings) and **Caveat** (root) via `<link>` injected once on mount; apply via inline `font-family` on SVG `<text>` so it doesn't leak into the rest of the app.
- New pastel palette per node-kind (paper bg `#fdf8f0`, mint `#bfe3d4`, peach `#f7c9a8`, coral `#f3a9a0`, lilac `#cdb8f0`); rotate through palette per skill instead of using skill.color, but keep skill.color as a thin stroke for identity.
- Node shapes by depth:
  - root → rounded rectangle "MIND MAP" style, lilac fill
  - skill → rounded square (rx 18)
  - goal → ellipse pill
  - task → small rounded rect
  - subtask → small ellipse
- Connectors: dark green (`#2d3f2a`) hand-drawn arrows. Replace Bezier with slightly wavy quadratic path + arrowhead `<marker>` at end. Vary curl direction by index for organic feel.
- Add subtle paper-texture background (CSS radial-gradient noise) instead of dotted grid.
- Label rendered INSIDE the shape (not as a separate pill below) — matches the reference.

## Free-drag layout

- Replace radial auto-layout with: initial radial seed positions stored in a `Map<id, {x,y}>` state on first render.
- Per-node `onPointerDown` starts node-drag (stopPropagation so canvas pan doesn't trigger); updates that node's position in state on move.
- Canvas pan still works on empty space.
- Add "Auto-arrange" button in toolbar to reset positions to radial seed.
- Persist positions to localStorage keyed by node id so layout survives reload.

## Hover-jitter fix

Root cause: `className="transition-transform hover:scale-110"` on each `<g>` re-triggers SVG layout on every mouse enter/leave, and child `<text>` re-measures → shake.

Fix:
- Remove `hover:scale-110` entirely.
- Replace with a static `<circle>`/`<rect>` "halo" sibling that fades in via `opacity` on hover (CSS only, no transform).
- Add `pointer-events: visiblePainted` on shapes and `pointer-events: none` on labels so hover target is stable.
- Add `shape-rendering="geometricPrecision"` and `vector-effect="non-scaling-stroke"` to prevent stroke flicker during pan/zoom.

## Toolbar

Keep existing Collapse/Expand/Fullscreen/Zoom/Reset; add **Auto-arrange** (RotateCcw becomes "Reset view", new Shuffle icon for arrange).

## Out of scope

- No changes to data model, Overview tree view, or other components.
- Tree view in `Overview.tsx` stays as-is.

## Technical notes

- Fonts loaded with `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Patrick+Hand&display=swap">` appended to `document.head` inside a `useEffect`, guarded so we only append once.
- Drag state: `useRef` for active drag id + offset, `useState<Map>` for positions (immutable update on move — throttle via `requestAnimationFrame`).
- Arrow marker defined once in `<defs>`: `<marker id="arrow" ...><path d="M0,0 L8,4 L0,8 z" fill="#2d3f2a"/></marker>`, applied via `marker-end="url(#arrow)"` on each link path.
- localStorage key: `mindmap-positions-v1`.
