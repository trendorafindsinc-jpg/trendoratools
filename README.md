# Trendora Tools v1.3 (Offline PWA + Android)

Practical financial tools from **Trendora**, under **LUCIA**.

Live web: https://trendoratools.vercel.app

## Brand
- Mark: violet → cyan rounded tile with a white **T** and cyan accent.
- Icons live under `public/icons/` and `public/brand/trendora-mark.svg`.
- Run `npm run icons` (or `npm install`) to ensure SVG + maskable aliases exist.

## What's included
- Full offline PWA — install to home screen on Android & iPhone
- **Capacitor + Gradle** Android app (`com.lucia.trendoratools`)
- Expenses, Income, Budget, Bills, Savings, Debts, Reports
- **Planner** — next actions (bills, budget pressure, debt order, goals)
- **Insights** — historical / this-month analytics
- Light, dark, and system themes
- Settings: account (sign in / sign out), **local + Lucia Cloud backup/restore**, legal suite
- SEO: Open Graph, Twitter cards, JSON-LD, `robots.txt`, `sitemap.xml`

## Develop
```bash
npm install
npm run dev
npm run build
```

Firebase / Lucia auth uses **environment variables only** (see `.env.example`). Never commit secrets.

## Android app (Capacitor connector + Gradle)

See **[docs/android-app.md](docs/android-app.md)** for full steps.

### Quick path — GitHub Actions
1. Actions → **Android APK** → Run workflow
2. Download **trendora-tools-debug-apk**
3. Install on device

### Quick path — local
```bash
npm install
npm run android:build
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

```bash
# Or step-by-step
npm run build
npx cap add android    # once
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Termux (Samsung S10+)
```bash
pkg update
pkg install nodejs-lts openjdk-17 git wget unzip
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
npm run android:build
```

## Lucia Cloud backup (required once)
Cloud backup writes to `users/{uid}/products/trendora-tools`. Deploy rules from this repo:

```bash
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into **Firebase Console → Firestore → Rules → Publish**.

## Install as PWA
### Android (Chrome)
1. Open the live site → menu → **Install app**
2. Home-screen icon uses the Trendora mark

### iPhone (Safari)
Share → **Add to Home Screen**

## Product boundary
Trendora Tools is a productivity and financial-tracking product under Trendora / LUCIA — not an AI platform.

## Money
All amounts are stored as integer minor units (kobo/cents).

## Persistence
Zustand + localStorage. Optional Lucia Cloud backup when signed in with a LUCIA ID.
