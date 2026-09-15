#!/data/data/com.termux/files/usr/bin/bash
# Trendora Tools — Android APK build on Termux / ARM64 phones.
# Uses Vercel production env values for the Vite build and forces native ARM64 aapt2.
set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
export GRADLE_OPTS="${GRADLE_OPTS:--Xmx1024m -Dorg.gradle.daemon=false}"

if [ -z "${AAPT2_BINARY:-}" ]; then
  if command -v aapt2 >/dev/null 2>&1; then
    AAPT2_BINARY="$(command -v aapt2)"
  elif [ -n "${PREFIX:-}" ] && [ -x "$PREFIX/bin/aapt2" ]; then
    AAPT2_BINARY="$PREFIX/bin/aapt2"
  fi
fi

if [ -z "${AAPT2_BINARY:-}" ] || [ ! -x "$AAPT2_BINARY" ]; then
  echo "ERROR: Native ARM64 aapt2 was not found."
  echo "Run: pkg install aapt2"
  echo "Or: export AAPT2_BINARY=\"$PREFIX/bin/aapt2\""
  exit 1
fi

if ! "$AAPT2_BINARY" version >/dev/null 2>&1; then
  echo "ERROR: aapt2 exists but cannot execute on this Termux environment: $AAPT2_BINARY"
  echo "Check: \"$AAPT2_BINARY\" version"
  exit 1
fi

echo "==> Native aapt2: $AAPT2_BINARY"
"$AAPT2_BINARY" version || true

echo "==> Installing JS dependencies"
npm install --no-fund --no-audit

echo "==> Installing Trendora brand assets"
node scripts/install-icons.mjs

if command -v vercel >/dev/null 2>&1 && [ -f .vercel/project.json ]; then
  echo "==> Building web app with Vercel production environment variables"
  vercel env run -e production -- npm run build
elif [ -f .env.local ] || [ -f .env ]; then
  echo "==> Vercel CLI/project link not found; using existing local env file"
  npm run build
else
  echo "ERROR: Firebase/Vercel environment variables are not available locally."
  echo "Link this repo to the Trendora Tools Vercel project, then rerun:"
  echo "  vercel link"
  echo "The build will then use: vercel env run -e production -- npm run build"
  exit 1
fi

if [ ! -d android ]; then
  echo "==> Adding Capacitor Android platform"
  npx cap add android
fi

npx cap sync android

echo "==> Generating native Android launcher assets from the repository Trendora icon"
npx capacitor-assets generate --android

GRADLE_PROPS="android/gradle.properties"
touch "$GRADLE_PROPS"
sed -i '/^android\.aapt2FromMavenOverride=/d' "$GRADLE_PROPS"
printf '\nandroid.aapt2FromMavenOverride=%s\n' "$AAPT2_BINARY" >> "$GRADLE_PROPS"

cd android
chmod +x gradlew 2>/dev/null || true

echo "==> Gradle assembleDebug using native ARM64 aapt2"
./gradlew assembleDebug \
  -Pandroid.aapt2FromMavenOverride="$AAPT2_BINARY" \
  --no-daemon \
  --stacktrace

APK=$(find app/build/outputs/apk/debug -name '*.apk' 2>/dev/null | head -1)
if [ -z "$APK" ]; then
  echo "ERROR: APK was not produced."
  exit 1
fi

echo ""
echo "SUCCESS"
echo "APK: $(pwd)/$APK"
