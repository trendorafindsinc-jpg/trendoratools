# Ariovelle — Lucia product rebuild

> **Current status:** The repository still contains the legacy TrendoraTools application. The Ariovelle product is approved and documented; the implementation has not yet been rebuilt. Do not interpret the legacy instructions below as the target product architecture.

**Codex / coding-agent entry point:** Read [AGENTS.md](AGENTS.md) first.

## Ariovelle project documents

- [Product, screens, responsive UI and free/premium entitlements](docs/ARIOVELLE_PRODUCT_SPEC.md)
- [Backend architecture, database model, API, security and migration specification](docs/ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md)
- [Phased implementation plan and release gates](docs/ARIOVELLE_IMPLEMENTATION_PLAN.md)
- [Observed legacy repository baseline and migration cautions](docs/REPOSITORY_AUDIT.md)

**Approved identity:** Ariovelle — A product of Lucia LLC.  
**Tagline:** Financial Intelligence. Without Limits.  
**Commercial model:** Freemium; basic personal finance, basic business tools and basic market access remain free; advanced capabilities are paid.  
**Themes:** Premium dark and light.

**Safety:** Keep the existing production app and data intact during rebuild. Work on a feature branch. Do not remove Firebase or migrate user data until all dependencies and preservation paths are understood. Lucia ID's official technical specification is required before implementing authentication; do not guess its protocol. The backend architecture/migration specification is authoritative for Phase 2.

---

## Legacy application documentation (historical)

The sections below describe the existing TrendoraTools baseline and are retained temporarily for migration reference. They are not the approved target Ariovelle specification.

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
