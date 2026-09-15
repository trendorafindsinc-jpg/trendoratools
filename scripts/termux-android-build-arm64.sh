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

# Vercel CLI 56 `env run` merges local dotenv files and the current shell env
# ON TOP of Production values, and does not strip `[SENSITIVE]` placeholders.
# A leftover `.env.local` from `vercel env pull` therefore overrides Firebase
# with empty or placeholder values, and Vite embeds isFirebaseConfigured=false.
ENV_BACKUP_DIR="$(mktemp -d)"
LOCAL_ENV_FILES=(.env .env.local .env.production .env.production.local .env.development .env.development.local)

restore_local_env() {
  for f in "${LOCAL_ENV_FILES[@]}"; do
    if [ -f "$ENV_BACKUP_DIR/$f" ]; then
      mv -f "$ENV_BACKUP_DIR/$f" "$f"
    fi
  done
  rm -rf "$ENV_BACKUP_DIR"
}
trap restore_local_env EXIT

echo "==> Isolating local dotenv files so they cannot override Vercel Production"
for f in "${LOCAL_ENV_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "    moving $f aside for the production Android web build"
    mv "$f" "$ENV_BACKUP_DIR/$f"
  fi
done

for VAR_NAME in \
  VITE_FIREBASE_API_KEY \
  VITE_FIREBASE_AUTH_DOMAIN \
  VITE_FIREBASE_PROJECT_ID \
  VITE_FIREBASE_STORAGE_BUCKET \
  VITE_FIREBASE_MESSAGING_SENDER_ID \
  VITE_FIREBASE_APP_ID \
  VITE_GA_MEASUREMENT_ID
do
  unset "$VAR_NAME" || true
done

echo "==> Building web app with Vercel production environment variables"
# Sensitive Vercel variables are write-only and must not be pulled into .env.local.
# `vercel env run` injects them directly into the Node build. Do not use bash -c
# here: execa runs the command without a shell, and leftover dotenv files must
# not be consulted by Vite.
npx vercel env run -e production -- node scripts/android-web-build.mjs

if [ ! -d android ]; then
  echo "==> Adding Capacitor Android platform"
  npx cap add android
fi

printf "sdk.dir=%s\n" "$ANDROID_HOME" > android/local.properties
npx cap sync android

echo "==> Verifying Firebase configuration survived Capacitor sync"
node scripts/assert-embedded-firebase.mjs android/app/src/main/assets/public

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
