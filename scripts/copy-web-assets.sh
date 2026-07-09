#!/usr/bin/env bash
# Copies the static web build (bun run build:android) into the Android app's
# assets so gradle can bundle it into the APK. Used locally and by CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/dist/client"
DEST="$ROOT/android/app/src/main/assets/www"

if [[ ! -f "$SRC/index.html" ]]; then
  echo "error: $SRC/index.html not found — run 'bun run build:android' first" >&2
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
echo "Copied $(find "$DEST" -type f | wc -l) files to android/app/src/main/assets/www"
