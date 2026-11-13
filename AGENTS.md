# Codex instructions for Ariovelle

This file is the repository-level instruction contract for Codex and other coding agents. Read it before changing code. The product and architecture decisions are in [docs/ARIOVELLE_PRODUCT_SPEC.md](docs/ARIOVELLE_PRODUCT_SPEC.md), the backend architecture and data migration specification is in [docs/ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md](docs/ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md), the phased implementation plan is in [docs/ARIOVELLE_IMPLEMENTATION_PLAN.md](docs/ARIOVELLE_IMPLEMENTATION_PLAN.md), and the observed baseline is in [docs/REPOSITORY_AUDIT.md](docs/REPOSITORY_AUDIT.md).

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
- Owner decision (2026-11-13): legacy Firebase beta-tester records are out of scope and will not be migrated into Ariovelle. Build the new app as a clean start; do not import Firebase UIDs or link accounts by legacy email. Keep Firebase packages, auth flows, Firestore rules, cloud backup and the existing deployment intact during the rebuild. Remove/retire them only after replacement acceptance and separate explicit owner approval; the no-migration decision is not permission to delete the Firebase project.
- Do not claim a provider, auth flow, market feed, payment flow, AI feature or integration is connected unless it is implemented and verified.
- Never place secrets in source, docs, client-side environment variables, logs, fixtures or commits. Update `.env.example` with variable names and safe descriptions only.
- Never fabricate balances, prices, market data, news, economic events, forecasts or investment returns. Clearly mark fixtures and demo data.
- Never treat LLM output as a source of truth for prices, accounting calculations, financial records or market forecasts. Quantitative systems supply structured facts; AI may explain them with provenance and uncertainty.
- No brokerage execution, custody, deposits, withdrawals or payment initiation unless separately approved and all legal, provider and security requirements are satisfied.
- Respect least privilege and workspace ownership on every server operation. Frontend route hiding is not authorization.
- Do not use JavaScript floating-point values for money. Every amount has explicit currency and currency exponent.
- Do not automatically merge guest/local data into a signed-in account. Show a validated import preview and require explicit confirmation.
- Do not cache private financial API responses in service-worker CacheStorage.

## 4. Authentication boundary: Lucia ID

- Lucia ID is the intended global identity provider.
- Ariovelle must own its own application database and internal user IDs.
- Store a stable mapping from a verified external Lucia ID subject to an Ariovelle internal user ID.
- Do not use Firebase Authentication as a substitute for Lucia ID.
- Do not use Neon Auth as a substitute for Lucia ID.
- Existing Firebase-based auth code is legacy and must be inventoried and retired in a controlled sequence.
- **Do not guess** Lucia ID issuer, JWT claims, signing keys/JWKS URL, OAuth/OIDC endpoints, SDK, callback URLs, token format, session semantics or logout behavior. Obtain and follow official Lucia ID documentation first.
- The legacy `LUCIA-...` string generated from Firebase UID is not proof of a real Lucia ID.
- The server-side adapter and local session boundary exist on the Ariovelle feature branch. Login remains disabled until the Core nonce-propagation defect is fixed and a deployed HTTPS Core environment is available for end-to-end verification. Never weaken nonce validation to make the current Core token pass.

## 5. Authentication implementation rules\n\n- Keep `LUCIA_AUTH_ENABLED` false unless the explicit release gates in `docs/ARIOVELLE_LUCIA_CORE_RUNTIME_VERIFICATION.md` have passed.\n- Keep `LUCIA_CLIENT_SECRET`, `ARIOVELLE_SESSION_SECRET`, and `DATABASE_URL` server-only; never use a `VITE_` prefix.\n- Validate the OIDC ID token using the discovered allowlisted issuer and RS256 JWKS. Do not validate the Core HS256 access assertion locally; use it only as a bearer credential to Core UserInfo.\n- Require exact nonce and UserInfo subject equality. The current Core source omits the nonce in its ID-token issuance path; reject those tokens until Core is fixed.\n- Store only a SHA-256 hash of opaque Ariovelle session tokens. Resolve session identity through the narrow database function, then perform workspace permission checks and tenant queries inside the same transaction-local RLS context.\n- The new migration 0004 is source-only until reviewed and applied to the disposable development database. Never apply it to production as part of this task.\n\n## 6. Financial correctness

