## Goal
Fix the Development Radar in `src/components/life/SkillsRadar.tsx` so labels don't overlap the numeric scale, the polygon visibly radiates from the true center, the chart uses more of the card, and the fill is a bold colorful gradient instead of the current pinkish blend.

## Changes (all in `SkillsRadar.tsx`)

### 1. Label overlap with radial axis numbers
- Hide the numeric radius ticks entirely (`PolarRadiusAxis` with `tick={false}`, `axisLine={false}`) — they collide with the top "Life" label and add no value since the tooltip already shows %.
- Keep grid rings for scale reference.

### 2. Data misalignment / off-center polygon
- The visual "shift" is caused by `outerRadius="78%"` combined with default Recharts margins that aren't symmetric once long labels render. Fix by:
  - Setting explicit symmetric `margin={{ top: 24, right: 48, bottom: 24, left: 48 }}` on `RadarChart`.
  - Reducing `outerRadius` to a numeric value (e.g. `"70%"`) so labels fit inside the SVG without pushing the polygon off-center.
  - Adding `cx="50%" cy="50%"` explicitly.

### 3. Padding / wasted space
- Increase chart container height from `h-72` to `h-80 sm:h-96`.
- Use `tickFormatter` on `PolarAngleAxis` to shorten long labels (e.g. "Technical Skills" → "Technical") and add `tick={{ fontSize: 12 }}` with a small `dy` to space labels off the rings.

### 4. Colorful gradient + solid color treatment
- Replace the muted primary→purple→pink radial gradient with a vivid conic-style multi-stop linear gradient that reads as "colorful":
  - Stops: `#06b6d4` (cyan) → `#8b5cf6` (violet) → `#ec4899` (pink) → `#f59e0b` (amber) → `#10b981` (emerald).
- Add a solid stroke (`stroke="hsl(var(--primary))"`, `strokeWidth={2}`) and dots (`dot={{ r: 3, fill: "hsl(var(--primary))" }}`) so the shape reads crisply over the gradient fill.
- Bump fill opacity to ~0.75 for saturation.

## Out of scope
- No changes to data calculation, skill list, tooltip content, or other components.
- No theme-token additions; gradient stops live inline in the SVG `<defs>` (chart-only visual, not a reusable token).
