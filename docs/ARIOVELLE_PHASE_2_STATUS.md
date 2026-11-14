# Ariovelle Phase 2 — Authoritative Progress Record

**Authority:** This is the single source of truth for Phase 2 execution status. Update this file whenever a Phase 2 task changes state. Other documents provide requirements and technical detail; they must link here rather than maintain competing checkboxes.

**Last reconciled:** 2026-11-14  
**Repository:** `trendorafindsinc-jpg/trendoratools`  
**Branch:** `feat/ariovelle-phase-1-design-system`  
**Code/database inspection baseline:** `39ba92cc3d92a5d754233989ef8de4a310567349` (the subsequent commits in this reconciliation changed documentation only).  
**Previous code baseline verification:** [run 43502170023](https://github.com/trendorafindsinc-jpg/trendoratools/actions/runs/43502170023) — build and tests passed before the current P2.1/P2.2 changes.  
**Current P2.1/P2.2 verification:** pending confirmation of the feature-branch CI run for the new API composition and PostgreSQL migration suite.  
**Documentation reconciliation verification:** [run 43576548363](https://github.com/trendorafindsinc-jpg/trendoratools/actions/runs/43576548363) — completed successfully on `4f0fa8ae9c54335a7fd43470e930e3756e79d188`.  
**Scope:** Ariovelle only. Lucia Core is owned by its separate agent; do not modify its repository, branches, database, settings or deployments. Treat its status as externally owned and wait for its agent's verified handover.

## 1. Executive status

**Current phase: Phase 2 — Backend Foundation, in progress.**

The source/data audit, shared health API composition/contracts, PostgreSQL adapter, workspace/RLS foundation, SQL DDL migration runner and Ariovelle-side OIDC/session implementation exist in the feature branch. The disposable development database still has the five checked-in schema/security migrations represented in its live catalog but does not yet have the new DDL ledger recorded. P2.1/P2.2 code is implemented with CI verification pending; the live preview route check and existing-database baseline reconciliation remain gated. Provider end-to-end verification and authenticated user/workspace APIs remain open.

No financial domain schema or financial CRUD API is implemented. No production database, production authentication, production deployment, payment, AI, or market-data integration is enabled.

Phase 1 design-system acceptance remains conditional and is tracked separately in `docs/ARIOVELLE_IMPLEMENTATION_PLAN.md`; it does not change the current Phase 2 execution sequence.

## 2. Phase 2 work-package ledger

| Package | Status | Evidence / remaining work |
|---|---|---|
| P2.0 Source and data audit | **Complete** | Recursive feature-branch inventory, Firebase/Auth/Firestore/local persistence/export/PWA/analytics/deployment audit recorded in `docs/REPOSITORY_AUDIT.md`. Owner approved clean start; legacy beta-tester Firebase data is out of scope. |
| P2.1 API scaffold and contracts | **Implemented; verification pending** | `api/_lib/route.ts` provides shared method/request-ID/error/header handling; `api/_lib/contracts.ts` defines strict Zod health/readiness and future `/me`/workspace DTOs; both health routes use the composition layer. Unit tests cover malformed input, 405, exception/schema failure, header/request-ID consistency and Vercel filesystem route conventions. CI result and live preview HTTP acceptance are not yet confirmed; preview requires separate manual-deployment approval. |
| P2.2 Database migrations and persistence boundary | **Implemented; verification/baseline pending** | Added `db/migrations/0000_schema_migrations.sql`, `db/migrate.mjs`, checksum/drift/order tests and `db/README.md`. Runner uses a direct migration-owner URL, advisory lock, per-migration transaction+ledger atomicity, explicit existing-schema baseline mode and no destructive reset. CI now provisions ephemeral PostgreSQL 17, applies 0000–0005, reruns/verifies and enables the tenant RLS integration suite. CI result is not yet confirmed. The shared Neon dev DB remains unchanged and still has no DDL ledger; do not replay 0001–0005 there. |
| P2.3 Lucia ID provider integration | **Ariovelle implementation complete; external provider gate blocked** | OAuth start/callback, PKCE, strict ID-token/JWKS/nonce/UserInfo validation, one-time transaction storage and local sessions are implemented. Live discovery/JWKS/token/UserInfo and end-to-end login cannot be accepted until Lucia Core's agent confirms a reachable canonical issuer and nonce propagation. Keep login disabled. |
| P2.4 Authenticated user/workspace APIs | **Not complete; gated** | Session/workspace authorization primitives and shared route composition exist. Still required: authenticated `/me`, workspace list/read/create and preference endpoints, audit events, session-to-workspace binding, two-user/two-workspace IDOR and privilege tests. Must first resolve provider test gate and review the narrowly scoped onboarding/bootstrap database function. |
| P2.5 Legacy migration dry-run | **Not required for approved clean-start path** | Owner explicitly excluded beta-tester Firebase records and local beta data from migration. Do not build or run Firebase export/import tooling for this path. Keep legacy Firebase implementation intact until separate retirement approval. Reopen only if owner changes the decision. |
| P2.6 Controlled legacy import | **Not required for approved clean-start path** | No Firebase/user-data import is authorized or required. This is not a completed import; it is out of scope by owner decision. Future user-initiated imports/exports are separate product requirements. |

### Package ordering

1. Confirm green CI for the new P2.1 API contracts and P2.2 PostgreSQL migration/RLS suite; fix failures before advancing.
2. Read-only preflight and baseline-reconcile migrations 0000–0005 on the existing disposable Neon development database; verify a no-op rerun.
3. Complete the live preview HTTP route check only if the owner separately approves a manual preview deployment; never re-enable Git auto-deploy.
4. Obtain Lucia Core agent's provider handover and complete P2.3 live test-environment verification; do not edit Core.
5. Complete P2.4 authenticated user/workspace endpoints and security tests.
6. Close Phase 2 with a security review, clean build/CI, reproducible database setup, documentation reconciliation and explicit owner acceptance.

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

## 5. P2.1 implementation delivered — verification gates

Implemented on the Ariovelle feature branch:
1. Shared Vercel Node-function composition in `api/_lib/route.ts`: server-generated request ID, method/Allow handling, request Zod validation, response Zod validation, generic safe errors, and no-store/security headers on every response.
2. Strict health/readiness response schemas and future `/me`/workspace DTO schemas in `api/_lib/contracts.ts`.
3. Existing `/api/health/live` and `/api/health/ready` route modules now use the shared composition boundary.
4. Readiness reports whether database/identity configuration is present separately from connectivity, which remains `not_checked`. It never returns secret values or claims a connection was verified.
5. Tests cover health contracts, malformed/unknown request input, unsupported methods, thrown exceptions, response-schema failures, request-ID/header consistency, no detail leakage and filesystem route conventions.

**Verification status:** implementation is committed, but the current CI result has not yet been confirmed. The routing test validates Vercel's filesystem function convention; a real preview HTTP request remains unverified because no deployment was authorized or triggered. Vercel Git auto-deploy remains disabled.

P2.1 acceptance still requires a confirmed green `npm ci`, `npm test`, and `npm run build` CI run. No auth, DB pool, user/workspace endpoint or financial operation was added.

## 6. P2.2 migration tooling implemented — verification and baseline gates

Implemented:
- `db/migrations/0000_schema_migrations.sql` adds the DDL ledger, distinct from data-import provenance.
- `db/migrate.mjs` discovers contiguous migration files, hashes exact UTF-8 contents with SHA-256, rejects unknown/out-of-order/drifted ledger entries, serializes runners with a PostgreSQL advisory lock, and commits each migration plus its ledger row atomically.
- `--plan`, `--apply`, `--verify` and explicit `--baseline-existing --apply` modes are available through the npm scripts. Only `ARIOVELLE_MIGRATION_DATABASE_URL` is read; pooled Neon URLs are rejected.
- Existing-schema baseline mode checks the 11 expected tables and columns, RLS, 17 policies, 10 private functions, role flags/timeouts, protected-table ACLs and runtime function execution before recording 0000–0005. It never replays 0001–0005.
- CI now creates an ephemeral PostgreSQL 17 service with separate migration-owner/runtime roles, applies all six migrations from empty, reruns and verifies the ledger, and runs the RLS integration suite. A second ephemeral database exercises the no-ledger baseline path, then verifies the ledger and no-op rerun. There is no destructive reset command; each CI run starts with a fresh service.
- Operating instructions are in [db/README.md](../db/README.md).

**Verification/baseline status:** the latest CI run for these changes has not yet been confirmed. The shared Neon development database has not been changed: its synthetic fixtures remain untouched and it still has no DDL ledger. After green CI, run a read-only preflight against that database and then use `npm run db:migrate:baseline-existing` only with a direct, dedicated migration-owner URL. The baseline command writes only the DDL ledger; it does not rewrite application rows or replay the old schema migrations.

Do not point the migration runner at the preview runtime `DATABASE_URL`, production, or any pooled connection.

## 7. Next sequence after P2.1/P2.2 verification

1. Confirm the latest feature-branch CI run is green; fix any API, migration, TypeScript or PostgreSQL test failures before proceeding.
2. Run the read-only catalog preflight against the disposable Neon development database. If it matches the baseline assertions, execute the explicit `db:migrate:baseline-existing` command using a direct migration-owner URL. Do not use the runtime URL.
3. Confirm the DDL ledger contains checksums for 0000–0005 and verify a no-op rerun.
4. Obtain Lucia Core agent's verified provider handover and complete P2.3 live test-environment verification; do not edit Core.
5. Complete P2.4 authenticated user/workspace APIs and security tests.
6. Close Phase 2 with a security review, clean build/CI, reproducible database setup, documentation reconciliation and explicit owner acceptance.

P2.5/P2.6 remain excluded unless the clean-start decision changes.

## 8. Explicitly out of scope / release gates

- Firebase beta-tester data export/import: not required under the owner's clean-start decision.
- Lucia Core implementation: owned by its agent; read-only inspection only if essential to Ariovelle integration.
- Production database provisioning, migration or connection.
- Production deployment, merge to `main), domain changes or Vercel auto-deployment.
- Enabling Lucia login before provider end-to-end verification.
- Financial data tables or financial CRUD before the backend foundation and financial schema design are accepted.
- Payment, AI and market-data integrations until their separate product, security, licensing and commercial gates are satisfied.

## 9. Evidence and related documents

- [Implementation plan](ARIOVELLE_IMPLEMENTATION_PLAN.md)
- [Backend architecture and migration specification](ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md)
- [Repository audit](REPOSITORY_AUDIT.md)
- [Lucia ID integration contract](ARIOVELLE_LUCIA_ID_INTEGRATION_CONTRACT.md)
- [Lucia Core runtime verification](ARIOVELLE_LUCIA_CORE_RUNTIME_VERIFICATION.md)
- [Vercel and identity configuration](ARIOVELLE_VERCEL_AND_LUCIA_CORE_CONFIGURATION.md)

**Update rule:** update this file first whenever a Phase 2 work package, database migration state, provider gate or acceptance result changes. Then update linked specifications only to remove stale statements or explain technical requirements; do not duplicate competing progress checklists.
