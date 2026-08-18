# Android ↔ Web Parity Checklist

Verification record for the Android conversion. Because the Android app renders
the **exact same web build** (same JS, same CSS, same data layer) inside a
Kotlin WebView shell, parity is structural: anything not listed as a gap below
is byte-identical code on both platforms.

**How each item was verified** — legend:

- `vitest` — existing web test suite (12 tests, 5 files), run unchanged: **all pass**.
- `gradle` — `./gradlew testDebugUnitTest assembleDebug`: **6/6 Kotlin tests pass, APK builds** (3.4 MB `app-debug.apk`).
- `smoke` — Playwright run against the static Android bundle (`dist/client`)
  served with the same SPA-fallback semantics as the Kotlin asset loader, at a
  Pixel-sized viewport, with a scripted `window.AndroidBridge` matching the
  Kotlin implementation: **16/16 checks pass**.
- `same-code` — identical source file executes on both platforms; no
  platform branch exists, so behavior cannot differ.
- `unverified-on-device` — implemented and unit-tested, but this environment
  has no Android emulator/device, so it was not exercised on real hardware.

## 1. Theme parity

| Item                                                            | Status                        | Evidence                                                                                                                           |
| --------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Sage & Cream default palette                                    | Match                         | `same-code` (`src/styles.css` unchanged); `smoke` screenshots                                                                      |
| Ocean / Sunset / Lavender / Monochrome themes                   | Match                         | `same-code`; theme picker renders in `smoke` (settings screenshot)                                                                 |
| Frieren special theme (gradients, particles, vocabulary reskin) | Match                         | `same-code`; `smoke` verified `data-theme="frieren"` applies                                                                       |
| Light / Dark / System mode                                      | Match                         | `same-code`; `smoke` verified `.dark` class toggles; WebView reports system `prefers-color-scheme` (targetSdk 35)                  |
| Sora + Manrope fonts offline                                    | Match                         | Self-hosted in `public/fonts/`; `smoke` verified `document.fonts.check()` passes with **zero external requests**                   |
| Text scaling (sm/base/lg/xl)                                    | Match                         | `same-code` (`use-app-settings.ts` unchanged)                                                                                      |
| Frieren confetti + chimes                                       | Match | All chimes self-hosted in `public/sfx`, offline-capable |
| Splash screen & system-bar colors                               | Match                         | Kotlin theme uses `#7d9b76` primary / `#f5f0e8` cream / dark `#23261f` sampled from the same CSS tokens; `gradle` builds resources |
| Launcher icon                                                   | Match                         | Generated from the existing `public/icon-512.png` (legacy + adaptive, all densities)                                               |

## 2. UI / UX parity

| Item                                                                                                | Status           | Evidence                                                                                                                |
| --------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 10 tabs (Dashboard, Today, Calendar, Overview, Goals, Tasks, Bucket, Skills, Settings, Marketplace) | Match            | `same-code`; `smoke` rendered Dashboard & Settings at phone viewport (screenshots)                                      |
| `/home` Welcome + onboarding gate                                                                   | Match            | `smoke`: fresh session redirects to `/home`, hero renders, Skip works                                                   |
| `/create-goal` full-page wizard                                                                     | Match            | `smoke`: direct deep link renders through the SPA fallback (same fallback logic as `SpaAssetsPathHandler`)              |
| Mobile drawer navigation                                                                            | Match            | `smoke`: drawer opens, Settings reachable                                                                               |
| Dialogs, wizards, drag-and-drop calendar, mind map                                                  | Match            | `same-code` (Radix/shadcn components unchanged; WebView is Chromium-based) — `unverified-on-device` for touch-drag feel |
| Hardware back button                                                                                | Android addition | WebView history navigation, then exits — implemented in `MainActivity`; `unverified-on-device`                          |
| Keyboard handling                                                                                   | Match            | `adjustResize` + IME insets padding; `unverified-on-device`                                                             |

## 3. Functionality parity

