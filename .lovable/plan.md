# Horizontal rank ladder with tier descriptions

Turn the rank ladder modal into a side-scrolling strip where each rank is its own card, and give every rank a one-line meaning.

## 1. Rank descriptions

Add a short one-sentence description to each tier (kept next to `RANK_TIERS` in `src/lib/rank.ts`, as a display-only lookup — no threshold or point-logic changes):

- Beginner — You've just started; every point counts from here.
- Intermediate — You're building steady habits and finishing what you start.
- Advanced — Your progress is consistent and compounding across skills.
- Professional — You work at a reliable, high standard without needing motivation.
- Master — Deep skill and disciplined execution are now your default.
- Grandmaster — You operate far above average and set your own bar.
- Epic — Rare territory; your output speaks for itself.
- Legendary — Sustained excellence across years of effort.
- One — The top rank; nothing above this.

## 2. Ladder layout

`src/components/life/RankLadder.tsx` becomes a horizontal strip:

- One card per tier laid out left to right in a scroll container with snap points, so a card settles in view as you swipe.
- Each card shows: tier number (or check when achieved), rank name, the point threshold, the one-line description, and either "You are here" with the exact point total, or the points still needed.
- Current tier card is highlighted (accent border/background); passed tiers are muted with a check; the final tier "One" keeps the crown/top-rank marker.
- Card width is sized so at 384px roughly one card fills the width with a peek of the next one, hinting the strip scrolls.

## 3. Modal

`src/components/life/RankLadderDialog.tsx`:

- Body becomes horizontally scrollable instead of vertical; no vertical scrolling of the ladder itself.
- On open, the current tier card scrolls into view horizontally and centers.
- Small left/right arrow affordances plus a dot/position indicator under the strip so it's obvious you can scroll sideways.
- Keeps the existing title, description, and close button.

## Technical notes

- Display-only: no changes to points, thresholds, `RankCard`, or rank progress logic.
- Scroll-into-view switches to `inline: "center"`, `block: "nearest"`.
- Settings and Dashboard triggers are unchanged; they share the same dialog.
