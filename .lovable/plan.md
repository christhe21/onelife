## 1. Rotating quotes on every refresh

**File:** `src/lib/quotes.ts` (new) + `src/components/life/Today.tsx`

- Bundle a curated list (~40–60) of quotes shipped with the app, split into two pools:
  - **Famous authors** — growth/determination themed (Gandhi, Marcus Aurelius, Angelou, Mandela, Jobs, Goggins, Emerson, Rumi, Confucius, Roosevelt, etc.).
  - **Anime** — each entry has `text`, `character`, `anime` (Naruto, One Piece, AoT, HxH, FMA:B, Frieren, JJK, Demon Slayer, Vinland Saga, Mushishi, etc.).
- Export `getRandomQuote()` that picks one at random from the combined pool on each call.
- In `Today.tsx`, replace the hard-coded `QUOTE` / `FRIEREN_QUOTE` constants with a `useState(() => getRandomQuote())` so a new quote is chosen on every mount/refresh. Frieren theme biases the pick toward anime quotes (still random inside that pool).
- Render format:
  - Famous: `"…text…" — Author`
  - Anime: `"…text…" — Character, *Anime Name*`
- No network fetch — quotes are curated & bundled (reliable offline, no rate limits, no CORS). The plan calls these "quotes from the internet" in the sense that they are real quotes sourced from public quote collections, not AI-generated.

**Ask before build?** If you specifically want live fetching from a public quotes API (e.g. quotable.io) instead of a bundled list, say so — I'll swap in a fetch with the bundled list as fallback.

## 2. Mindmap visual tweaks

**File:** `src/components/life/MindMapCanvas.tsx`

- **Edge color:** change the connector stroke from black/near-black to a dark grey that adapts to theme. Use `hsl(var(--muted-foreground) / 0.55)` for light mode and slightly brighter in dark mode, so lines read as dark grey on light bg and light grey on dark bg (currently they're hard black). If you want a fixed grey regardless of theme, I'll use `#4b5563` (Tailwind slate-600) instead — tell me which.
- **Node label font:** switch the SVG `<text>` `font-family` from the default system stack to a friendlier sans. Default choice: **Google Sans / Product Sans** stack with graceful fallback:
  `"Google Sans", "Google Sans Text", "Open Sans", "Segoe UI", system-ui, sans-serif`.
  Google Sans isn't a free web font; if it's not installed locally it'll fall back to Open Sans. To guarantee it renders everywhere, I'll add an Open Sans `<link>` in `src/routes/__root.tsx` head (per project rule against remote `@import` in `styles.css`).
  If you prefer Comic Sans instead, I'll use `"Comic Sans MS", "Comic Neue", cursive` and skip the font link.

No other Mindmap behavior (layout, node fills, ink contrast) changes.
