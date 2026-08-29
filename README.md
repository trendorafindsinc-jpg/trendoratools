# Trendora Tools v1.1 (Offline PWA)

Practical financial tools from **Trendora**, under **LUCIA**.

## What's included
- Full offline PWA support — install to home screen on Android & iPhone
- Works completely offline after the first visit (service worker + app shell caching)
- Expenses, Income, Budget, Bills, Savings, Debts and Reports
- Command Center dashboard
- **Financial Insights** — deterministic summaries of recorded financial data
- Home, Ambassador visual, Legal suite, Settings export/import

## Product boundary
Trendora Tools is a productivity and financial-tracking product, not an AI platform or chatbot. AI integrations are not part of Trendora Tools. If AI capabilities are introduced elsewhere in the LUCIA product family, they belong to the appropriate AI product rather than being embedded here.

## Money
All amounts are stored as integer minor units (kobo/cents).

## Persistence
Zustand + localStorage. Store version 2 migrates older installs (adds empty incomes/bills/debts/customCategories).

## Develop
```bash
npm install
npm run dev
npm run build
```

Deploy: build with `npm run build`, then publish the `dist` folder.

## Install as app (Android / iPhone)

### Android (Chrome)
1. Open the live site
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**
3. The app opens in standalone mode
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
