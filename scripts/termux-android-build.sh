#!/data/data/com.termux/files/usr/bin/bash
# Trendora Tools — Android APK build on Termux (Samsung S10+, etc.)
# Prerequisites (run once):
#   pkg update && pkg install nodejs-lts openjdk-17 git wget unzip
#   # Android SDK command-line tools (large). Prefer a pre-installed SDK if available.
#   export ANDROID_HOME=$HOME/android-sdk
#   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
#
# This script builds a debug APK suitable for sideloading on the same device.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Installing JS deps"
npm install

echo "==> Installing brand icons"
node scripts/install-icons.mjs

echo "==> Building web app"
npm run build

if [ ! -d android ]; then
  echo "==> Adding Capacitor Android platform"
  npx cap add android
fi

echo "==> Syncing web assets + icons into Android project"
npx cap sync android

# Copy launcher icons into mipmap densities
if [ -f public/icons/icon-192.png ] && [ -d android/app/src/main/res ]; then
  echo "==> Ensuring launcher icons exist in res/"
  for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    dir="android/app/src/main/res/mipmap-$density"
    mkdir -p "$dir"
    cp -f public/icons/icon-192.png "$dir/ic_launcher.png" 2>/dev/null || true
    cp -f public/icons/icon-192-maskable.png "$dir/ic_launcher_round.png" 2>/dev/null || true
    cp -f public/icons/icon-192-maskable.png "$dir/ic_launcher_foreground.png" 2>/dev/null || true
  done
  cp -f public/icons/icon-48.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png 2>/dev/null || true
  cp -f public/icons/icon-72.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png 2>/dev/null || true
  cp -f public/icons/icon-96.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png 2>/dev/null || true
  cp -f public/icons/icon-144.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png 2>/dev/null || true
  cp -f public/icons/icon-192.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png 2>/dev/null || true
fi

echo "==> Gradle assembleDebug (this can take a while on S10+)"
cd android
chmod +x gradlew 2>/dev/null || true
./gradlew assembleDebug --no-daemon

APK=$(find app/build/outputs/apk/debug -name "*.apk" 2>/dev/null | head -1)
echo ""
echo "Build finished."
if [ -n "${APK:-}" ]; then
  echo "APK: $(pwd)/$APK"
  echo "Install: adb install -r $APK"
  echo "Or copy the APK to your phone and open it."
else
  echo "APK path not found — check android/app/build/outputs/apk/"
fi
