# Repository Baseline Audit — TrendoraTools to Ariovelle

**Audit date:** 2026-11-13.  
**Scope:** Read-only inspection of selected files and GitHub directory listings on the default branch `main`. This is an initial baseline, not a complete code/security audit.

## 1. Repository facts observed

- Repository: `trendorafindsinc-jpg/trendoratools`.
- Default branch: `main`.
- Repository is public; GitHub permissions returned admin/maintain/push for the connected account.
- Root includes `.env.example`, `.github/`, `.gitignore`, `README.md`, `capacitor.config.ts`, `docs/`, `firebase.json`, `firestore.rules`, `index.html`, `package.json`, `postcss.config.js`, `public/`, `scripts/`, `src/`, `tailwind.config.js`, `tsconfig.json`, `vite.config.ts`.
- The existing README describes Trendora Tools v1.3, a financial tracking PWA and Android app, and references a live deployment at `https://trendoratools.vercel.app`.
- The package uses React 18, TypeScript, Vite 5, React Router 6, Zustand 4, Tailwind 3, vite-plugin-pwa, Capacitor 6 and Firebase 12.
- Existing scripts include dev/build/preview/test, icon setup, PWA/native sync and Android build scripts.
- Existing page inventory observed: Home, Planner, Expenses, Income, Budget, Bills, Savings, Debts, Reports, Insights, Settings and Legal.
- Existing component inventory observed: Layout, LuciaAuth, WelcomeExperience, AnalyticsTracker, Card, AmbassadorShowcase and showcase components.
- Existing library includes theme, analytics, native shell and Firebase/Lucia cloud/auth related modules.

## 2. Important legacy implementation findings

### Frontend and state

- `src/App.tsx` uses React Router and wraps existing finance pages in a Layout.
- The current authentication UI imports Firebase Auth user types and Firebase-backed auth functions.
- Guest mode and welcome state are stored in localStorage.
- Signed-in users trigger Lucia Cloud sync through the existing service.
- `src/store.ts` uses Zustand persist with localStorage key `trendoratools-v10`.
- Existing state includes expenses, incomes, budgets, savings goals, bills, debts, custom categories and chat messages.
- Existing money helpers appear to convert values into minor units; confirm all usages and rounding before reuse.
- Existing data export/import uses JSON and has a version marker. Validate import schema before trusting it.

### Firebase and identity

- `package.json` contains Firebase dependency.
- `src/lib/firebase.ts` initializes Firebase app, Auth and Firestore from `VITE_FIREBASE_*` variables.
- `src/components/LuciaAuth.tsx` uses email/password, password reset and Google sign-in through Firebase functions.
- `src/App.tsx` imports `subscribeToLuciaAuth`, `completeGoogleRedirectIfAny`, and Lucia Cloud sync functions.
- `.env.example` labels Firebase environment variables as LUCIA ID/Firebase client configuration and includes Firebase console setup notes.
- `firebase.json` references Firestore rules; `firestore.rules` allows owner-scoped user/product backup paths.
- This code does **not** prove that Firebase is the official Lucia ID implementation. The product decision is to remove Firebase and integrate Lucia ID using its official specification.
- Before removal, inspect every Firebase import and cloud-sync path, export/migration formats and existing customer-data dependencies. Do not delete backup/data paths without a migration plan.

### Branding, PWA and Android

- `index.html` contains Trendora Tools title, metadata, canonical URL, Open Graph/Twitter tags, JSON-LD publisher identity and Trendora icon paths.
- `vite.config.ts` configures PWA manifest name/short name/description, theme colors and Trendora assets.
- `capacitor.config.ts` uses app ID `com.lucia.trendoratools` and app name Trendora Tools.
- Native bootstrap configures Capacitor status bar and splash screen.
- `src/lib/theme.ts` already supports dark/light/system preference and uses Trendora localStorage theme key.
- Existing PWA/offline and Android functionality may be valuable. Preserve after checking service worker caching, auth/session behavior, offline writes and sync conflicts.

## 3. Existing product scope observed

README claims expenses, income, budget, bills, savings, debts, reports, planner, insights, light/dark/system themes, local and Lucia Cloud backup/restore, PWA and Android app.

The route/page inventory confirms a substantial personal-finance tracking starting point. It does not yet prove that all advertised features work correctly or are production safe.

## 4. Initial keep/adapt/replace/retire recommendation

| Area | Recommendation | Reason / caution |
|---|---|---|
| React + TypeScript + Vite | Keep provisionally | Existing working foundation; confirm build and dependency health |
| React Router | Keep provisionally | Existing route structure |
| Zustand finance store | Audit/adapt | Useful existing data logic; local-only state is not final multi-user backend |
| Existing financial calculation helpers | Audit/preserve | Validate minor-unit arithmetic and edge cases |
| Existing page business logic | Audit/reuse selectively | Separate behavior from old presentation |
| Existing visual UI/brand | Replace | New Ariovelle premium design system approved |
| Existing navigation | Replace | New product division/navigation model |
| Firebase SDK/Auth/Firestore | Retire after migration plan | Approved direction is Lucia ID + Ariovelle-owned PostgreSQL |
| Lucia Cloud sync implementation | Audit, then replace/adapt | It currently depends on Firebase/Firestore paths; avoid data loss |
| PWA configuration | Adapt | Rebrand manifest/assets; test caching and offline safety |
| Capacitor Android shell | Keep/adapt provisionally | Rebrand app name/assets; app ID change requires Android/package migration decision |
| Analytics | Audit/adapt | Ensure privacy, consent and event names reflect Ariovelle |
| Legal pages | Review/rewrite | Must reflect actual operator, providers, data flows and jurisdictions |
| Trendora metadata/assets | Replace for new app | Update page title, SEO, manifest, social metadata and icons |

## 5. Open audit questions

These have not yet been fully inspected and must be resolved before implementation/migration:

- Full source tree and all nested components/lib files.
- Full Firebase import graph, including Cloud sync, storage and scripts.
- Current test coverage and baseline build/test output.
- Existing CI workflows and Vercel project configuration.
- Existing user data formats and actual backup/restore behavior.
- Whether Android package ID is already published/distributed; do not change without confirming update implications.
- Existing market/AI/payment code, if any.
- Official Lucia ID integration docs and test credentials.
- Target PostgreSQL hosting/project and data retention policy.
- Market data provider and redistribution licenses.
- Payment provider, webhook docs and commercial pricing.
- Applicable privacy, consumer-finance and financial-promotion requirements.

## 6. Baseline commands to run in a local checkout

Run from the repository root and record results before code changes:

```bash
npm ci
npm test
npm run build
```

Also inspect:

```bash
git status --short
git branch --show-current
find src -type f | sort
grep -RInE 'firebase|firestore|VITE_FIREBASE|lucia-cloud' src package.json .env.example firebase.json firestore.rules
```

Do not paste secret values into terminal output or commit logs. Record variable names only.

## 7. Audit status

This initial audit is based on selected GitHub API directory/file reads. No local build, test, runtime, security scan or deployment check has been performed as part of this documentation change. Update this file after a complete local audit.
