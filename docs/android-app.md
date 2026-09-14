# Trendora Tools — Android app (Capacitor + Gradle)

The web app at **https://trendoratools.vercel.app** is packaged as a native Android shell with:

- **Capacitor** — connector between the Vite/React web build and native Android
- **Gradle** — Android build system (`./gradlew assembleDebug`)

App ID: `com.lucia.trendoratools`  
App name: **Trendora Tools**

## Option A — GitHub Actions (recommended)

1. Open the repo on GitHub → **Actions** → **Android APK**
2. Run workflow (**workflow_dispatch**) or push to `main`
3. Download the artifact **trendora-tools-debug-apk**
4. Install on your phone (allow install from unknown sources for debug builds)

## Option B — Local / Termux (Samsung)

```bash
git clone https://github.com/trendorafindsinc-jpg/trendoratools.git
cd trendoratools
npm install
npm run android:build
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

One-time SDK setup is documented in the root README.

## Option C — Android Studio

```bash
npm install
npm run build
npx cap add android   # first time only
npx cap sync android
npx cap open android
```

Then **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

## What gets packaged

Capacitor copies the production `dist/` web build into the Android project. The app runs offline-capable (PWA assets + localStorage). Lucia ID / Firebase still need network when used.

## Product boundary

Trendora Tools remains a practical finance / productivity product — not an AI chatbot.
