# Rank & Points — Phase 1 (data layer only)

Goal: persist lifetime points, award them exactly once when something is first completed, and derive the military rank from the total. No UI in this phase.

## Approach: one reconciliation pass, not per-toggle hooks

Completion happens through many paths today — `toggleTask`, `toggleSubtask`, `toggleSubGoal` (which cascades tasks + subtasks closed), `updateGoal({ status: "completed" })`, and the auto-complete effect that closes milestones/goals when their tasks finish. Wiring award logic into each of those would duplicate code and still miss cascades.

Instead, a single effect watches `goals` + `tasks` after every change and awards points for any completed item whose id is not yet in the ledger. Every path is covered automatically, and cascades cannot double-count.

## Data model changes (`src/lib/app-data.tsx`)

Add to `AppData` / the persisted snapshot:

- `totalPoints?: number` — lifetime accumulated points
- `awardedPoints?: Record<string, number>` — ledger of item id to points already granted

Both optional, so existing localStorage snapshots, cloud snapshots, and imported JSON files load unchanged (`normalizeAppData` defaults them to `0` / `{}`). They are added to: the save effect, the cloud load/seed, `exportJSON`, `importJSON`, and `appendJSON` (append sums totals and merges ledgers).

No `currentRank` field is stored — rank is derived with the existing `getOverallRank(totalPoints)`.

## Awarding rules

Points come from the values already used in `rank.ts`:

| Item | Points |
| --- | --- |
| Goal completed | 100 |
| Sub-goal / milestone done | 50 |
| Task done | `calculateItemPoints(spentHours)` (10–20) |
| Sub-task done | `calculateItemPoints(spentHours)` (10–20) |

Rules:

- Award once per item id, ever. Ledger entries are never removed, so un-checking an item does not subtract points and re-checking does not grant them again.
- Deleting an item leaves its ledger entry in place (earned points stay earned); a small prune keeps the ledger from growing unbounded only for ids that were never awarded.
- Recurring tasks that "bump" instead of completing award nothing, since they never flip to `done`.

## Rank exposure

The context gains read-only values so Phase 3 can render them with no further data work:

- `totalPoints: number`
- `rank: string` — memoised `getOverallRank(totalPoints)`

## Backfill for existing users

On first load with no `totalPoints` stored, the reconciliation pass naturally awards for everything already marked complete, producing a correct starting total rather than zero.

## Tests

Extend `src/lib/__tests__/rank.test.ts` (or a new `points.test.ts`) with pure-function coverage of the award reducer:

- completing an item adds the right points
- toggling off then on again does not double-count
- a milestone cascade that closes several tasks awards each of them once
- ledger + total round-trip through export/import
