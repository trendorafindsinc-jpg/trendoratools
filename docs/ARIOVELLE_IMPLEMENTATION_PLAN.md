# Ariovelle Implementation Plan

**Status:** Phase 1 foundation committed to `feat/ariovelle-phase-1-design-system`; local build and visual QA are still pending.

## Progress log — 2026-11-13

### Phase 1 initial foundation (committed, verification pending)
- [x] Replaced the old top-level navigation shell with Ariovelle's responsive sidebar, topbar and mobile bottom navigation.
- [x] Added dark/light Ariovelle navy, ivory and champagne-gold theme tokens; preserved legacy theme preference as a read fallback.
- [x] Added a central theme toggle in the application shell.
- [x] Added route scaffolds for Business Finance, AI Intelligence, Global Markets and Financial Planning, with explicit not-connected/planned messaging.
- [x] Added compatibility styles so existing finance pages retain their shared glass/card/button primitives during gradual migration.
- [x] Rebranded the existing home page's visible product references.
- [ ] Run local install, typecheck/build and tests.
- [ ] Inspect desktop, tablet and mobile screenshots; fix responsive/accessibility issues.
- [ ] Complete reusable component primitives and theme preference settings integration.
- [ ] Confirm whether any legacy UI dependencies remain before moving to Phase 2.

**Verification limitation:** GitHub source edits were committed through the repository connector. A local checkout/runtime was not available in this step, so no npm install, test, build, browser visual test or deployment was run. Do not mark Phase 1 fully accepted until these checks pass.

  
**Working branch:** `docs/ariovelle-product-blueprint` for documentation changes. Create separate implementation branches from the agreed base as needed.

## 1. Execution principles

1. Audit first; change second.
2. Keep the current production application operational during rebuild.
3. Build the new product incrementally behind a separate branch/preview deployment.
4. Preserve validated existing finance logic and user data; replace the UI deliberately.
5. Do not provision production infrastructure or connect paid services without explicit authorization and required credentials.
6. Use feature flags/configuration for incomplete provider-dependent areas.
7. Never represent placeholder data or mock integrations as live.
8. Keep each phase buildable and reviewable.

## 2. Phase 0 — repository and product audit

- [ ] Inspect complete repository tree and all route/component/service modules.
- [ ] Record every feature, persistence path, auth path, integration, analytics tracker and native/PWA behavior.
- [ ] Identify Firebase Auth, Firestore, Cloud Storage, rules, scripts, CI and deployment dependencies.
- [ ] Inspect all environment variable references; ensure no secrets are committed.
- [ ] Identify localStorage/Zustand schemas and migration versions.
- [ ] Inventory existing user data/export formats and backup mechanisms.
- [ ] Run current tests/build and record baseline failures.
- [ ] Check current deployment configuration without changing production.
- [ ] Produce keep/adapt/replace/retire matrix.
- [ ] Confirm source-of-truth requirements and Lucia ID official integration specification.

**Exit gate:** no destructive code change until data/auth/integration dependencies are understood and a preservation plan exists.

## 3. Phase 1 — product foundation and design system

- [ ] Add Ariovelle brand tokens and approved brand lockup.
- [ ] Establish semantic color tokens for dark/light themes.
- [ ] Establish type scale, spacing, radii, elevation, borders and chart palette.
- [ ] Create shared primitives: Button, Input, Select, Card, Dialog, Drawer, Tabs, Table, Badge, Tooltip, Toast, Skeleton, EmptyState, ErrorState.
- [ ] Create responsive AppShell: desktop sidebar, tablet drawer/rail, mobile bottom nav.
- [ ] Add workspace switcher, global search shell, notifications and user menu.
- [ ] Implement theme preference: light/dark/system if supported by design.
- [ ] Verify contrast, focus states, keyboard support and reduced motion.
- [ ] Add component examples or Storybook only if it fits existing tooling.

**Exit gate:** design system works at mobile, tablet and desktop widths with no horizontal overflow.

## 4. Phase 2 — navigation and screen scaffolding

Build routes and screen shells in this order:
1. Landing and public product pages.
2. Sign-in/onboarding entry.
3. Overview dashboard.
4. Personal Finance overview, accounts, transactions, budgets, bills, savings, debts and reports.
5. Business Finance overview, contacts, quotes/invoices, expenses, cash flow, P&L, reports and team.
6. AI Intelligence home, assistant, insights, forecasting and history.
7. Markets overview, categories, instrument detail, charts, calendar, analysis, watchlists, alerts, journal and calculators.
8. Financial Planning.
9. Settings, integrations, workspace, subscription, privacy and help.

- [ ] Each route has title, breadcrumbs/context, loading/empty/error/permission states.
- [ ] Route navigation works on desktop/tablet/mobile.
- [ ] Premium preview states are consistent.
- [ ] Placeholder pages explicitly identify unconnected integrations; no fake data presented as real.

**Exit gate:** complete navigable screen map; no dead links or misleading controls.

## 5. Phase 3 — data architecture and backend

- [ ] Choose backend runtime/framework after reviewing existing deployment constraints.
- [ ] Provision a development PostgreSQL database only after explicit project authorization.
- [ ] Design schema, constraints, indexes, migrations and seed fixtures.
- [ ] Define API contracts and Zod schemas.
- [ ] Implement internal user/workspace model and tenant-scoped authorization.
- [ ] Define decimal/currency/timestamp policy.
- [ ] Add audit events and idempotency patterns.
- [ ] Add backup, restore and migration rollback tests.
- [ ] Keep local development fixtures separate from production records.

