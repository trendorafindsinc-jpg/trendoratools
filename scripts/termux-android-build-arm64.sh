#!/data/data/com.termux/files/usr/bin/bash
# Trendora Tools — Android APK build on Termux / ARM64 phones.
# Forces Android Gradle Plugin to use the native ARM64 aapt2 supplied by Termux.
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

# Fail early instead of allowing Gradle to fall back to its x86_64 Linux aapt2.
if ! "$AAPT2_BINARY" version >/dev/null 2>&1; then
  echo "ERROR: aapt2 exists but cannot execute on this Termux environment: $AAPT2_BINARY"
  echo "Check: file \"$AAPT2_BINARY\""
  echo "Check: \"$AAPT2_BINARY\" version"
  exit 1
fi

echo "==> Native aapt2: $AAPT2_BINARY"
echo "==> aapt2 version:"
"$AAPT2_BINARY" version || true

echo "==> Installing JS dependencies"
npm install --no-fund --no-audit

echo "==> Installing brand icons"
node scripts/install-icons.mjs

echo "==> Building web app"
npm run build

if [ ! -d android ]; then
  echo "==> Adding Capacitor Android platform"
  npx cap add android
fi

npx cap sync android

# Persist the override in the generated Android project as a second line of defense.
# This is deliberately written after `cap add` because the android/ directory may not exist yet.
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
