# Fix the homepage preview stuck on its loading placeholder

## What's happening

On the homepage, the product preview below the headline shows its animated loading placeholder and never switches to the actual picture. Clicking another preview tab (Calendar, Mindmap, etc.) makes that one appear, and going back to the first one then works too.

## Cause

The homepage is rendered on the server, so the first preview picture is already in the page markup and often finishes loading (or comes straight from cache) before the page's interactive code takes over. The component only hides the placeholder when it is told "the picture just finished loading" — a signal that already came and went. So the first preview waits for an event that will never arrive. Later tabs mount fresh after the page is interactive, so they get the signal normally.

## The fix

- When the preview mounts, check whether the picture is already fully loaded and, if so, hide the placeholder immediately instead of waiting for the load event.
- Also hide the placeholder if the picture fails to load, so a broken or slow file never leaves a permanent shimmer.
- Load the first (visible) preview eagerly with high priority instead of lazily, so it starts fetching right away.
- Keep the placeholder, fade-in, and current visuals exactly as they are.

## Technical notes

- `src/components/marketing/ScreenshotFrame.tsx`: add an `img` ref plus an effect that sets `loaded` when `img.complete && img.naturalWidth > 0`; re-run on `src` change and reset `loaded` on `src` change. Add `onError` → `setLoaded(true)`. Accept an optional `priority` prop that switches `loading="lazy"` to `loading="eager"` + `fetchPriority="high"`.
- `src/components/marketing/ShotTabs.tsx`: pass `priority` for the initially active shot; keep the existing preloading effect.
- Check the same pattern is not repeated in other marketing components that render screenshots (`src/routes/features.tsx`, `src/routes/how-it-works.tsx`) and apply the same fix where it is.

## Validation

- Load the homepage fresh and after a reload (warm cache) and confirm the first preview shows immediately without touching any tab.
- Switch through all five tabs and back; no stuck placeholders.
- Check desktop and mobile widths, light and dark, and a clean console/build.
