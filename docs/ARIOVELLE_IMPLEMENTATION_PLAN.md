# Ariovelle Implementation Plan

**Status:** Phase 1 engineering foundation is implemented and CI-verified on `feat/ariovelle-phase-1-design-system`. A manual Vercel preview is ready. Responsive screenshot captures exist, but pixel-level visual acceptance remains open; see the conditional sign-off record below.

## Progress log — 2026-11-13

### Phase 1 initial foundation (committed; CI green)
- [x] Replaced the old top-level navigation shell with Ariovelle's responsive sidebar, topbar and mobile bottom navigation.
- [x] Added dark/light Ariovelle navy, ivory and champagne-gold theme tokens; preserved legacy theme preference as a read fallback.
- [x] Added a central theme toggle in the application shell.
- [x] Added route scaffolds for Business Finance, AI Intelligence, Global Markets and Financial Planning, with explicit not-connected/planned messaging.
- [x] Added compatibility styles so existing finance pages retain their shared glass/card/button primitives during gradual migration.
- [x] Rebranded the existing home page's visible product references.
- [x] Replaced visible legacy settings identity with Ariovelle / Lucia LLC copy and updated export filename.
- [x] Replaced remaining violet home-page accents with the champagne-gold brand accent.
- [x] Clarified unimplemented shell controls; removed inactive notifications and added Escape-key handling, scroll locking, focus trapping and focus restoration to mobile navigation.
- [x] Theme preferences stay synchronized between Settings and the header; storage access now fails safely when browser storage is restricted.
- [x] Rebranded the welcome, authentication, settings and legal screens as Ariovelle / Lucia LLC; removed the autoplaying external welcome video.
- [x] Improved light-theme text/accent contrast and separated gold text from gold button-fill tokens.
- [x] Added lazy loading for workspace routes and an accessible route-loading state.
- [x] GitHub Actions run 43476301845 passed on commit `b25e366`: exact dependency install, TypeScript/Vite production build and all seven financial utility tests, including typechecking the new shared UI primitive library.
- [x] Manual Vercel preview deployment is READY for the current Phase 1 sign-off commit `a141d3b`; HTTP response for `/` is 200 and the document title is Ariovelle. Preview URL: `https://trendoratools-9aku2lkhy-trendoraplc-5738.vercel.app/` (deployment `dpl_6iSTjjtjgUP5oyp7x3pjnqNLGvbp`).
- [x] Responsive screenshot captures of the current preview were generated successfully at 1440px, 768px and 390px widths (capture service status `ready`, `capture_shows=site`).
- [ ] Pixel-level inspection of desktop/tablet/mobile screenshots and interactive authenticated workspace flows.
- [x] Added a reusable UI primitive layer in `src/components/ui/index.tsx`: Button, Input, Select, Card, Dialog, Drawer, Tabs, DataTable, Badge, Tooltip, Toast, Skeleton, EmptyState and ErrorState; Card sections now expose accessible heading associations. The library is ready for adoption by feature pages; existing legacy screens have not all been migrated to it.
- [ ] Confirm remaining legacy dependencies and finalize the Lucia ID migration plan before moving to Phase 2.

### Phase 1 conditional sign-off record — 2026-11-13

