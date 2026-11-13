# Codex instructions for Ariovelle

This file is the repository-level instruction contract for Codex and other coding agents. Read it before changing code. The product and architecture decisions are in [docs/ARIOVELLE_PRODUCT_SPEC.md](docs/ARIOVELLE_PRODUCT_SPEC.md), the implementation sequence is in [docs/ARIOVELLE_IMPLEMENTATION_PLAN.md](docs/ARIOVELLE_IMPLEMENTATION_PLAN.md), and the observed baseline is in [docs/REPOSITORY_AUDIT.md](docs/REPOSITORY_AUDIT.md).

## 1. Product identity and ownership

- Product name: **Ariovelle**.
- Parent/operator: **Lucia LLC**.
- Brand lockup: **Ariovelle — A product of Lucia**.
- Tagline: **Financial Intelligence. Without Limits.**
- TrendoraTools is the legacy product name. Do not introduce new Trendora branding into new product UI, metadata, copy, routes or assets.
- Do not rename the GitHub repository or production deployment as part of a code task unless explicitly requested.
- Lucia (the company) and Lucia ID (the authentication service) are distinct concepts.

## 2. Approved product decisions

- Responsive web/PWA experience for desktop, tablet and mobile; native Android wrapper may be retained after audit.
- Premium visual direction: midnight navy, warm ivory/white, restrained champagne-gold accent; readable typography and accessible contrast.
- Both dark and light themes are required. Respect a saved user preference and support system preference where practical.
- Freemium model. Useful personal and basic business tools remain free. Basic market information is free subject to provider licensing. Advanced capabilities are paid.
- Initial paid products: Personal Pro, Business, Markets Pro. Free plan is permanent. Do not invent prices; pricing is pending unit-economics and market validation.
- Core areas: Overview, Personal Finance, Business Finance, AI Intelligence, Global Markets, Financial Planning, Account/Integrations.
- Markets is research and decision support, not brokerage/order execution in the initial scope.

## 3. Non-negotiable safety and data rules

- **Do not delete or overwrite the current production app, data, or deployment as part of the rebuild.**
- Work on a feature branch. Do not push to `main`, deploy production, change domains, or perform destructive migrations without explicit authorization.
- Audit before replacing. Preserve validated financial business logic and user data; replace legacy UI deliberately.
- Never silently discard, reset, or migrate user data. Any migration needs a versioned, tested, reversible plan and a backup/restore procedure.
- Do not claim a provider, auth flow, market feed, payment flow, AI feature or integration is connected unless it is implemented and verified.
- Never place secrets in source, docs, client-side environment variables, logs, fixtures or commits. Update `.env.example` with variable names and safe descriptions only.
- Never fabricate balances, prices, market data, news, economic events, forecasts or investment returns. Clearly mark fixtures and demo data.
- Never treat LLM output as a source of truth for prices, accounting calculations, financial records or market forecasts. Quantitative systems supply structured facts; AI may explain them with provenance and uncertainty.
- No brokerage execution, custody, deposits, withdrawals or payment initiation unless separately approved and all legal, provider and security requirements are satisfied.
- Respect least privilege and workspace ownership on every server operation. Frontend route hiding is not authorization.

## 4. Authentication boundary: Lucia ID

- Lucia ID is the intended global identity provider.
- Ariovelle must own its own application database and internal user IDs.
- Store a stable mapping from a verified external Lucia ID subject to Ariovelle's internal user ID.
- Do not use Firebase Authentication as a substitute for Lucia ID.
- Do not use Neon Auth as a substitute for Lucia ID.
- Existing Firebase-based auth code is legacy and must be inventoried and removed/replaced in a controlled sequence.
- **Do not guess** Lucia ID issuer, JWT claims, signing keys/JWKS URL, OAuth/OIDC endpoints, SDK, callback URLs, token format, session semantics or logout behavior. Obtain and follow official Lucia ID documentation first.
- Until that documentation is supplied and validated, build an auth adapter/interface and a clearly labelled local development mock only. Never make mock auth available in production.

