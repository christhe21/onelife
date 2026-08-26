# Make the tutorial spotlight visible and animated

## What's wrong

The tour's spotlight (the dim overlay + ring around the item being explained) is drawn with color values written in the old `hsl(var(--token))` format, but this project's theme tokens are `oklch(...)` values. The browser throws those styles away, so the dim layer and the ring render as nothing — on desktop light mode you see no highlight at all.

## The fix

1. Rewrite the spotlight in `src/components/life/ProductTour.tsx` to use the project's semantic tokens correctly (Tailwind classes / `color-mix` on the oklch tokens) instead of `hsl(var(--…))`, so it renders in both light and dark mode.
2. Give the dim layer a real, theme-aware backdrop and keep the cutout perfectly aligned with the highlighted element's rounded corners.
3. Add attention motion around the highlighted target, identical in light and dark mode:
   - a soft pulsing ring that breathes outward from the element's edge (2s loop, primary token color),
   - a brief bright flash/scale-in on the ring when the step changes, so the eye is pulled to the new target,
   - the tooltip fades and slides in toward the target.
4. Contrast handling: use a stronger dim in light mode and a slightly lighter dim in dark mode (via token-based values), so the highlighted region always reads as the brightest thing on screen.
5. Respect `prefers-reduced-motion`: the pulse and slide are replaced by a static ring plus cross-fade.

## Technical notes

- New keyframes (`tour-pulse`, `tour-ring-in`) added to `src/styles.css` and applied through classes, no inline hardcoded colors.
- Spotlight surround panels get an actual background instead of relying only on a giant `box-shadow` spread, so the dim survives on all browsers.
- No changes to tour steps, targeting logic, or persistence flags; existing `ProductTour.test.tsx` behavior stays intact.
