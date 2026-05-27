## Scope

Four targeted UI fixes. No data model changes.

### 1. Mindmap — fullscreen, collapse/expand, polish (`MindMapCanvas.tsx`, `Overview.tsx`)

- **Fullscreen toggle**: add a `Maximize` button (top-right of the canvas) that promotes the canvas into a fixed-position overlay (`fixed inset-0 z-50 bg-background`). A `Minimize` button restores it. ESC also exits.
- **Collapse / expand controls**:
  - Each non-leaf node becomes interactive. Single-tap toggles whether its children render. Collapsed nodes get a small `+N` badge showing hidden child count; expanded nodes show no badge.
  - Header gets two utility buttons: **Collapse all** (only root → skills visible) and **Expand all** (full tree). Default state on first mount = skills expanded, goals collapsed (much cleaner first impression).
  - Track open state in a `Set<string>` of node ids; layout recomputes from the filtered tree so collapsed branches don't reserve angular space — siblings spread out naturally.
- **UI polish**:
  - Replace flat circles with subtle drop-shadow + 1px ring; root node gets a soft radial gradient using `--primary`.
  - Labels render inside a rounded pill (`rgba(background,0.85)` + 1px border) so text stays readable when nodes overlap.
  - Curved links (quadratic Bezier from parent toward child) instead of straight lines; stroke width tapers with depth.
  - Hover state on nodes: scale 1.05, raise opacity.
  - Floating toolbar (bottom-right): zoom in / zoom out / reset / fullscreen — grouped in one rounded card instead of stacked separate buttons.
  - Subtle dotted-grid background on the canvas for spatial reference while panning.

### 2. Goals — fit mobile + desktop bounds (`Goals.tsx`)

Current collapsed card overflows on 384px viewport (timeline bar + status badge + progress row don't wrap cleanly) and on desktop the `md:grid-cols-2` cards stretch awkwardly.

- Card body uses `min-w-0` + `truncate` on title; status badge moves under title on `<sm` to prevent horizontal overflow.
- Timeline + progress bars get `w-full` with explicit `overflow-hidden` containers.
- Switch grid to `md:grid-cols-2 xl:grid-cols-3` so wide desktops don't stretch cards to 700px+.
- Reduce collapsed card padding from `p-4` → `p-3` for tighter mobile fit.
- Chevron + skill dot + title row uses `flex min-w-0` so long titles ellipsize instead of pushing layout.

### 3. Tasks — more breathing room (`Tasks.tsx`)

Current rows are flush; user wants the compact look kept but with more space.

- Row vertical padding `py-2` → `py-3`; gap between rows `space-y-1` → `space-y-2`.
- Inner meta line (`• Due • Goal • subs`) gets `mt-1.5` and `text-xs` with slightly muted color, spaced via `gap-3` instead of bullets jammed together.
- Left priority border thickness `border-l-2` → `border-l-[3px]` and add `pl-3` so text doesn't kiss the border.
- Checkbox gets a `mr-1` and aligns to first text line (not center) so multi-line titles look right.
- Sub-tasks panel: each sub-row `py-2`, schedule fields stack on mobile (`flex-col sm:flex-row`).
- Add-task floating bar: `p-3` and lift it slightly with a soft shadow.

### 4. Life canvas — UX review + redesign decision

Current `LifeTimeline` is a single horizontal strip of 80 year columns with goal pills overlaid. On 384px it's a sideways-scroll wall of tiny text; on desktop it feels sparse and unreadable.

Recommended redesign (acting as UX/SME):

- **Decade-grouped rows** instead of one 80-column strip. Each decade is a labeled row (`0s 10s 20s … 70s`), 10 cells wide. Mobile shows all 8 rows stacked (no horizontal scroll); desktop shows 2 columns of 4 decades.
- **Today marker**: a vertical accent line in the current decade row + a small "You are here · age N" chip.
- **Goal pills**: positioned inside the decade row at their year offset, colored by skill, with tooltip on hover showing title + dates. Pills stack vertically inside a year cell when multiple goals share a year.
- **Past / future shading**: past decades get `opacity-60` and a muted bg; future decades use full color.
- **Share affordance**: keep an "Export image" button (uses existing browser canvas snapshot of the section).
- Keep the existing birth-year prompt and `setBirthYear` flow.

Will confirm this direction with the user via a single question before implementing — if they prefer to drop the Life canvas entirely or keep it as-is, we skip step 4.

---

## Technical notes

- All changes frontend-only. Files touched: `src/components/life/MindMapCanvas.tsx`, `src/components/life/Overview.tsx`, `src/components/life/Goals.tsx`, `src/components/life/Tasks.tsx`, `src/components/life/LifeTimeline.tsx`.
- No new dependencies. Fullscreen uses a fixed-position React portal-less overlay (component re-renders into a fixed wrapper when `isFullscreen` is true).
- Collapse state is local component state (not persisted) — resets on refresh, which is fine for an exploration view.
- Curved links: single `<path d="M x1 y1 Q (x1+x2)/2 y1 x2 y2" />` per link.
