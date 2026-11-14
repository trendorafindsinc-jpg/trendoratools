# Ariovelle Phase 2 — Authoritative Progress Record

**Authority:** This is the single source of truth for Phase 2 execution status. Update this file whenever a Phase 2 task changes state. Other documents provide requirements and technical detail; they must link here rather than maintain competing checkboxes.

**Last reconciled:** 2026-11-14 (post issuer handover and preview OIDC activation)  
**Repository:** `trendorafindsinc-jpg/trendoratools`  
**Branch:** `feat/ariovelle-phase-1-design-system`  
**Runtime code snapshot:** `4340226f5753e2a9cd671ab20ff3b3c46491e4e0` (documentation updates after this commit do not change deployed application code).  
**Latest runtime-code CI:** [run 43635149009](https://github.com/trendorafindsinc-jpg/trendoratools/actions/runs/43635149009) passed the production build and all 82 tests (18 test files).  
**Latest manual Preview deployment:** `dpl_GRTjJySGXxjW4p32igH8BaoBsBVC` is READY from runtime code commit `4340226` and carries the `ariovelle.lucia.name.ng` alias. Git auto-deploy remains disabled.  
**Documentation reconciliation verification:** [run 43576548363](https://github.com/trendorafindsinc-jpg/trendoratools/actions/runs/43576548363) — completed successfully on `4f0fa8ae9c54335a7fd43470e930e3756e79d188`.  
**Scope:** Ariovelle implementation only. Lucia Core remains owned by its separate agent. Read-only inspection of Core's public provider contract, production registration metadata and security evidence is permitted where essential to Ariovelle integration; do not modify Core's repository, branches, database, settings, secrets or deployments.

## 1. Executive status

**Current phase: Phase 2 — Backend Foundation, in progress.**

The source/data audit, shared API composition, PostgreSQL adapter, workspace/RLS foundation, DDL migration runner, Lucia OIDC callback, local sessions, browser sign-in screen and `/api/auth/me` endpoint are implemented. The shared disposable development database still structurally represents migrations 0001–0005 but has no DDL ledger; migration 0006 is not applied. CI passed on runtime code commit 4340226 (82 tests, 18 files), and the latest manual Preview deployment is READY. Preview authentication remains deliberately fail-closed until the owner approves the safe existing-schema baseline and additive migration 0006. A real browser sign-in/session/logout acceptance remains open.

No financial domain schema or financial CRUD API is implemented. No production database, production authentication, production deployment, payment, AI, or market-data integration is enabled.

Phase 1 design-system acceptance remains conditional and is tracked separately in `docs/ARIOVELLE_IMPLEMENTATION_PLAN.md`; it does not change the current Phase 2 execution sequence.

## 2. Phase 2 work-package ledger

| Package | Status | Evidence / remaining work |
|---|---|---|
| P2.0 Source and data audit | **Complete** | Recursive feature-branch inventory, Firebase/Auth/Firestore/local persistence/export/PWA/analytics/deployment audit recorded in `docs/REPOSITORY_AUDIT.md`. Owner approved clean start; legacy beta-tester Firebase data is out of scope. |
| P2.1 API scaffold and contracts | **Implemented; CI passed on preceding revision** | Shared route composition, strict DTOs, health routes, PostgreSQL adapter and `api/auth/me.ts` are implemented. The current manual Preview deployment is READY. The latest completed CI run passed the build and 82 tests; CI run `43635149009` passed on the runtime code commit. |
| P2.2 Database migrations and persistence boundary | **Implemented; CI passed on runtime code revision; shared DB baseline not applied** | The runner verifies contiguous migrations, SHA-256 checksums, drift/order, advisory locking and per-migration atomicity. Migration 0006 updates transaction-local RLS helper volatility and identity bootstrap context. CI provisions PostgreSQL 17, applies 0000–0006 from empty, exercises existing-schema baseline of 0000–0005 followed by applying 0006, verifies checksums and runs tenant/identity integration tests. CI run 43635149009 passed 82 tests on runtime code commit 4340226. The shared Neon dev DB remains unchanged and has no DDL ledger; do not replay 0001–0005. |
| P2.3 Lucia ID provider integration | **Ariovelle implementation complete; activation gated** | Confidential authorization-code flow, PKCE S256, state/browser binding, encrypted one-time transaction, RS256/JWKS ID-token validation, exact issuer/client audience/expiry/nonce checks, protected UserInfo subject binding, local opaque sessions, logout and browser session bootstrap are implemented. The existing Core client was read-only verified active with its exact callback, audience and unchanged scope assignments. Production issuer/domain and active JWKS key are confirmed. Preview `LUCIA_AUTH_ENABLED=false` remains fail-closed until migration 0006 is applied to disposable Ariovelle dev and one real browser sign-in/session/workspace/logout acceptance passes. |
| P2.4 Authenticated user/workspace APIs | **Partially implemented** | `/api/auth/me` resolves the hashed local session, verified user and active workspace under transaction-local RLS context; `/api/auth/logout` revokes the local session. Frontend startup consumes `/api/auth/me`. Remaining: workspace list/read/create, preferences, audit events, complete session-to-workspace API surface and two-user/two-workspace IDOR/privilege tests. |
| P2.5 Legacy migration dry-run | **Not required for approved clean-start path** | Owner explicitly excluded beta-tester Firebase records and local beta data from migration. Do not build or run Firebase export/import tooling for this path. Keep legacy Firebase implementation intact until separate retirement approval. Reopen only if owner changes the decision. |
| P2.6 Controlled legacy import | **Not required for approved clean-start path** | No Firebase/user-data import is authorized or required. This is not a completed import; it is out of scope by owner decision. Future user-initiated imports/exports are separate product requirements. |

### Package ordering

1. CI run 43635149009 is green: 18 test files, 82 tests and production build passed on runtime code commit 4340226.
2. Obtain explicit owner approval to baseline the existing disposable Ariovelle development schema. Run the read-only preflight, then db:migrate:baseline-existing (records 0000–0005 only) and db:migrate:apply (applies additive 0006) using the direct migration-owner URL, never the runtime URL.
3. Re-enable LUCIA_AUTH_ENABLED=true for Preview only and manually deploy the current branch. Verify the real Lucia authorization-code/PKCE/RS256/UserInfo callback and local session flow in a browser. Do not enable Production.
4. Complete remaining workspace APIs and two-user/two-workspace IDOR and privilege tests.
5. Review the Core signing-key recovery gap with the Core agent; do not change Core production settings or key material.
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
| 0006 `identity_rls_context` | Volatile transaction-context helpers and corrected Lucia identity bootstrap | Not applied to shared Neon dev; exercised on ephemeral CI databases | **Pending shared dev approval** |

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

There is no DDL migration ledger or recorded checksum for migrations 0001–0005. The live catalog confirms the expected tables, columns, RLS state, policy/function signatures and runtime privileges are present, and the newer migration-specific objects match 0004/0005. This is strong structural evidence that the migrations were applied, but it is **not cryptographic proof of exact SQL-file execution, order or checksum**. The DDL migration ledger and controlled baseline-reconciliation procedure are now implemented in the repository. The remaining step is owner-approved baseline reconciliation on the disposable development database, followed by applying only the new migration 0006; do not blindly rerun the existing non-idempotent SQL files.

Follow-up read-only baseline preflight on 2026-11-14 confirmed every expected column, all 11 RLS-enabled tables, exactly 17 public policies and 10 private functions. It also confirmed the owner/runtime role flags, runtime timeouts, private-schema usage and function EXECUTE grants, and zero PUBLIC/direct-runtime ACL entries on the protected provenance/session/OAuth tables. The preflight made no changes.

No Ariovelle financial tables exist. No Ariovelle production or staging database was inspected; the separate Lucia Core Production security audit is recorded in `ARIOVELLE_LUCIA_CORE_RUNTIME_VERIFICATION.md`.

## 4. Authentication and runtime boundaries

- Ariovelle validates the RS256 ID token against the issuer's JWKS, enforces issuer/client audience/expiry/issued-at/nonce, and separately calls protected UserInfo requiring exact subject match. It never trusts the token response's Core-internal user UUID.
- The database integration tests are opt-in in ordinary CI; the last recorded CI run passed 13 test files / 64 tests, while two PostgreSQL suites were skipped because CI did not receive database credentials.
- The disposable Neon catalog and prior runtime-role integration checks provide separate development evidence; they do not replace provider end-to-end testing.
- The frontend redirects through Lucia OIDC, loads Ariovelle's local session from `/api/auth/me`, and revokes it through `/api/auth/logout`. Firebase Auth is no longer used by app startup or the visible sign-in flow. Legacy Firebase files/dependency remain in the repository but are not on the active sign-in path; cloud financial sync is not enabled.
- `LUCIA_AUTH_ENABLED=false` is configured for Ariovelle Preview. Latest manual Preview deployment `dpl_GRTjJySGXxjW4p32igH8BaoBsBVC` is READY with the latest app code and the `ariovelle.lucia.name.ng` alias. Preview sign-in remains disabled until migration 0006 is applied to the disposable dev DB. Production remains disabled.
- Owner confirmed Core Production issuer/domain and live discovery/JWKS. Read-only catalog inspection found the active key `0c05947a954f4edd` in `lucia-core-v2-production` stored as `enc:v1:` and no plaintext row there; Vercel Production metadata has a Sensitive `OIDC_SIGNING_KEY_ENCRYPTION_KEY`. A separate older `lucia-core-production` Neon project still has one active plaintext key row (`0cf51ed2bad69e39`) and must be assessed by the Core agent before retirement. The expected `lucia-core-key-recovery` Neon Object Storage bucket was not found on the inspected current Production branch, so the backup/age-identity recovery evidence remains unverified. No Core source, DB, settings, secret or deployment was changed.
- A preview-only `DATABASE_URL` was subsequently configured in Vercel for the disposable development DB using `ariovelle_runtime`. This does **not** mean the pool is wired into HTTP route composition or that financial persistence is enabled. Production remains unconfigured.
- Never expose database credentials to the browser or use `ariovelle_owner` for runtime queries.
- No changes to Lucia Core are part of this work.

## 5. P2.1 implementation delivered — verification gates

Implemented on the Ariovelle feature branch:
1. Shared Vercel Node-function composition in `api/_lib/route.ts`: server-generated request ID, method/Allow handling, request Zod validation, response Zod validation, generic safe errors, and no-store/security headers on every response.
2. Strict health/readiness response schemas and future `/me`/workspace DTO schemas in `api/_lib/contracts.ts`.
3. Existing `/api/health/live` and `/api/health/ready` route modules now use the shared composition boundary.
4. Readiness reports whether database/complete identity configuration is present separately from connectivity, which remains `not_checked`. Identity configuration checks all six required server-only variables; it never returns secret values or claims a connection was verified.
5. Tests cover health contracts, malformed/unknown request input, unsupported methods, thrown exceptions, response-schema failures, request-ID/header consistency, no detail leakage and filesystem route conventions.

**Verification status:** CI run 43635149009 passed build and 82 tests on runtime code commit 4340226. The latest manual Preview deployment is READY and the Vercel filesystem routing test passes. A real interactive provider login remains unverified. Vercel Git auto-deploy remains disabled.

P2.1 acceptance: shared API composition, `/api/auth/me`, database adapter, and health endpoints are implemented. Latest completed CI verified the build and 82 tests. The app does not expose financial writes or server-side financial persistence.

## 6. P2.2 migration tooling implemented — verification and baseline gates

Implemented:
- `db/migrations/0000_schema_migrations.sql` adds the DDL ledger, distinct from data-import provenance.
- `db/migrate.mjs` discovers contiguous migration files, hashes exact UTF-8 contents with SHA-256, rejects unknown/out-of-order/drifted ledger entries, serializes runners with a PostgreSQL advisory lock, and commits each migration plus its ledger row atomically. The ledger itself has RLS enabled and no PUBLIC/runtime table grants.
- `--plan`, `--apply`, `--verify` and explicit `--baseline-existing --apply` modes are available through the npm scripts. Only `ARIOVELLE_MIGRATION_DATABASE_URL` is read; pooled Neon URLs are rejected.
- Existing-schema baseline mode checks the 11 expected tables and columns, RLS, 17 policies, 10 private functions, role flags/timeouts, protected-table ACLs and runtime function execution before recording the existing prefix 0000–0005. It never replays 0001–0005 and deliberately leaves 0006 pending.
- CI creates an ephemeral PostgreSQL 17 service with separate migration-owner/runtime roles, applies 0000–0006 from empty, reruns and verifies checksums, and runs the RLS/identity integration suite. A second ephemeral database exercises the no-ledger baseline path, records 0000–0005 only, then applies 0006 and verifies a no-op rerun. There is no destructive reset command; each CI run starts with a fresh service.
- Operating instructions are in [db/README.md](../db/README.md).

**Verification/baseline status:** CI run 43635149009 passed 82 tests and the production build. A fresh read-only preflight against the shared Neon development database passed on 2026-11-14: all 11 expected tables and columns are present, RLS is enabled on all 11, there are 17 public policies and 10 `app_private` functions, runtime private-schema/function permissions and timeouts match, owner/runtime role flags match, and protected tables have zero PUBLIC/direct-runtime ACL entries. The database remains unchanged: synthetic fixtures are untouched, `schema_migrations` is still absent, and no financial tables exist. After owner approval, use `npm run db:migrate:baseline-existing` only with a direct, dedicated migration-owner URL. It verifies and records 0000–0005 only. Then run `npm run db:migrate:apply` to apply additive migration 0006. These steps do not rewrite application rows or replay the old schema migrations.

Do not point the migration runner at the preview runtime `DATABASE_URL`, production, or any pooled connection.

## 7. Next sequence after P2.1/P2.2 verification

1. CI run 43635149009 passed on runtime code commit 4340226: production build and 82 tests across 18 files.
2. Obtain explicit owner approval to baseline the disposable Ariovelle development schema. Execute `db:migrate:baseline-existing` to record 0000–0005, then `db:migrate:apply` to apply 0006; use the direct migration-owner URL, never the runtime URL.
3. Re-enable Preview login and manually deploy after the shared dev migration. Perform one real browser sign-in, callback, `/api/auth/me`, workspace resolution and logout.
4. Complete remaining workspace APIs and two-user/two-workspace IDOR and privilege tests.
5. Review the Core signing-key recovery gap with the Core agent. Production issuer/domain and active client registration are already verified; do not repeat or change that work.
6. Close Phase 2 with a security review, clean build/CI, reproducible database setup, documentation reconciliation and explicit owner acceptance.

P2.5/P2.6 remain excluded unless the clean-start decision changes.

## 8. Explicitly out of scope / release gates

- Firebase beta-tester data export/import: not required under the owner's clean-start decision.
- Lucia Core implementation: owned by its agent; read-only inspection only if essential to Ariovelle integration.
- Production database provisioning, migration or connection.
- Production deployment, merge to `main), domain changes or Vercel auto-deployment.
- Enabling Ariovelle Production login before Preview acceptance, dev migration and explicit release approval.
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
