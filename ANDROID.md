# OneLife — Android App

The `android/` directory contains a native **Kotlin shell app** that bundles the
exact same web app you deploy to the web, rendered in a full-screen WebView.
The web code in `src/` (and its Vitest suite) stays the single source of truth;
Kotlin handles only what a WebView cannot do natively: reminder notifications,
"Save as" file dialogs, and permissions.

This is the same architecture Capacitor uses, hand-rolled with zero extra
framework, which is why the theme, UI/UX, functionality, and test cases match
the web app exactly.

```
src/  (web app) ──vite build──▶ dist/client ──copied──▶ android/app/src/main/assets/www ──gradle──▶ APK
```

## How it works

| Concern                 | Implementation                                                                                                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI                      | `MainActivity` renders `assets/www` via `WebViewAssetLoader` at `https://appassets.androidplatform.net` (a real secure origin, fully offline)                                                                                                      |
| SPA routes              | `SpaAssetsPathHandler` falls back to `index.html` for extension-less paths (`/home`, `/create-goal`)                                                                                                                                               |
| Storage                 | WebView `localStorage` (key `life-manager:v1`) in the app's private data dir — persists across restarts, removed on uninstall/clear-data                                                                                                           |
| JSON / ICS export       | `window.AndroidBridge.saveFile(...)` → native "Save as" dialog (Storage Access Framework)                                                                                                                                                          |
| JSON import             | WebView's `<input type="file">` → `onShowFileChooser` → system file picker                                                                                                                                                                         |
| Reminders               | `src/hooks/use-app-settings.ts` hands upcoming reminders to Kotlin; `NotificationScheduler` sets `AlarmManager` alarms (fire even when the app is backgrounded, honoring the "remind me ahead of time" setting) and re-registers them after reboot |
| Notification permission | Android 13+ `POST_NOTIFICATIONS` runtime permission, surfaced through the same Settings UI as the web permission flow                                                                                                                              |
| Dark mode / themes      | Identical CSS: the in-app light/dark/system toggle and all 6 color themes work unchanged; the WebView reports the system `prefers-color-scheme`                                                                                                    |
| External links          | Open in the default browser                                                                                                                                                                                                                        |
| Back button / gesture   | Navigates WebView history before exiting                                                                                                                                                                                                           |

The JS side of the bridge lives in [`src/lib/native-bridge.ts`](src/lib/native-bridge.ts).
Every helper is a no-op in a normal browser, so web behavior — and every
existing test — is unchanged.

## Storage on the phone (and backups)

All data is stored **on-device** in the WebView's `localStorage`, exactly like
the web app stores it in your browser. Nothing is synced to any server.

- Survives app restarts, device reboots, and app updates.
- Deleted by uninstalling the app or "Clear data" in system settings.
- **Backup**: use the in-app _Export JSON_ (sidebar `⋮` menu). On Android this
  opens a native "Save as" dialog. The file is byte-compatible with the web
  app's export (`EXPORT_VERSION = 1`), so you can move data freely between
  phone and browser via Export → Import.

## Building locally

Prerequisites: Bun, JDK 17+, Android SDK (or Android Studio).

```bash
bun install
bun run build:android          # static web bundle -> dist/client
./scripts/copy-web-assets.sh   # dist/client -> android/app/src/main/assets/www
cd android
./gradlew assembleDebug        # -> app/build/outputs/apk/debug/app-debug.apk
./gradlew testDebugUnitTest    # Kotlin unit tests
```

Install on a device/emulator: `adb install app/build/outputs/apk/debug/app-debug.apk`.

If gradle can't find the SDK, create `android/local.properties` with
`sdk.dir=/path/to/android-sdk`.

## CI (GitHub Actions)

`.github/workflows/android.yml` runs on pushes/PRs to `dev`/`stage`/`prod`
(same branches as the existing web CI) and on manual dispatch:

1. `bun run test` — the web Vitest suite must pass (it is the functional test
   suite for the Android app too).
