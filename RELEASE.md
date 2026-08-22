# Releasing LifeVerse One

Everything here is optional for personal use — debug APKs and the web preview
work without any of it. Follow this when you want a signed APK you can install
on other devices or upload to Play.

## 1. Create a keystore (once)

```bash
keytool -genkeypair -v \
  -keystore onelife-release.keystore \
  -alias onelife \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep the file **out of git** (`*.keystore` is already gitignored) and back it up
somewhere safe — losing it means you can never update an already-published app.

## 2. Local signed build

```bash
export KEYSTORE_PATH=/absolute/path/onelife-release.keystore
export KEYSTORE_PASSWORD=...
export KEY_ALIAS=onelife
export KEY_PASSWORD=...

bun run build            # web bundle
./scripts/copy-web-assets.sh
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

`android/app/build.gradle.kts` only enables release signing when all four values
are present and the keystore file exists; otherwise it falls back to the debug
signing config, so nothing breaks without them.

## 3. CI (GitHub Actions)

Add these repository secrets:

| Secret              | Value                                  |
| ------------------- | -------------------------------------- |
| `KEYSTORE_BASE64`   | `base64 -w0 onelife-release.keystore`  |
| `KEYSTORE_PASSWORD` | store password                         |
| `KEY_ALIAS`         | e.g. `onelife`                         |
| `KEY_PASSWORD`      | key password                           |

Then un-comment the `release-apk` job at the bottom of
`.github/workflows/android.yml`. It decodes the keystore to
`android/app/onelife-release.keystore`, exports the three passwords/alias as env
vars, runs `assembleRelease`, and uploads the APK as an artifact.

## 4. Version bumps

Edit `android/app/build.gradle.kts` before each release:

- `versionCode` — integer, must increase on every upload.
- `versionName` — human-readable, e.g. `1.1.0`.

## 5. Pre-release checklist

- [ ] `bun run test` and `bun run build` are green.
- [ ] Web bundle re-copied into the Android assets (`scripts/copy-web-assets.sh`).
- [ ] Export → import JSON round-trip still restores data.
- [ ] Reminders fire with the configured lead time (Settings → Notifications).
- [ ] Calendar drag/reschedule works on a phone-sized viewport.
- [ ] `versionCode` / `versionName` bumped.
