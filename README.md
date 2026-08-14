# TrendoraTools v1.0.0

Premium financial command center under the **LUCIA** brand by Trendora Inc.

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

Deploy: build `npm run build`, publish `dist`.