| Item                                                       | Status            | Evidence                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skills / Goals / Milestones / Tasks / Subtasks CRUD        | Match             | `same-code` (`app-data.tsx` logic untouched); `vitest`                                                                                                                                                                                                                                                                                |
| Cascading completion, recurring-task bumping               | Match             | `same-code`; `vitest` (`toggleSubtask`, cascade tests)                                                                                                                                                                                                                                                                                |
| Auto-scheduling (`autoScheduleTasks`, `autoScheduleSkill`) | Match             | `same-code`; `vitest` (4 scheduling tests)                                                                                                                                                                                                                                                                                            |
| Marketplace import (+ auto-schedule)                       | Match             | `same-code`; `vitest` (`importMarketplaceGoal` tests)                                                                                                                                                                                                                                                                                 |
| Onboarding wizard                                          | Match             | `same-code`; `vitest` (full flow test) + `smoke`                                                                                                                                                                                                                                                                                      |
| Bucket list, promote-to-goal                               | Match             | `same-code`                                                                                                                                                                                                                                                                                                                           |
| **Storage on the phone**                                   | Match             | WebView `localStorage`, key `life-manager:v1` — same schema, `EXPORT_VERSION = 1` compatible both ways; `smoke` verified write + survive reload                                                                                                                                                                                       |
| JSON export / AI template / skills reference               | Match (better UX) | Routed to native "Save as" dialog via bridge; `smoke` verified `saveFile("life-manager-2026-07-09.json", "application/json", …)` fires; falls back to browser download on web                                                                                                                                                         |
| JSON import (replace/append)                               | Match             | `<input type="file">` → native file picker (`onShowFileChooser`); same parsing code                                                                                                                                                                                                                                                   |
| ICS calendar export                                        | Match             | Same generator, saved via native dialog                                                                                                                                                                                                                                                                                               |
| Reminders / notifications                                  | Match+            | Web: unchanged polling. Android: same lead-time logic hands reminders to `AlarmManager` (works backgrounded — better than web); `smoke` verified permission flow + "Reminders are on" test notification + schedule/cancel bridge calls; `gradle` unit tests cover the JSON contract; `unverified-on-device` for actual alarm delivery |
| Notification permission UI in Settings                     | Match             | Same screen; native permission state/request wired through the bridge; `smoke`                                                                                                                                                                                                                                                        |
| External links                                             | Match             | Open in default browser (`shouldOverrideUrlLoading`)                                                                                                                                                                                                                                                                                  |
| Offline operation                                          | Match (better)    | Entire app bundled in APK; `smoke` verified zero external requests                                                                                                                                                                                                                                                                    |

## 4. Test parity

| Item                                       | Status                  | Evidence                                                                                                                               |
| ------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Existing Vitest suite (12 tests / 5 files) | **Unchanged, all pass** | `bun run test` — scheduling, marketplace import, cascade, onboarding flow, new-goal wizard, 2 × a11y                                   |
| Lint                                       | No regressions          | `bun run lint`: identical problem count on this branch vs `main` (3 pre-existing errors, 16 pre-existing warnings — untouched)         |
| Kotlin unit tests (new)                    | 6/6 pass                | `ReminderParserTest` covers the JS↔Kotlin reminder JSON contract (valid, malformed-entry skipping, defaults, invalid JSON, round-trip) |
| CI                                         | Both suites wired in    | `.github/workflows/android.yml` runs `bun run test` **and** `gradlew testDebugUnitTest` before `assembleDebug`                         |
| Web (Cloudflare) build                     | Unaffected              | `bun run build` still produces the nitro/Cloudflare output                                                                             |

## 5. Known gaps (pre-existing in the web app — reported, not silently fixed)

1. **Welcome video placeholder** — removed.
2. **Frieren "ambience" music** — never existed; Settings copy now promises only chimes & confetti.
3. **Frieren chimes** — all self-hosted (`public/sfx`); milestone reuses the goal chime at a higher playback rate, so it works offline on web and Android.
4. **Duplicate notification systems** — resolved: `use-app-settings.ts` is the single lead-time-aware reminder owner for tasks and subtasks.
5. **`OnboardingWizard.tsx`** — removed.
6. **Advanced recurrence unimplemented** — only `none/daily/weekly/monthly/yearly`.
7. **`autoScheduleGoal()` has no UI** — only `autoScheduleSkill` is reachable.
8. **Branding** — resolved: the app, docs, exports and Android all use "OneLife".
9. **`/create-goal` lacks the AppShell sidebar** (contrary to the original Lovable plan doc).
10. **Stale repo artifacts** — `dom.html`, `dom2.html`, `replace_css.patch`, `bun_output.txt`, `verification/verify_dashboard.py`.

Android-specific limitations (new, by design or platform constraint):

11. **System-bar backdrop follows the system theme**, not the in-app theme toggle (web content itself themes correctly).
12. **Exact alarm timing needs the "Alarms & reminders" special access** on Android 14+; otherwise reminders may be minutes late.
13. **On-device/emulator testing was not possible in this CI environment** — everything marked `unverified-on-device` above is implemented and covered by unit tests + browser-level smoke tests, but has not been exercised on physical Android hardware.
