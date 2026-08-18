# Phase 3 — Rank & Points UI

Surface the existing points/rank data in the app and make rank-ups feel like a moment. No changes to point calculation or the data model.

## 1. Rank thresholds helper (small, additive)

Add to `src/lib/rank.ts` (derived from the existing tiers, no new stored fields):

- `RANK_TIERS`: ordered list of `{ name, min }` — Recruit 0, Private 500, Corporal 2000, Sergeant 5000, Lieutenant 10000, Captain 20000, Major 35000, Colonel 60000, General 100000.
- `getRankProgress(totalPoints)` → `{ rank, index, nextRank, currentMin, nextMin, pointsIntoRank, pointsToNext, percent }`. At General: `nextRank = null`, `percent = 100`.
- `getOverallRank` is rewritten to read from `RANK_TIERS` so there is one source of truth; return values stay identical. Existing tests keep passing.

## 2. Rank card on the Dashboard

New `src/components/life/RankCard.tsx`, rendered at the top of `Dashboard.tsx` (above the hero stat grid, below the timeline):

- Rank insignia (chevron/star icon from lucide, sized by tier) + rank name as the headline.
- Total points, formatted with thousands separators.
- Progress bar (existing `Progress` component) toward the next rank, with `X / Y pts to <Next rank>` underneath; at General it shows a "Max rank" state instead.
- Uses existing card/semantic tokens only — no hardcoded colors. Single-column and readable at 384px wide.

## 3. Rank-up feedback

New hook `src/hooks/use-rank-up.ts`, mounted once in the app shell:

- Tracks the last seen rank index in `localStorage` (key `onelife:last-rank-index`), seeded on first run from the current rank so existing users are not falsely congratulated.
- When the derived rank index increases, fires:
  - a sonner toast: "Rank up — you are now a <Rank>" with the point total,
  - a confetti burst.
- Confetti: add a `celebrateRankUp()` export to `src/lib/celebrate.ts` that always fires the burst (theme-independent, still `disableForReducedMotion`), and plays the existing goal chime only when the Frieren-SFX condition already used by `celebrate()` is true. The existing `celebrate()` behaviour is untouched.

## 4. Lightweight rank/points display

- Small points chip in the app header (`AppShell.tsx`): rank name + point total, hidden on very narrow widths if space is tight; tapping it navigates to the dashboard.
- Skills view: keep as-is aside from nothing new — the skill titles already exist there.

## Technical notes

- All reads come from `useAppData()` (`totalPoints`, `rank`); nothing new is persisted except the "last seen rank" UI marker in localStorage.
- localStorage access is guarded for SSR (`typeof window`), and the hook only compares after mount to avoid hydration mismatches — safe in the Android WebView.
- Tests: extend `src/lib/__tests__/rank.test.ts` with `getRankProgress` cases (boundary values, max rank).