**Engineering verification**
- Branch: `feat/ariovelle-phase-1-design-system`.
- Verified code commit: `b25e3668091e41fc81667433d8fbf928a6409a4b`.
- CI: [run 43476301845](https://github.com/trendorafindsinc-jpg/trendoratools/actions/runs/43476301845) — exact dependency install, production build and all seven tests passed.
- Preview: [Ariovelle preview](https://trendoratools-8n5a6g8f1-trendoraplc-5738.vercel.app/) — manual Vercel deployment `dpl_CtnqewDBmivnK2AUYRHbjsYgcw5L`, READY from the verified code commit; not production. Root HTML, manifest and stylesheet respond HTTP 200.
- Preview build output: route chunks are split; main JavaScript bundle is 938.92 kB (250.27 kB gzip). This is an improvement from the earlier 1,022.41 kB (270.51 kB gzip) main bundle, but the main chunk remains large and should be optimized in a later performance pass.

**Responsive capture evidence**
- [Desktop capture — 1440px](https://s0.wp.com/mshots/v1/https%3A%2F%2Ftrendoratools-8n5a6g8f1-trendoraplc-5738.vercel.app%2F?vpw=1440&vph=1200&w=1200&requeue=true)
- [Tablet capture — 768px](https://s0.wp.com/mshots/v1/https%3A%2F%2Ftrendoratools-8n5a6g8f1-trendoraplc-5738.vercel.app%2F?vpw=768&vph=1200&w=1200&requeue=true)
- [Mobile capture — 390px](https://s0.wp.com/mshots/v1/https%3A%2F%2Ftrendoratools-8n5a6g8f1-trendoraplc-5738.vercel.app%2F?vpw=390&vph=1200&w=1200&requeue=true)
- The capture service returned `ready` and `capture_shows=site` for all three widths. The screenshots show the public welcome/onboarding route; they do not exercise the signed-in workspace shell. The latest manual preview build is READY and the HTML route returns HTTP 200 with Ariovelle metadata.
- **Visual QA limitation:** the screenshot service returned shareable capture URLs but this environment cannot render those image bytes for pixel inspection, and the connected browser extension is unavailable. Therefore no claim is made that pixel-level visual QA, horizontal-overflow checks or interactive desktop/tablet/mobile acceptance is complete. The user or a connected browser session must inspect the captures and authenticated shell before final acceptance.

**Shared component and accessibility checks completed in code**
- Mobile drawer: Escape closes, focus is trapped, focus returns to the opener, background scroll is locked while open.
- Navigation: labelled desktop/mobile navigation, active links use React Router's current-page semantics, menu controls expose expanded state.
- Forms: labels wrap inputs; authentication feedback uses status/alert announcements; password visibility control has an accessible name.
- Motion: removed autoplaying external welcome video; global reduced-motion styles remain active.
- Focus: global `:focus-visible` outline uses the brand accent.
- Theme: dark/light/system preference support, header/Settings synchronization and safe storage fallback.
- Light-theme contrast tokens were checked against the `#f5f3ee` surface: `--text-muted` `#5f6b7b` ≈ 4.89:1; `--text-faint` `#596678` ≈ 5.27:1; `--accent-gold` `#80612f` ≈ 5.16:1; `--warning` `#8f5e1c` ≈ 5.00:1. The primary button fill `#a88346` with `#172333` text is ≈ 4.53:1. These are targeted token checks, not a full automated axe/WCAG audit.
- The full reusable component library listed in the Phase 1 requirements is not yet implemented; do not describe it as complete.

**Remaining risks / owner acceptance gates**
- Vercel preview logs contain npm warnings about an unknown `cache-dir` environment config and install scripts not covered by `allowScripts` for `@firebase/util`, `esbuild` and `protobufjs`. The preview build nevertheless completed successfully; investigate the Node/npm version difference (Vercel project currently uses Node 24.x, CI pins Node 20.19.0 / npm 10.8.2) before release.
- Firebase authentication/cloud code remains in the repository; it has not been removed or replaced. Obtain the official Lucia ID integration specification before implementing that migration.
- The canonical/public URL still uses `trendoratools.vercel.app`; choose and configure the final Ariovelle domain separately.
- Legal copy has been rebranded but requires qualified legal review before public launch.
- Git automatic deployments remain disabled by owner request. No production deployment, domain reassignment, merge to `main` or production cutover was performed.

**Decision:** conditional engineering sign-off only. CI and preview build gates pass; visual and full component-library acceptance remain open. Do not mark Phase 1 fully accepted or proceed to production until the screenshot and authenticated-shell review is completed.

**Working branch:** `feat/ariovelle-phase-1-design-system` for Phase 1 implementation and sign-off documentation.

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

**Acceptance status (2026-11-13): conditional; do not treat this phase as fully accepted yet.**

- [x] Add Ariovelle brand tokens and approved geometric mark/brand lockup.
- [x] Establish semantic color tokens for dark/light themes.
- [ ] Establish and document the complete type scale, spacing, radii, elevation, borders and chart palette.
- [x] Create the shared primitive set: Button, Input, Select, Card, Dialog, Drawer, Tabs, DataTable, Badge, Tooltip, Toast, Skeleton, EmptyState and ErrorState. The primitives are implemented and typechecked; migration of legacy screens onto them is a later adoption task.
- [x] Create the responsive AppShell with desktop sidebar, topbar, mobile bottom navigation and mobile navigation drawer. Tablet visual acceptance remains open; tablet currently retains the compact sidebar.
- [ ] Complete functional workspace switching, global search, notifications and user menu. Current workspace identity is static, search is explicitly marked coming soon, inactive notifications were removed, and the profile shortcut opens Settings.
- [x] Implement dark/light/system theme preference and synchronize the shell with Settings.
- [ ] Complete contrast, focus, keyboard, reduced-motion and screen-reader acceptance. Targeted contrast calculations and source-level keyboard/status checks are documented; full browser-based and automated accessibility audits remain open. Dialog/drawer focus trapping, Escape handling, focus restoration and scroll locking are implemented in the shared primitives.
- [ ] Add component examples or Storybook only if it fits existing tooling.

**Exit gate:** design system works at mobile, tablet and desktop widths with no horizontal overflow, keyboard and assistive-technology acceptance, and a reusable primitive set. Screenshot captures exist, but the signed-in workspace and image-level visual inspection still require a connected browser/user review.

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