**Exit gate:** integration tests prove workspace isolation and financial data correctness.

## 6. Phase 4 — Lucia ID integration

- [ ] Obtain official Lucia ID documentation and supported environment details.
- [ ] Confirm token/session model, issuer, audience, signing-key discovery/rotation, claims, callback and logout flow.
- [ ] Implement backend verification using official specification and supported libraries.
- [ ] Create external identity mapping to Ariovelle internal user ID.
- [ ] Handle account linking, duplicate identities, disabled users, revocation and session expiry.
- [ ] Remove Firebase Authentication after replacement passes tests.
- [ ] Do not enable mock auth in production.

**Blocker:** official Lucia ID technical specification is not yet present in this repository context. Do not invent protocol details.

## 7. Phase 5 — core financial functionality

Suggested order:
1. Accounts and transactions.
2. Income and expenses/categories.
3. Budgets and recurring transactions/bills.
4. Savings and debt tracking.
5. Business workspaces, customers, suppliers, invoices and expenses.
6. Cash flow and profit/loss calculations.
7. Reports and export.
8. Financial planning calculators.

- [ ] Add validation and auditability for all mutations.
- [ ] Test currency precision, rounding, dates and timezones.
- [ ] Test concurrent updates and duplicate imports.
- [ ] Preserve legacy import/backup compatibility through versioned migration tools where appropriate.

## 8. Phase 6 — entitlements, subscriptions and billing

- [ ] Implement centralized feature catalogue.
- [ ] Implement plan definitions and configurable quotas.
- [ ] Enforce entitlements server-side on APIs and expensive operations.
- [ ] Implement usage metering and period resets.
- [ ] Implement subscription lifecycle and grace/expiry behavior.
- [ ] Integrate a payment provider only after business account, credentials and webhook docs are available.
- [ ] Verify webhook signatures and idempotency.
- [ ] Test upgrade, downgrade, cancellation, failed payment, refund and expiry.
- [ ] Ensure expired subscriptions never delete or hide ownership of user data.
- [ ] Set final prices/quotas only after unit-economics review.

## 9. Phase 7 — AI Intelligence

- [ ] Define approved data access tools with per-user/workspace authorization.
- [ ] Define prompt, privacy, retention and redaction policies.
- [ ] Meter tokens/costs and enforce plan quotas server-side.
- [ ] Ground analysis in actual financial records and deterministic calculations.
- [ ] Separate fact, calculation, estimate and recommendation in response schema.
- [ ] Add citations/provenance to source records where useful.
- [ ] Add evaluation datasets and regression tests.
- [ ] Require confirmation before any AI-suggested mutation.
- [ ] Do not fabricate missing data or present estimates as facts.

## 10. Phase 8 — Markets

- [ ] Compare market data providers and licensing for forex, precious metals, indices and crypto.
- [ ] Verify display/redistribution rights for web, mobile, caching, derived data and historical data.
- [ ] Implement provider adapters, normalization, timestamps and quality monitoring.
- [ ] Implement instruments, quotes, candles and charting.
- [ ] Add indicators and calculators with deterministic tests.
- [ ] Add economic calendar and fundamental/news source provenance.
- [ ] Add watchlists, alerts and trading journal.
- [ ] Add AI market analysis only when structured data and evidence are sufficient.
- [ ] Add forecast evaluation, calibration and backtesting with look-ahead safeguards.
- [ ] Keep brokerage execution out of scope.

## 11. Phase 9 — migration, testing and launch

- [ ] Inventory existing user data and source formats.
- [ ] Define mapping, validation, deduplication and conflict handling.
- [ ] Create migration dry-run and reconciliation report.
- [ ] Back up source data and verify restore.
- [ ] Run accessibility, responsive, performance and security testing.
- [ ] Test all critical user journeys and subscription gates.
- [ ] Deploy to preview/staging and obtain acceptance.
- [ ] Plan cutover with explicit owner approval and rollback trigger.
- [ ] Keep legacy deployment/data available until migration is reconciled and accepted.
- [ ] Monitor errors, performance, data integrity and billing after launch.

## 12. Initial implementation milestone (first working foundation)

The first deliverable should be a navigable, responsive Ariovelle shell, not a claim that all financial services are production-ready.

- [ ] Brand and theme tokens.
- [ ] Desktop/tablet/mobile navigation.
- [ ] Overview dashboard shell with labelled demo fixtures only.
- [ ] Screen scaffolds for all product divisions.
- [ ] Free/premium upgrade preview.
- [ ] Central feature-key catalogue and demo-only entitlement provider.
- [ ] Build/test check.
- [ ] Clear list of integration blockers.

No live auth, payments, market quotes or financial persistence should be implied until integrated and verified.

## 13. Definition of done for any phase

- Requirements and acceptance criteria met.
- Relevant automated tests added and run.
- Typecheck/build passes or existing failures are explicitly recorded.
- No secrets or real customer data in changes.
- Accessibility and responsive checks completed for UI work.
- Security and tenant isolation checks completed for backend work.
- Documentation/status updated.
- No production deployment or merge without explicit approval.
