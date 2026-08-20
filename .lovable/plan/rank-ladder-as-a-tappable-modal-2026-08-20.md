# Rank ladder as a tappable modal

Replace the dropdown ladder with a modal that opens when you tap your current rank.

## 1. Dashboard

- Remove the collapsible "Rank ladder" section under the rank card.
- Make the `RankCard` itself tappable (button semantics, keyboard accessible, subtle hover/press state plus a small "View ranks" hint). Tapping opens the rank ladder modal.

## 2. Rank ladder modal

- A dialog containing the existing `RankLadder`, titled "Rank ladder".
- Ladder is a single vertical strip: one full-width row per tier, stacked top to bottom, no horizontal layout or sideways scrolling. Rows shrink gracefully at 384px so nothing overflows the right edge.
- Body scrolls vertically (capped at roughly 70% of viewport height) so you can scroll up to the top rank "One".
- On open, the current tier row is scrolled into view and centered, keeping the "You are here" marker visible immediately.
- Explicit small close button in the top-right corner, plus the usual overlay/Escape close.

## 3. Settings

- The "Rank ladder" block in Profile & Rank uses the same modal: the current rank line becomes tappable and opens the same dialog instead of rendering the list inline.

## Technical notes

- New `src/components/life/RankLadderDialog.tsx` wrapping `RankLadder` in the shadcn `Dialog`, exporting a trigger-agnostic component so Dashboard and Settings share it.
- `RankLadder` itself keeps its current tier logic; only layout/overflow tweaks for narrow widths.
- Display-only: no changes to points, `RANK_TIERS`, or `RankCard` progress logic.
