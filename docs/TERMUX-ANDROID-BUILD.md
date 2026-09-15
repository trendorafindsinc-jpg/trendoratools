# Trendora Tools Android build on Termux

Trendora Tools is built from Termux on an ARM64 Android phone. The build uses Capacitor and forces Gradle to use a native ARM64 `aapt2` supplied by Termux.

The APK is a Capacitor wrapper around a Vite production bundle. Firebase and GA4 are compiled in at `npm run build` from Vercel Production `VITE_*` variables. The Android app does not read those variables at runtime.

## One-time setup

```bash
pkg update
pkg install nodejs-lts openjdk-17 git wget unzip aapt2
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
npx vercel login
npx vercel link
```

If `aapt2` is installed but is not on PATH:

```bash
export AAPT2_BINARY="$PREFIX/bin/aapt2"
```

## Build

```bash
cd ~/projects/trendoratools
git pull
npm run android:build
```

The build script automatically detects `aapt2` and passes the ARM64 executable to Gradle through `android.aapt2FromMavenOverride`.

It injects Vercel Production environment variables with `vercel env run` (it does not write `.env.local`). Leftover local dotenv files from an earlier `vercel env pull` are moved aside for that build so `[SENSITIVE]` placeholders cannot override Production.

The debug APK is produced under:

```text
android/app/build/outputs/apk/debug/
```

Do not put Firebase Admin credentials, service-account JSON, or other private secrets in the Vite `VITE_*` variables. Firebase web configuration values are public client configuration and are injected at build time. In Vercel they must be Config visibility, not Secret — Secret values cannot be embedded by Vite on the phone.

GA4 must remain `G-3NYQNHCLK0`.
