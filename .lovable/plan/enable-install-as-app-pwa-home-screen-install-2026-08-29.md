# Enable "Install as app" (PWA home-screen install)

## Current state

- `public/manifest.webmanifest` already exists with `display: "standalone"`, `start_url`, `scope`, and 192/512 icons — all serving with HTTP 200 on the published site.
- Root route head already links the manifest, `theme-color`, and `apple-touch-icon`.
- No custom install UI exists, and no `beforeinstallprompt` handling — so users never see an explicit install option.

## Why you don't see the install option

1. **Preview iframe**: Chrome's install prompt/menu item only appears on the real published site (`goal-journey-vault.lovable.app`), not inside the Lovable preview (`id-preview--...`), which runs in an iframe on a different origin.
2. **No visible entry point**: Chrome's automatic install UI is subtle (address-bar icon) and engagement-gated. Without an in-app "Install" button, most users never find it.

## What to build (manifest-only path — no service worker, no offline mode)

1. **Add an "Install app" button** — a small `InstallAppButton` component that:
   - Listens for the `beforeinstallprompt` event, captures it, and shows a button that triggers the native prompt on click.
   - Falls back to instructions ("Menu → Add to Home Screen" on Android, "Share → Add to Home Screen" on iOS Safari) when the event isn't available.
   - Hides itself when the app is already installed (`display-mode: standalone` check + `appinstalled` event).
   - Place it in the marketing footer/CTA band and in the app's Settings screen.
2. **Refresh stale manifest colors** — `theme_color` (`#7d9b76`) and `background_color` (`#f5f0e8`) still reflect the old sage theme; update to the current monochrome palette so the splash screen and title bar match.
3. **Verify installability** — load the published URL in Chrome via Playwright, confirm the manifest parses with no errors and `beforeinstallprompt` fires.

## Out of scope

- Offline support / service workers (not requested; install prompts work without one).
- Push notifications (already handled by the separate `sw-push.js` messaging worker, untouched).

## Technical notes

- Files: new `src/components/marketing/InstallAppButton.tsx`; edits to `public/manifest.webmanifest`, `src/components/marketing/SiteFooter.tsx`, `src/components/life/Settings.tsx`.
- No dependency installs needed. No registration guards needed (no service worker being added).
- Caveat: installability can only be tested on the published site, so this needs a publish to fully verify in your browser.
