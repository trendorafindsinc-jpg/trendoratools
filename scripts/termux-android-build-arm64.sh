#!/data/data/com.termux/files/usr/bin/bash
# Trendora Tools — Android APK build on Termux / ARM64 phones.
# Uses Vercel production env directly for the Vite build and forces native ARM64 aapt2.
set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
export GRADLE_OPTS="${GRADLE_OPTS:--Xmx1024m -Dorg.gradle.daemon=false}"

if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/android-sdk" ]; then
  export ANDROID_HOME="$HOME/android-sdk"
fi
if [ -z "${ANDROID_SDK_ROOT:-}" ] && [ -n "${ANDROID_HOME:-}" ]; then
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
fi
if [ -z "${ANDROID_HOME:-}" ] || [ ! -d "$ANDROID_HOME" ]; then
  echo "ERROR: Android SDK not found. Set ANDROID_HOME or install the SDK at \$HOME/android-sdk."
  exit 1
fi

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

echo "==> Android SDK: $ANDROID_HOME"
echo "==> Native aapt2: $AAPT2_BINARY"
"$AAPT2_BINARY" version || true

echo "==> Installing JS dependencies"
npm install --no-fund --no-audit

echo "==> Installing Trendora brand assets"
node scripts/install-icons.mjs

if [ ! -f .vercel/project.json ] && [ ! -f .vercel/repo.json ]; then
  echo "ERROR: This repository is not linked to its Vercel project."
  echo "Run: npx vercel link"
  exit 1
fi

echo "==> Building web app with Vercel production environment variables"
# Sensitive Vercel variables are write-only and must not be pulled into .env.local.
# `vercel env run` injects them directly into the build process instead.
npx vercel env run -e production -- bash -c '
  set -euo pipefail

  REQUIRED_FIREBASE_VARS=(
    VITE_FIREBASE_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET
    VITE_FIREBASE_MESSAGING_SENDER_ID
    VITE_FIREBASE_APP_ID
  )

  for VAR_NAME in "${REQUIRED_FIREBASE_VARS[@]}"; do
    if [ -z "${!VAR_NAME:-}" ]; then
      echo "ERROR: Missing Vercel production variable: ${VAR_NAME}"
      exit 1
    fi
  done

  EXPECTED_GA4_ID="G-3NYQNHCLK0"
  if [ "${VITE_GA_MEASUREMENT_ID:-}" != "$EXPECTED_GA4_ID" ]; then
    echo "ERROR: VITE_GA_MEASUREMENT_ID is not the Trendora Tools GA4 stream."
    echo "Expected: $EXPECTED_GA4_ID"
    exit 1
  fi

  echo "==> Firebase production configuration: all required values present"
  echo "==> GA4 production measurement ID: $EXPECTED_GA4_ID"
  npm run build
'

# Never package a placeholder Firebase configuration.
if grep -R '\[SENSITIVE\]' dist 2>/dev/null | head -1 | grep -q .; then
  echo "ERROR: [SENSITIVE] placeholder detected in the Vite output."
  exit 1
fi

if [ ! -d android ]; then
  echo "==> Adding Capacitor Android platform"
  npx cap add android
fi

printf "sdk.dir=%s\n" "$ANDROID_HOME" > android/local.properties
npx cap sync android

echo "==> Installing Trendora launcher icon into Android resources"
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  cp public/icons/icon-512.png "android/app/src/main/res/mipmap-$d/ic_launcher.png"
  cp public/icons/icon-512.png "android/app/src/main/res/mipmap-$d/ic_launcher_round.png"
done
rm -f android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
rm -f android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml

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

cp "$APK" "$OLDPWD/Trendoratools.apk"

echo ""
echo "SUCCESS"
echo "APK: $(pwd)/$APK"
echo "Copy: $OLDPWD/Trendoratools.apk"
