# TrendoraTools v0.2.0

Productivity tools under the **LUCIA** brand by Trendora Inc.

- Budget Planner
- Expense Tracker
- Savings Tracker
- Premium Dashboard
- Deterministic conversational routing (not AI)
- Local persistence + JSON export/import

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · date-fns · lucide-react

## Quick start

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

## Deploy (Netlify / Vercel)

- Build command: `npm run build`
- Publish directory: `dist`

Money is stored as integer minor units (kobo/cents) to avoid floating-point errors.
