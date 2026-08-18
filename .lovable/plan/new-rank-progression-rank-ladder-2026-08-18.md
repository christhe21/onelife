# New Rank Progression + Rank Ladder

Switch the overall rank system from military ranks to the new progression names, and add a full ladder view so users can see every tier, its threshold, and where they sit.

## 1. New rank tiers

In `src/lib/rank.ts`, replace `RANK_TIERS` with:

Beginner 0, Intermediate 500, Advanced 2000, Professional 5000, Master 10000, Grandmaster 20000, Epic 35000, Legendary 60000, One 100000.

Thresholds are unchanged from today's ladder — only the names change. `getRankIndex`, `getOverallRank`, and `getRankProgress` keep working as-is since they already read from `RANK_TIERS`.

Note: `getSkillTitle` (per-skill titles: Beginner/Intermediate/Enthusiast/Professional/Master/Legend) stays untouched — it is a separate scale.

## 2. Rank Ladder component

New `src/components/life/RankLadder.tsx` — display only, no point-logic changes:

- One row per tier, in order, showing tier number, name, and the exact point threshold (`0`, `500`, ..., `100,000`), formatted with thousands separators.
- The user's current tier is highlighted (accent border/background) with a "You are here" marker and their exact point total.
- Tiers already passed are shown as achieved (check icon, muted); future tiers show the points still needed to reach them.
- The final tier "One" is labelled as the top rank.
- Uses existing card/semantic tokens only; readable single-column at 384px.

## 3. Where it appears

- Dashboard: a collapsible "Rank ladder" section directly under the existing `RankCard`, collapsed by default so the dashboard stays compact.
- Settings: inside the existing "Profile & Rank" card, below the current rank line.

## 4. Test updates

`src/lib/__tests__/rank.test.ts` — update the expected names in the `getOverallRank` and `getRankProgress` cases to the new progression names. Thresholds/assertions otherwise unchanged.

## Technical notes

- No changes to point calculation, `reconcilePoints`, the ledger, or `RankCard` progress logic.
- Existing rank-up celebration (`use-rank-up.ts`) keeps working; it compares tier indexes, which are unchanged, so no user will get a false rank-up from the rename.
