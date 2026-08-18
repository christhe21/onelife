# Production polish pass

Cleanup and consistency only — no new features.

## 1. Notification deduplication

Today two independent systems can fire for the same task in a browser:

- `useNotifications()` (called from `src/routes/index.tsx`) polls every 60s and notifies exactly at task start, ignoring the user's reminder lead time and the "notifications enabled" setting.
- `useAppSettingsEffects()` already has a complete web polling path (honors `notificationsEnabled` + `reminderLeadMinutes`), a native Android/AlarmManager path, and a server push-reminder sync path.

Change: delete `src/hooks/use-notifications.ts` and its call in `src/routes/index.tsx`, leaving `useAppSettingsEffects` as the single reminder owner. Move the one thing only the old hook did — notifying for scheduled **subtasks** — into the web polling path of `useAppSettingsEffects` (the native and push paths already handle or intentionally skip these; subtasks get added to the web path so behaviour is not lost). Permission requesting stays user-initiated from Settings rather than firing automatically on page load.

## 2. Placeholders and dead code

- **Welcome video stub** (`Welcome.tsx`): remove the fake "See how it works" video card entirely rather than shipping a non-functional player.
- **Chimes**: `celebrate.ts` points the milestone chime at a remote Mixkit URL that returns 403. Switch it to the self-hosted `/sfx/` assets already in `public/sfx` (milestone reuses the local chime at a slightly different playback rate so the three events still sound distinct), and drop the known-issue comment.
- **Ambience music**: no music engine exists (`test-music.ts` imports a non-existent `src/lib/music.ts`). Delete `test-music.ts` / `test-music.js`, and reword the Settings card from "Frieren ambience" to "Frieren chimes & confetti" so the copy matches what actually happens (no promise of background music).
- **Dead code / stale files**: delete unused `src/components/life/OnboardingWizard.tsx` (superseded by `Onboarding.tsx`, no imports), plus repo junk `dom.html`, `dom2.html`, `replace_css.patch`, `patch_data_model.py`, `bun_output.txt`, `tsconfig.tsbuildinfo`, and the `verification/` folder (script + screenshots/videos). Add the build artefacts to `.gitignore`.

## 3. Branding consistency

Standardise on **OneLife** for everything user-visible:

- Headers/labels in `AppShell.tsx`, `Onboarding.tsx`, `home.tsx`, `index.tsx`, `create-goal.tsx`.
- Export filenames in `app-data.tsx` and `calendar-export.ts`: `onelife-YYYY-MM-DD.json`, `onelife-template.json`, `onelife-skills-reference.json`, `onelife-schedule-YYYY-MM-DD.ics`, and the ICS UID domain.
- Docs: `README.md`, `ANDROID.md`, `ANDROID_PARITY_CHECKLIST.md`.
- Manifest and Android strings already say OneLife — left as-is.

Internal localStorage keys (`life-manager:v1`, `life-manager:calendar-filters`) stay unchanged so existing users keep their data. Import will continue to accept older `life-manager-*.json` exports since it reads file contents, not names.

## 4. Release readiness

- Add `RELEASE.md`: keystore generation, the four GitHub secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`), how to un-comment the `release-apk` job in `.github/workflows/android.yml`, versionCode/versionName bump steps, and a short pre-release checklist.
- Add a `signingConfigs` block to `android/app/build.gradle.kts` that reads those values from environment variables and falls back to debug signing when they are absent, so local and CI debug builds keep working untouched.
- Quick wins: the runtime hydration mismatch currently logged on `/` gets fixed in the same pass.

## Technical notes

Files touched: `src/hooks/use-notifications.ts` (deleted), `src/hooks/use-app-settings.ts`, `src/routes/index.tsx`, `src/routes/home.tsx`, `src/routes/create-goal.tsx`, `src/components/life/Welcome.tsx`, `src/components/life/Settings.tsx`, `src/components/life/AppShell.tsx`, `src/components/life/Onboarding.tsx`, `src/components/life/OnboardingWizard.tsx` (deleted), `src/lib/celebrate.ts`, `src/lib/app-data.tsx`, `src/lib/calendar-export.ts`, `android/app/build.gradle.kts`, docs. Existing Vitest suite must stay green.