- Store monetary values using PostgreSQL `BIGINT` minor units plus ISO currency code and exponent, or an explicitly documented exact decimal representation. Never use binary floating point for money calculations or persistence.
- Do not assume all currencies have two fractional digits.
- Use UTC timestamps for persisted instants and preserve local date semantics for bills, budgets and accounting periods.
- Define rounding rules and currency precision explicitly.
- Keep source records, derived totals and forecasts distinguishable.
- Make financial mutations auditable. Avoid hard deletion of ledger-like records; use reversals/voids where appropriate.
- Validate imports, prevent duplicate processing, and record provenance.
- Tests must cover rounding, currency handling, negative/zero values, timezone boundaries, ownership and concurrent updates.

## 7. Entitlements and billing

- Feature entitlements must be centrally defined and checked on the server for protected operations/data.
- Client-side gating is presentation only, never security.
- Free users retain access to their own existing financial records and basic export. Expiry must not delete user data.
- Lucia ID authentication is not a paid feature.
- Keep plan/feature keys stable and machine-readable. Do not scatter string comparisons throughout components.
- Usage quotas are configurable; do not hardcode unapproved numerical limits or prices.
- Payment webhooks must be signature-verified, idempotent, replay-safe and authoritative for subscription state.
- Do not grant paid access based solely on a client redirect or browser state.

## 8. Markets and AI integrity

- Market coverage is enabled only when provider availability, licensing, redistribution/display rights, latency, quality and cost are verified.
- Show quote source, instrument, currency, timestamp, delay/real-time status and data limitations.
- Advanced analysis must disclose methodology, evidence, model/version, timestamp, uncertainty, scenario assumptions and invalidation risks where applicable.
- If evidence is insufficient, show that analysis is unavailable; do not manufacture a forecast.
- Backtest and evaluate forecasts with time-correct data and avoid look-ahead bias.
- AI-generated explanations must distinguish observed facts, calculations, estimates and opinions.
- Do not provide personalized buy/sell guarantees or imply guaranteed returns.

## 9. UI and accessibility

- Build one responsive system, not three separate applications.
- Desktop: persistent/collapsible sidebar and top utility bar.
- Tablet: collapsible navigation/drawer and adaptive grid.
- Mobile: compact top bar and bottom navigation (Home, Finance, AI, Markets, More); remaining destinations live under More.
- Use shared design tokens and reusable components. Avoid one-off CSS values when a token exists.
- Support keyboard navigation, visible focus, semantic labels, accessible dialogs, reduced motion and WCAG-conscious contrast.
- Provide loading, empty, error, offline, permission-denied and upgrade states for every data-backed screen.
- Never use fabricated production-looking financial values. Fixtures must be labelled as sample/demo data.

## 10. Engineering workflow

1. Read this file and all four linked Ariovelle specification/audit documents.
2. Inspect the relevant existing code before editing; do not assume the audit is exhaustive.
3. State the scope and identify data/security implications.
4. Make small, reviewable changes on a feature branch.
5. Add/update tests and run the relevant checks (at minimum `npm test` and `npm run build` when available).
6. Report actual command results. Do not claim tests passed if they were not run.
7. Update documentation when a decision or implementation status changes.
8. Do not commit secrets, generated build artifacts, local databases or user data.
9. Do not merge or deploy without explicit approval.
10. Keep Vercel Git auto-deploy disabled; no deployment is implied by a repository change.

## 11. Current known repository baseline

The inspected feature branch is a React 18 + TypeScript + Vite app with React Router, Zustand/localStorage persistence, Tailwind, PWA tooling and Capacitor Android configuration. It contains Firebase SDK/Auth/Firestore code and a legacy Firebase rules file. Existing pages cover expenses, income, budgets, bills, savings, debts, reports, planner, insights, settings and legal content.

Important observed details and migration cautions:
- Zustand persist key is `trendoratools-v10`, schema version 2; JSON export says version `1.0.0`.
- Financial records currently have no currency field. The legacy amount helper stores integer hundredths; display defaults to NGN but that does not prove every record's currency.
- Firestore cloud sync uses full collection reads and can delete remote records absent from a local snapshot. Do not reuse this algorithm as the new sync or migration mechanism.
- Firebase-generated `LUCIA-...` IDs are legacy labels derived from Firebase UID, not verified global Lucia ID subjects.
- See [docs/ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md](docs/ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md) for the authoritative architecture, schema, API, security and migration requirements.

The documents are a decision/specification baseline, not evidence that the target architecture has been implemented. Update status honestly as work proceeds.
