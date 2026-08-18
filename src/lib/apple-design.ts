/**
 * Apple Design fluid interface helpers
 *
 * Translated from Apple's "Designing Fluid Interfaces" (WWDC 2018) principles
 * for the web. Use these when building gesture-driven UI, drag/swipe/sheet
 * interactions, momentum, and interruptible transitions.
 *
 * Core idea: motion starts from the current on-screen value, inherits the
 * user's velocity, projects momentum forward, and can be grabbed/reversed
 * at any instant. Springs make this natural because they are interruptible
 * and velocity-aware.
 *
 * @see the apple-design skill / WWDC Designing Fluid Interfaces
 */

/** Apple-style exponential projection for flick landing points.
 *  Use the projected endpoint, then snap to nearest target, then hand off
 *  velocity to a spring. Not the physics-textbook v²/(2a) form.
 */
export function project(
  initialVelocity: number /* px/s */,
  decelerationRate = 0.998,
): number {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}

/** Soft boundary resistance. Further past the edge → less follow (real things
 *  slow before they stop). constant ~0.55 matches common iOS rubber-banding.
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Relative velocity for spring APIs that want velocity normalized by remaining distance. */
export function relativeVelocity(
  gestureVelocity: number,
  currentValue: number,
  targetValue: number,
): number {
  const remaining = targetValue - currentValue;
  if (Math.abs(remaining) < 1e-6) return 0;
  return gestureVelocity / remaining;
}

/** Designer-friendly spring defaults matching Apple shipping values. */
export const appleSprings = {
  /** Critically damped default — graceful, no overshoot. Most UI. */
  default: { damping: 1.0, response: 0.4 },
  /** Slight bounce for momentum-driven (flick, throw, drawer). */
  momentum: { damping: 0.8, response: 0.35 },
  /** Snappier drawer / sheet. */
  sheet: { damping: 0.8, response: 0.3 },
  /** Rotation / secondary. */
  rotation: { damping: 0.8, response: 0.4 },
} as const;

/** Map Apple damping+response → Motion / Framer Motion bounce + duration.
 *  bounce ≈ 1 - dampingRatio (approx). duration ≈ response.
 */
export function toMotionSpring(opts: { damping: number; response: number }) {
  return {
    type: "spring" as const,
    bounce: Math.max(0, 1 - opts.damping),
    duration: opts.response,
  };
}

/** Quick checklist for any new gesture / transition:
 *  1. Respond on pointer-down (not release)
 *  2. Track 1:1 + respect grab offset + setPointerCapture
 *  3. Always animate from presentation (live) value
 *  4. Hand off release velocity to the settling spring
 *  5. Project momentum for landing point, then snap
 *  6. Rubber-band at edges, never hard-stop
 *  7. Keep input interruptible the whole time
 *  8. Honor prefers-reduced-motion (cross-fade instead of spring/slide)
 */
export const fluidChecklist = [
  "Respond on pointer-down",
  "1:1 tracking + grab offset + pointer capture",
  "Animate from presentation value",
  "Velocity handoff on release",
  "Project then snap",
  "Rubber-band boundaries",
  "Interruptible",
  "Reduced motion",
] as const;
