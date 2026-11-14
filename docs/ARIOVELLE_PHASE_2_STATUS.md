# Ariovelle Phase 2 — Authoritative Progress Record

**Authority:** This is the single source of truth for Phase 2 execution status. Update this file whenever a Phase 2 task changes state. Other documents provide requirements and technical detail; they must link here rather than maintain competing checkboxes.

**Last reconciled:** 2026-11-14  
**Repository:** `trendorafindsinc-jpg/trendoratools`  
**Branch:** `feat/ariovelle-phase-1-design-system`  
**Reconciled HEAD:** `39ba92cc3d92a5d754233989ef8de4a310567349`  
**Latest inspected CI:** [run 43502170023](https://github.com/trendorafindsinc-jpg/trendoratools/actions/runs/43502170023) — completed successfully.  
**Scope:** Ariovelle only. Lucia Core is owned by its separate agent; do not modify its repository, branches, database, settings or deployments. Treat its status as externally owned and wait for its agent's verified handover.

## 1. Executive status

**Current phase: Phase 2 — Backend Foundation, in progress.**

The source/data audit, health-only API baseline, PostgreSQL adapter, workspace/RLS foundation, and Ariovelle-side OIDC/session implementation exist. The disposable development database has the five checked-in schema/security migrations represented in its live catalog. Phase 2 is **not complete**: API routing/contract work, reproducible DDL migration tracking, automated database migration verification, provider end-to-end verification, and authenticated user/workspace APIs remain open.

No financial domain schema or financial CRUD API is implemented. No production database, production authentication, production deployment, payment, AI, or market-data integration is enabled.

Phase 1 design-system acceptance remains conditional and is tracked separately in `docs/ARIOVELLE_IMPLEMENTATION_PLAN.md`; it does not change the current Phase 2 execution sequence.

## 2. Phase 2 work-package ledger

| Package | Status | Evidence / remaining work |
|---|---|---|
| P2.0 Source and data audit | **Complete** | Recursive feature-branch inventory, Firebase/Auth/Firestore/local persistence/export/PWA/analytics/deployment audit recorded in `docs/REPOSITORY_AUDIT.md`. Owner approved clean start; legacy beta-tester Firebase data is out of scope. |
| P2.1 API scaffold and contracts | **Partially complete** | Health endpoints, shared HTTP helpers, typed health client and tests exist. Still required: shared route composition/error middleware, Zod request/response contracts for the first authenticated domain, Vercel function routing/preview acceptance. |
| P2.2 Database migrations and persistence boundary | **Partially complete** | SQL migrations 0001–0005 are in source and their structural objects are present in the disposable DB. PostgreSQL adapter/pool and safe config exist. Still required: DDL migration ledger/runner with checksums and advisory locking; reconcile/bootstrap migration history without blindly replaying DDL; automated migration smoke test from an empty disposable branch; repeatable test reset/rollback strategy. |
| P2.3 Lucia ID provider integration | **Ariovelle implementation complete; external provider gate blocked** | OAuth start/callback, PKCE, strict ID-token/JWKS/nonce/UserInfo validation, one-time transaction storage and local sessions are implemented. Live discovery/JWKS/token/UserInfo and end-to-end login cannot be accepted until Lucia Core's agent confirms a reachable canonical issuer and nonce propagation. Keep login disabled. |
| P2.4 Authenticated user/workspace APIs | **Not complete; gated** | Session/workspace authorization primitives exist. Still required: server route composition, `/me`, workspace list/read/create and preference APIs, audit events, two-user/two-workspace IDOR and privilege tests. Must first resolve provider test gate and review the narrowly scoped onboarding/bootstrap database function. |
| P2.5 Legacy migration dry-run | **Not required for approved clean-start path** | Owner explicitly excluded beta-tester Firebase records and local beta data from migration. Do not build or run Firebase export/import tooling for this path. Keep legacy Firebase implementation intact until separate retirement approval. Reopen only if owner changes the decision. |
| P2.6 Controlled legacy import | **Not required for approved clean-start path** | No Firebase/user-data import is authorized or required. This is not a completed import; it is out of scope by owner decision. Future user-initiated imports/exports are separate product requirements. |

### Package ordering

1. Finish P2.1 API composition, validation contracts and Vercel route acceptance without live auth or financial writes.
2. Finish P2.2 DDL migration ledger/runner and reproducible migration smoke/reset tests on disposable branches only.
3. Obtain Lucia Core agent's provider handover and complete P2.3 live test-environment verification; do not edit Core.
4. Complete P2.4 authenticated user/workspace endpoints and security tests.
5. Close Phase 2 with a security review, clean build/CI, reproducible database setup, documentation reconciliation and explicit owner acceptance.

P2.5/P2.6 remain excluded unless the clean-start decision changes.

## 3. Live database reconciliation — read-only inspection

**Inspected resource:** Neon project `ariovelle-dev`, default branch `main`, database `ariovelle_dev`, PostgreSQL `17.12`. Inspection used the database owner role for catalog reads only. No SQL writes, DDL, role changes, credential retrieval, fixture cleanup or migration execution occurred during this reconciliation.

### Checked-in migrations and observed catalog

| Migration | Checked-in purpose | Live catalog evidence | Reconciliation |
|---|---|---|---|
| 0001 `foundation` | Nine foundation tables: users, external identities, profiles, preferences, workspaces, memberships, audit events and two data-import provenance tables | All nine tables exist | **Structurally present** |
| 0002 `request_context_and_rls` | `app_private` context/membership helpers and RLS policies | Five base helper functions and 17 policies are present; all nine original tables have RLS enabled | **Structurally present** |
| 0003 `runtime_role_grants` | Least-privilege runtime grants, default privileges and timeouts | Runtime grants and role timeouts are present; runtime role is non-superuser, cannot create roles/databases and has no BYPASSRLS | **Structurally present; verify grant diff in migration tests** |
| 0004 `lucia_identity_sessions` | `app_sessions` and identity/session bootstrap, resolve and revoke functions | Table plus three functions exist; RLS enabled; runtime has function EXECUTE and no direct table grant | **Structurally present** |
| 0005 `lucia_oauth_transactions` | `oauth_transactions` and create/consume functions | Table plus two functions exist; RLS enabled; runtime has function EXECUTE and no direct table grant | **Structurally present** |

Observed catalog totals:
- 11 public tables: the nine foundation tables plus `app_sessions` and `oauth_transactions`.
- RLS enabled on all 11 tables.
- 17 policies on the original foundation tables. The two auth-support tables have RLS enabled with no runtime policies; access is through narrow SECURITY DEFINER functions.
- 10 functions in `app_private`: five request-context/membership helpers, three identity/session functions and two OAuth transaction functions.
- `ariovelle_runtime`: `rolsuper=false`, `rolcreaterole=false`, `rolcreatedb=false`, `rolbypassrls=false`; timeouts are 10s statement, 2s lock and 15s idle-in-transaction.
- `ariovelle_owner` is not superuser but has role/database creation and BYPASSRLS capabilities. It is an administrative migration role and must never be used by application runtime.
- Runtime has no direct table grants on `app_sessions`, `oauth_transactions`, `migration_batches` or `migration_records`. Runtime EXECUTE is present on the reviewed private functions.
- No DDL migration ledger table exists. `migration_batches` and `migration_records` are data-import provenance tables, not schema-migration history.

### Data present in the development database

The database is **not empty**. Current row counts:

| Table | Rows |
|---|---:|
| users | 2 |
| external_identities | 2 |
| user_profiles | 2 |
| user_preferences | 2 |
| workspaces | 2 |
| workspace_memberships | 2 |
| app_sessions | 2 |
| oauth_transactions | 1 |
| audit_events | 0 |
| migration_batches | 0 |
| migration_records | 0 |

The two synthetic identity/workspace/session fixtures and one consumed OAuth transaction fixture are documented in the runtime verification report. They are test fixtures, not customer/beta-tester/financial records. **Do not delete or clean them up without explicit owner authorization.**

### Limits of migration verification

There is no DDL migration ledger or recorded checksum for migrations 0001–0005. The live catalog confirms the expected tables, columns, RLS state, policy/function signatures and runtime privileges are present, and the newer migration-specific objects match 0004/0005. This is strong structural evidence that the migrations were applied, but it is **not cryptographic proof of exact SQL-file execution, order or checksum**. The next P2.2 task must add a migration ledger and a controlled baseline-reconciliation procedure; do not blindly rerun the existing non-idempotent SQL files against this database.

No financial tables exist. No production or staging database was inspected.

## 4. Authentication and runtime boundaries

- Ariovelle's OAuth adapter and local session implementation are present and have unit tests.
- The database integration tests are opt-in in ordinary CI; the last recorded CI run passed 13 test files / 64 tests, while two PostgreSQL suites were skipped because CI did not receive database credentials.
- The disposable Neon catalog and prior runtime-role integration checks provide separate development evidence; they do not replace provider end-to-end testing.
- `LUCIA_AUTH_ENABLED` must remain false until the Lucia Core agent supplies a reachable canonical issuer, nonce propagation is verified, exact discovery/JWKS and token/UserInfo behavior pass, and Ariovelle's complete sign-in/session/workspace/logout flow passes.
- A preview-only `DATABASE_URL` was subsequently configured in Vercel for the disposable development DB using `ariovelle_runtime`. This does **not** mean the pool is wired into HTTP route composition or that financial persistence is enabled. Production remains unconfigured.
- Never expose database credentials to the browser or use `ariovelle_owner` for runtime queries.
- No changes to Lucia Core are part of this work.

## 5. Immediate next implementation task — P2.1 completion

**Task:** implement a minimal serverless API composition layer and contract validation for the existing health endpoints, then verify Vercel function routing on an owner-approved manual preview deployment (only if the owner separately authorizes that deployment).

Scope:
1. Define a single route-handler composition contract for method handling, request ID propagation, safe error mapping and no-store/security headers.
2. Add Zod schemas for health/readiness response DTOs and the first future `/me` and workspace DTO shapes only; do not add authenticated routes yet.
3. Route the existing `/api/health/live` and `/api/health/ready` handlers through the shared composition layer.
4. Keep readiness honest: report configured dependencies separately from connected/verified dependencies. A present environment variable is not proof of a successful database connection.
5. Add unit tests for valid/invalid DTOs, malformed input, unsupported methods, thrown exceptions, request ID consistency, cache/security headers and no secret/detail leakage.
6. Add an API routing acceptance check that can be run against a local Vercel-compatible runtime and, after explicit preview-deployment approval, the manual preview URL.
7. Do not wire the database pool, enable Lucia auth, create user/workspace routes, add financial writes, change Vercel auto-deploy, or deploy production.

### Acceptance tests

- Existing health endpoints return the documented JSON contract and correct status codes.
- Unsupported methods return the standard 405 response and `Allow` header.
- Every response includes a request ID and the established no-store/security headers.
- Internal exceptions produce a generic 500 response with request ID; no stack trace, SQL, credentials or provider response is exposed.
- Zod rejects malformed/unknown response shapes and validates the typed DTOs used by the frontend client.
- Unit tests prove the shared handler preserves method, request ID and error semantics.
- Local Vercel-compatible routing resolves both health endpoints at their expected paths.
- Manual preview routing is verified only after owner approval; no automatic deployment is triggered.
- `npm ci`, `npm test` and `npm run build` pass in CI.
- No auth/session, database connection, financial read/write, production secret or deployment behavior is introduced.

## 6. Following task — P2.2 DDL migration control

After P2.1 acceptance, add a dedicated schema-migration ledger (separate from data-import provenance), migration runner, immutable checksums, transaction/advisory locking, drift detection and empty-database smoke tests. First establish a reviewed baseline for already-applied 0001–0005 on the disposable development branch; do not silently stamp or replay migrations. Prove a clean database can be built from the checked-in SQL in order and that a rerun refuses checksum drift.

## 7. Explicitly out of scope / release gates

- Firebase beta-tester data export/import: not required under the owner's clean-start decision.
- Lucia Core implementation: owned by its agent; read-only inspection only if essential to Ariovelle integration.
- Production database provisioning, migration or connection.
- Production deployment, merge to `main), domain changes or Vercel auto-deployment.
- Enabling Lucia login before provider end-to-end verification.
- Financial data tables or financial CRUD before the backend foundation and financial schema design are accepted.
- Payment, AI and market-data integrations until their separate product, security, licensing and commercial gates are satisfied.

## 8. Evidence and related documents

- [Implementation plan](ARIOVELLE_IMPLEMENTATION_PLAN.md)
- [Backend architecture and migration specification](ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md)
- [Repository audit](REPOSITORY_AUDIT.md)
- [Lucia ID integration contract](ARIOVELLE_LUCIA_ID_INTEGRATION_CONTRACT.md)
- [Lucia Core runtime verification](ARIOVELLE_LUCIA_CORE_RUNTIME_VERIFICATION.md)
- [Vercel and identity configuration](ARIOVELLE_VERCEL_AND_LUCIA_CORE_CONFIGURATION.md)

**Update rule:** update this file first whenever a Phase 2 work package, database migration state, provider gate or acceptance result changes. Then update linked specifications only to remove stale statements or explain technical requirements; do not duplicate competing progress checklists.