2. `bun run build:android` + copy assets.
3. `./gradlew testDebugUnitTest` — Kotlin bridge/scheduler tests.
4. `./gradlew assembleDebug` — uploads `onelife-debug-apk` as a workflow
   artifact (Actions run page → Artifacts).

## Managing web ↔ Android updates

This repo is monorepo-style: one web codebase, two delivery targets.

- **Web**: deploys exactly as before (Cloudflare Workers via `wrangler.jsonc`);
  nothing about the web build changed.
- **Android** uses the **bundled-assets model**: every CI run snapshots the
  current web app into the APK. Ship a web feature → the next APK build
  automatically contains it. Users get it by installing the new APK.
- Recommended release policy: bump `versionCode`/`versionName` in
  `android/app/build.gradle.kts` whenever you distribute a new APK; tag the
  commit so the APK maps to an exact web revision.

**Alternative (remote URL mode):** point the WebView at the live Cloudflare URL
instead of bundled assets — web deploys then update the app instantly with no
APK release, but the app requires a network connection and app-store policies
frown on pure remote wrappers. To switch, change `START_URL` in
`MainActivity.kt` to your deployment URL and delete the asset-loader intercept.
The bundled (offline-first) model is the default because all data is local
anyway.

## Release builds

Deliberately not enabled yet — CI only produces debug APKs. When you're ready:

1. Generate a keystore:

```bash
keytool -genkeypair -v -keystore onelife-release.keystore \
  -alias onelife -keyalg RSA -keysize 2048 -validity 10000
```

2. Add repo secrets `KEYSTORE_BASE64` (`base64 -w0 onelife-release.keystore`),
   `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.
3. Add to `android { ... }` in `android/app/build.gradle.kts`:

```kotlin
signingConfigs {
    create("release") {
        storeFile = file("onelife-release.keystore")
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = System.getenv("KEY_ALIAS")
        keyPassword = System.getenv("KEY_PASSWORD")
    }
}
```

and `signingConfig = signingConfigs.getByName("release")` inside the
`release` build type. 4. Uncomment the `release-apk` job in `.github/workflows/android.yml` and push
a `v*` tag.

## Known issues (pre-existing, carried over intentionally)

These exist in the web app today and were **not** silently fixed — the Android
app matches the web app, warts and all:

1. **Welcome video is a placeholder** — `src/components/life/Welcome.tsx`
   renders a stub card, no actual video.
2. **Frieren "ambience" music is not implemented** — the Settings copy implies
   background ambience, but only completion chimes + confetti exist.
   `test-music.ts` at the repo root imports a non-existent `src/lib/music.ts`.
3. **Frieren milestone chime is broken upstream** — its Mixkit URL
   (`sfx/1435`) now returns HTTP 403, so completing a milestone plays no sound
   (the code fails silently). Discovered while self-hosting the SFX; the task
   and goal chimes were self-hosted successfully, the milestone chime keeps
   the original (broken) remote URL for parity.
4. **Duplicate notification systems** — `use-notifications.ts` (fires at task
   start, ignores lead time) and `use-app-settings.ts` (honors
   `reminderLeadMinutes`) both run in browsers, which can double-notify. The
   Android bridge mirrors only the lead-time variant.
5. **`OnboardingWizard.tsx` is dead code** — never imported (superseded by
   `Onboarding.tsx`).
6. **Advanced recurrence unimplemented** — only
   `none/daily/weekly/monthly/yearly`; the `recurrenceRule`
   (weekday/biweekly/BYDAY) field planned in `.lovable/plan.md` was never
   added.
7. **`autoScheduleGoal()` has no UI** — exposed in the data context, but only
   `autoScheduleSkill` is reachable (Skills tab).
8. **Branding** — resolved: app UI, docs, export filenames, manifest and the
   Android shell all use "OneLife".
9. **`/create-goal` lacks the AppShell sidebar**, contrary to the original
   Lovable plan doc.
10. **Stale repo artifacts** — removed (`dom.html`, `dom2.html`,
    `replace_css.patch`, `bun_output.txt`, `verification/`, `test-music.ts`).
