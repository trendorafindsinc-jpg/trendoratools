# Trendora Tools v1.2 (Offline PWA + Android)

Practical financial tools from **Trendora**, under **LUCIA**.

## Brand
- Mark: violet → cyan rounded tile with a white **T** and cyan accent.
- Icons live under `public/icons/` and `public/brand/trendora-mark.svg`.
- Run `npm run icons` (or `npm install`) to ensure SVG + maskable aliases exist.

## What's included
- Full offline PWA — install to home screen on Android & iPhone
- Capacitor Android setup for native APK (Termux-friendly build script)
- Expenses, Income, Budget, Bills, Savings, Debts, Reports
- **Planner** — next actions (bills, budget pressure, debt order, goals)
- **Insights** — historical / this-month analytics
- Light, dark, and system themes
- Settings: account (sign in / sign out), **local + Lucia Cloud backup/restore**, legal suite
- SEO: Open Graph, Twitter cards, JSON-LD, `robots.txt`, `sitemap.xml`
- Welcome screen video loads immediately on first visit

## Develop
```bash
npm install
npm run dev
npm run build
```

Firebase / Lucia auth uses **environment variables only** (see `.env.example`). Never commit secrets.

## Lucia Cloud backup (required once)
Cloud backup writes to `users/{uid}/products/trendora-tools`. Deploy rules from this repo:

```bash
# If you use Firebase CLI linked to the LUCIA project:
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into **Firebase Console → Firestore → Rules → Publish**.

Without publishing these rules, backup/restore will show a permission error.

## Install as PWA
### Android (Chrome)
1. Open the live site → menu → **Install app**
2. Home-screen icon uses the Trendora mark (192 / 512 + maskable)

### iPhone (Safari)
Share → **Add to Home Screen** (apple-touch-icon)

## Android APK on Termux (Samsung S10+)

### One-time setup
```bash
pkg update
pkg install nodejs-lts openjdk-17 git wget unzip
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

### Build
```bash
git clone https://github.com/trendorafindsinc-jpg/trendoratools.git
cd trendoratools
git checkout main
npm install
npm run android:build
```

APK path: `android/app/build/outputs/apk/debug/app-debug.apk`

### Notes for S10+ / Termux
- Use OpenJDK 17 (not 21).
- Prefer `--no-daemon` (already in the script).
- If Gradle OOM: `export GRADLE_OPTS="-Xmx1024m"`.

## Product boundary
Trendora Tools is a productivity and financial-tracking product under Trendora / LUCIA — not an AI platform.

## Money
All amounts are stored as integer minor units (kobo/cents).

## Persistence
Zustand + localStorage. Optional Lucia Cloud backup when signed in with a LUCIA ID.
