# TrendoraTools

TrendoraTools is the first product under **LUCIA**, by **Trendora Inc.**

It is a productivity platform focused on practical tools. The first release includes:

- Budget Planner
- Expense Tracker
- Savings Tracker
- Unified Dashboard
- Conversational tool routing
- Local data persistence
- JSON export/import

TrendoraTools is **not an AI chatbot**. Its conversational home experience is a deterministic intent-routing UX. Future intelligence can be integrated through the WISECRAFT boundary without rewriting the product.

## Quickstart

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

## Project principles

- Productivity tools first
- No fake AI claims
- Clean separation between UI, domain logic, and data
- Local persistence behind a repository abstraction
- Financial values stored as integer minor units
- Accessible, responsive, mobile-first UI
- Future-ready for backend sync and WISECRAFT integration

## Documentation

See `docs/` for architecture, data model, design system, and security notes.