## 5. Financial correctness

- Store monetary values using PostgreSQL `NUMERIC/DECIMAL` or an explicitly documented integer-minor-unit representation with currency and exponent. Never use binary floating point for money calculations or persistence.
- Every amount must have an explicit ISO 4217 currency code; do not assume one global currency.
- Use UTC timestamps for persisted instants and preserve local date semantics for bills, budgets and accounting periods.
- Define rounding rules and currency precision explicitly.
- Keep source records, derived totals and forecasts distinguishable.
- Make financial mutations auditable. Avoid hard deletion of ledger-like records; use reversals/voids where appropriate.
- Validate imports, prevent duplicate processing, and record provenance.
- Tests must cover rounding, currency handling, negative/zero values, timezone boundaries, ownership and concurrent updates.

## 6. Entitlements and billing

- Feature entitlements must be centrally defined and checked on the server for protected operations/data.
- Client-side gating is presentation only, never security.
- Free users retain access to their own existing financial records and basic export. Expiry must not delete user data.
- Keep plan/feature keys stable and machine-readable. Do not scatter string comparisons throughout components.
- Usage quotas are configurable; do not hardcode unapproved numerical limits or prices.
- Payment webhooks must be signature-verified, idempotent, replay-safe and authoritative for subscription state.
- Do not grant paid access based solely on a client redirect or browser state.

## 7. Markets and AI integrity

- Market coverage is enabled only when provider availability, licensing, redistribution/display rights, latency, quality and cost are verified.
- Show quote source, instrument, currency, timestamp, delay/real-time status and data limitations.
- Advanced analysis must disclose methodology, evidence, model/version, timestamp, uncertainty, scenario assumptions and invalidation risks where applicable.
- If evidence is insufficient, show that analysis is unavailable; do not manufacture a forecast.
- Backtest and evaluate forecasts with time-correct data and avoid look-ahead bias.
- AI-generated explanations must distinguish observed facts, calculations, estimates and opinions.
- Do not provide personalized buy/sell guarantees or imply guaranteed returns.

## 8. UI and accessibility

- Build one responsive system, not three separate applications.
- Desktop: persistent/collapsible sidebar and top utility bar.
- Tablet: collapsible navigation/drawer and adaptive grid.
- Mobile: compact top bar and bottom navigation (Home, Finance, AI, Markets, More); remaining destinations live under More.
- Use shared design tokens and reusable components. Avoid one-off CSS values when a token exists.
- Support keyboard navigation, visible focus, semantic labels, accessible dialogs, reduced motion and WCAG-conscious contrast.
- Provide loading, empty, error, offline, permission-denied and upgrade states for every data-backed screen.
- Never use fabricated production-looking financial values. Fixtures must be labelled as sample/demo data.

## 9. Engineering workflow

1. Read this file and the three linked docs.
2. Inspect the relevant existing code before editing; do not assume the audit is exhaustive.
3. State the scope and identify data/security implications.
4. Make small, reviewable changes on a feature branch.
5. Add/update tests and run the relevant checks (at minimum `npm test` and `npm run build` when available).
6. Report actual command results. Do not claim tests passed if they were not run.
7. Update documentation when a decision or implementation status changes.
8. Do not commit secrets, generated build artifacts, local databases or user data.
9. Do not merge or deploy without explicit approval.

## 10. Current known repository baseline

The inspected default branch is a React 18 + TypeScript + Vite app with React Router, Zustand/localStorage persistence, Tailwind, PWA tooling and Capacitor Android configuration. It contains Firebase SDK/auth/Firestore code and a legacy Firebase rules file. Existing pages cover expenses, income, budgets, bills, savings, debts, reports, planner, insights, settings and legal content. See the repository audit for details and limitations.

The current docs are a decision/specification baseline, not evidence that the target architecture has been implemented. Update status honestly as work proceeds.
