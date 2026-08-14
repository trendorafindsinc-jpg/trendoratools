# TrendoraTools v1.0.1 (Offline PWA)

Premium financial command center under the **LUCIA** brand by Trendora Inc.

## What's new in 1.0.1
- **Full offline PWA support** — install to home screen on Android & iPhone
- Works completely offline after the first visit (service worker + app shell caching)
- Proper icons, theme color, standalone display mode
- Auto-updating service worker

## Tools
- Expenses, Income, Budget, Bills, Savings, Debts, Reports
- Command Center dashboard
- **WISECRAFT** — Grok-style deterministic workspace (`/help`, slash commands)
- Home + Ambassador visual, Legal suite, Settings export/import

## Money
All amounts stored as integer minor units (kobo/cents).

## WISECRAFT
Rule-based routing only — not an AI chatbot. Slash: `/spend` `/income` `/bills` `/debt` `/budget` `/save` `/networth` `/help`

## Persistence
Zustand + localStorage. Store version 2 migrates older installs (adds empty incomes/bills/debts/customCategories).

## Develop
```bash
npm install
npm run dev
npm run build
```

Deploy: build `npm run build`, publish the `dist` folder (Netlify, etc.).

## Install as app (Android / iPhone)

### Android (Chrome)
1. Open the live site
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**
3. The app icon appears and opens in standalone mode
4. After first open it works fully offline

### iPhone (Safari)
1. Open the live site in Safari
2. Tap the Share button → **Add to Home Screen**
3. Confirm the name → Add
4. It appears on your home screen and works offline after the first visit

## Notes
- Data stays on the device (localStorage)
- No account or internet required after install
- Service worker auto-updates when a new version is deployed
