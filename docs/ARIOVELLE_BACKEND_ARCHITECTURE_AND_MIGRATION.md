# Ariovelle Backend Architecture and Data Migration Specification

**Status:** Approved Phase 2 implementation specification. A disposable development Neon database has been explicitly authorized and provisioned; production infrastructure and deployment remain unauthorized.  
**Product owner/operator:** Lucia LLC.  
**Product:** Ariovelle.  
**Target branch:** `feat/ariovelle-phase-1-design-system`.  
**Canonical product domain:** `https://ariovelle.lucia.name.ng/`.  
**Document authority:** This document is the authoritative backend and migration instruction set. Where older phase numbering in `docs/ARIOVELLE_IMPLEMENTATION_PLAN.md` conflicts, follow this document's Phase 2 sequence and update the plan when implementation begins.

---

## 0. Codex execution contract — read before coding

Codex MUST follow these rules. They are acceptance requirements, not suggestions.

1. Read `AGENTS.md`, this document, `docs/ARIOVELLE_PRODUCT_SPEC.md`, `docs/ARIOVELLE_IMPLEMENTATION_PLAN.md` and `docs/REPOSITORY_AUDIT.md` before changing code.
2. Work only on `feat/ariovelle-phase-1-design-system` or a new owner-approved feature branch created from it. Never push to `main`.
3. Do not deploy, provision additional Neon projects/databases, create production credentials, change Vercel settings, enable automatic deployments, or perform production data operations. The sole approved disposable development project is `ariovelle-dev` (`super-base-35733977`) in `aws-eu-central-1`; it is not production. Git auto-deployment remains disabled. Manual preview deployment requires a separate explicit request.
4. Do not remove Firebase packages, files, rules, auth flows, cloud backup, or legacy identifiers in the foundation milestone. They are preservation dependencies until the migration gates in section 11 pass.
5. Do not invent Lucia ID protocol details. No guessed issuer, audience, token claims, JWKS URL, OAuth/OIDC endpoints, SDK, callback, logout semantics, session lifetime, or key rotation behavior. The official Lucia ID specification is a hard blocker for a real provider adapter.
6. Do not use Firebase Auth or Neon Auth as the new identity provider. Lucia ID is external identity; Ariovelle owns its own application database and internal user IDs.
7. Do not treat the legacy Firebase-generated `LUCIA-XXXXXXXX` identifier as a verified Lucia ID. It is a legacy application-generated label derived from Firebase UID.
8. Do not expose database credentials, provider secrets, service keys, or privileged operations to the browser. Never use a `VITE_` prefix for secrets.
9. Never use JavaScript `number` / SQL floating-point types for persisted or calculated money. Never assume every currency has two fractional digits.
10. Every read and write must be scoped to a verified internal user and an authorized workspace. Hiding UI routes is not authorization.
11. Do not silently merge, overwrite, delete, or migrate customer data. Migration must be versioned, dry-run, idempotent, auditable, reconciled and reversible.
12. Keep production user data accessible regardless of subscription. Entitlements may limit advanced features, never ownership of existing records or basic export.
13. Do not add demo financial records that look real. Fixtures must be clearly labelled and isolated from production.
14. Before every implementation step, state its scope, files to change, data/security implications and tests. Make small changes. Run actual tests/build and report exact outcomes.
15. If a required input is missing, stop at an interface or documented TODO with a clear blocker. Do not guess to make the build appear complete.

## 0.1 Legacy beta data disposition — owner decision (2026-11-13)

The owner has confirmed that the existing Firebase accounts and records belong only to beta testers and are not real customer data. **Ariovelle will not migrate legacy Firebase Auth users, Firestore records, or local beta-tester records into the new PostgreSQL application.** The Firebase export/reconciliation runbook is retained as historical documentation only; no owner export is required for the new-build path.

Implementation consequences:
- Treat the new Ariovelle data model as a clean start. New users receive new Ariovelle internal UUIDs and link only through the approved Lucia ID integration once its official technical documentation is available.
- Do not import Firebase UIDs as external identities, do not map legacy email addresses to Lucia ID accounts, and do not seed production with beta-tester financial records.
- Preserve the legacy Firebase implementation and existing deployment until the replacement has passed acceptance and the owner separately approves retirement. The decision not to migrate beta data is not permission to delete or alter the Firebase project.
- If the owner later requests recovery of beta records, treat that as a new, separately scoped export/import project with explicit approval.
- The initial PostgreSQL schema may include migration provenance tables for future controlled imports, but no Firebase migration batch should be created by default.

## 1. Audit scope and observed baseline

This specification is based on a read-only inspection of selected files on the Ariovelle feature branch on 2026-11-13. It is deeper than the earlier default-branch baseline, but it is not a complete local runtime, security or data audit. Codex must continue inspecting the full repository before modifying relevant code.

### 1.1 Current application architecture

- Frontend: React 18 + TypeScript + Vite 5 + React Router 6.
- State: Zustand 4 with browser `localStorage` persistence.
- Styling: Tailwind CSS 3 and the Ariovelle design tokens.
- PWA: `vite-plugin-pwa`.
- Mobile wrapper: Capacitor 6 / Android.
- Tests: Vitest.
- Hosting: Vercel project; Git-triggered automatic deployments are disabled by owner request.
- Package lock and reproducible npm install have been added. CI pins Node 20.19.0 / npm 10.8.2.

Do not replace the frontend framework as part of Phase 2. The existing Vite SPA can call a same-origin serverless API.

### 1.2 Existing identity and cloud dependencies

Observed files:
- `src/lib/firebase.ts`: initializes Firebase App, Firebase Auth and Firestore using public `VITE_FIREBASE_*` configuration.
- `src/lib/lucia-auth.ts`: uses Firebase email/password, Google popup/redirect, password reset, auth-state listener and Firestore profile writes.
- `src/components/LuciaAuth.tsx`: current sign-in/sign-up UI is directly coupled to Firebase configuration and Firebase auth methods.
- `src/App.tsx`: imports Firebase `User`, subscribes to the Firebase auth listener, completes Google redirect, and starts/stops cloud sync.
- `src/lib/lucia-cloud-sync.ts`: syncs user collections to Firestore path `users/{uid}/products/trendora-tools`.
- `firestore.rules` and `firebase.json`: legacy Firestore rules/config remain in the repo.
- `.env.example`: currently documents Firebase client configuration as “LUCIA ID”; that wording is inaccurate and must be corrected during the auth migration, not used as proof of a Lucia ID integration.

Important identity distinction:
- `ensureLuciaIdentity()` in `src/lib/lucia-auth.ts` constructs a display identifier from the Firebase UID when no profile identifier exists. This is not proof that the user has authenticated with the global Lucia ID provider.
- Firebase UID is a legacy provider subject only. It may be retained as a migration source reference, never as the new Ariovelle internal user ID.
- Email address alone is not sufficient proof to link an old Firebase account to a Lucia ID identity.

### 1.3 Existing financial data and local persistence

Observed files:
- `src/store.ts`: one Zustand store contains expenses, incomes, budgets, savings goals, bills, debts, custom categories and chat messages.
- Zustand persist key: `trendoratools-v10`; persist schema version: `2`.
- The partialized persisted state excludes chat messages. Cloud sync currently includes chat.
- `src/types.ts`: legacy records have string IDs, numeric amount fields and no currency field.
- `src/lib/utils.ts`: `toMinorUnits()` converts entered major-unit amounts to integer hundredths; `formatMoney()` defaults to NGN. Existing record values therefore appear to be minor units with a two-decimal assumption, but historical records do not carry their own currency or exponent.
- `src/store.ts` export emits JSON with `version: "1.0.0"`; import validates only a minimal shape and then replaces arrays.
- `src/pages/Settings.tsx`: provides local JSON export/import and legacy Lucia Cloud backup/restore controls.
- `src/lib/lucia-cloud-sync.ts`: Firestore collection names are `expenses`, `incomes`, `budgets`, `savingsGoals`, `bills`, `debts`, and `chat`; custom categories are stored in `_meta/profile`.

### 1.4 Existing sync behavior is not a safe migration mechanism

The current cloud sync implementation:
- Reads complete Firestore collections and local arrays.
- Merges by record ID, with remote values overwriting local values on duplicate IDs.
- Writes local records to Firestore.
- Deletes every remote record whose ID is absent from the local array.
- Uses delayed whole-store sync and a JSON snapshot as its change detector.
- Has no explicit per-record version, tombstone, conflict queue, migration batch, idempotency key or three-way merge.

**Do not reuse this sync algorithm for the new backend or use it as a migration engine.** Its delete behavior can interpret a stale/incomplete local snapshot as intentional deletion. Its merge behavior is not a defined conflict policy. Replace it only after a safe, tested data migration and user-facing export path exist.

### 1.5 Existing data limitations to preserve and resolve

- Legacy amount values do not include currency. NGN is the current display default, not definitive proof that every historical record is NGN.
- Legacy amount helpers assume two decimal places. Do not silently convert historical values to a different currency exponent.
- Several record types have no explicit created/updated timestamps or soft-delete history.
- Savings goal balances and debt remaining balances are stored as mutable summary fields; historical contributions/repayments are not necessarily reconstructable.
- Bills have a paid boolean but no payment event history.
- Income has a recurring boolean, not a complete recurrence schedule.
- Expenses and incomes are separate arrays, not a normalized transaction ledger.
- Existing string IDs must be preserved as source identifiers during migration even if new canonical IDs are UUIDs.
- The legacy JSON import is permissive and must not be used to ingest untrusted data without a new strict schema validator.

### 1.6 Keep/adapt/replace decision

| Existing area | Decision | Instructions |
|---|---|---|
| React/Vite/TypeScript frontend | Keep | Continue same app and add API client |
| React Router and Ariovelle shell | Keep/adapt | Do not redesign as part of backend setup |
| Zustand UI state | Keep/adapt | Use for transient/cache state; server becomes canonical for signed-in financial data |
| Existing financial calculations | Audit/adapt | Verify units, rounding and date semantics before reuse |
| Existing local export format | Preserve/adapt | Build a versioned migration importer and maintain user export |
| Firebase Auth | Retire only after Lucia ID migration | No removal in foundation work |
| Firestore/Lucia Cloud sync | Retire only after data reconciliation | Do not reuse its sync algorithm |
| Firebase rules/config | Preserve until cutover | Remove only after documented retention/legal review |
| PWA/offline behavior | Audit/adapt | Never cache authenticated API responses or sensitive financial records in service-worker CacheStorage |
| Capacitor wrapper | Keep provisionally | Keep current app ID until Android upgrade impact is assessed |
| Analytics | Audit/adapt | Do not emit financial payloads, identity tokens or sensitive data |

---

## 2. Target architecture

### 2.1 High-level architecture

Use a modular monolith initially. Do not split into microservices.

1. **Client:** existing React + TypeScript + Vite SPA.
2. **HTTP API:** same-origin Vercel serverless functions, versioned under `/api/v1`. Use a lightweight TypeScript router (Hono is the preferred candidate) rather than starting a permanently running Express server.
3. **Validation/contracts:** Zod schemas shared where safe between client and server; server always validates independently.
4. **Application/domain layer:** framework-independent TypeScript services for identity mapping, workspace authorization, financial domain operations, imports and entitlements.
5. **Persistence:** PostgreSQL, with Neon as the preferred hosting candidate, subject to owner authorization before provisioning.
6. **Database access/migrations:** Drizzle ORM + checked-in SQL/Drizzle migrations. Use parameterized queries only. Review generated SQL.
7. **Observability:** structured, redacted logs and request correlation IDs. Never log passwords, bearer tokens, cookies, full financial payloads or raw identity-provider responses.
8. **External providers:** Lucia ID for identity only after official specification is obtained. Payment, AI and market providers are separate adapters and are out of scope for the first backend foundation.

### 2.2 Runtime and hosting constraints

- Keep Vite as the frontend build.
- Add server functions using the Vercel-supported function entry convention after confirming the repository's Vercel configuration and current runtime support.
- Serve API and SPA on the same Ariovelle origin where possible. This reduces CORS complexity.
- API prefix: `/api/v1`.
- Health endpoints: `GET /api/health/live` and `GET /api/health/ready`. Readiness may check database connectivity but must not disclose internal details.
- Use the Node runtime for database and cryptographic libraries unless a provider explicitly supports another runtime.
- Use a pooled Neon connection string for serverless traffic. Never connect directly from the browser.
- Do not create an always-on background process inside a Vercel request. Long-running jobs require a separately selected queue/worker provider and explicit approval.
- Configure a dedicated development database/branch and separate staging/production credentials. Never point local tests at production.
- Database provisioning is not authorized by this specification.

### 2.3 Module boundaries

Recommended server source layout (adapt to repository conventions only after inspection):

```text
api/
  health/
    live.ts
    ready.ts
  v1/
    me.ts
    workspaces/
      index.ts
      [workspaceId].ts
src/
  server/
    app.ts
    config/
      env.ts
    auth/
      auth-provider.ts
      auth-context.ts
      lucia-id-adapter.ts
      dev-auth-adapter.ts
    db/
      client.ts
      schema/
      migrations/
    middleware/
      authenticate.ts
      authorize-workspace.ts
      request-id.ts
      error-handler.ts
      rate-limit.ts
    modules/
      users/
      workspaces/
      audit/
      entitlements/
      imports/
    shared/
      errors.ts
      ids.ts
      pagination.ts
      validation.ts
  services/
    api-client.ts
    auth/
    workspace/
```

The exact Vercel file layout may require a single catch-all function or individual function files. Confirm Vercel's current routing behavior before implementation; do not duplicate the same API route in multiple handlers. Keep domain services independent of Vercel request/response objects.

### 2.4 Authentication adapter — strict provider boundary

Define an interface before a real provider implementation. The interface must not encode guessed Lucia ID claims.

Conceptual contract:

- `beginSignIn(input)` — only if the official protocol requires a browser redirect/authorization step.
- `completeSignIn(input)` — validates the provider response using official documented rules.
- `verifyRequest(request)` — returns a verified immutable external identity: provider key, subject, and only documented optional claims.
- `beginSignOut(context)` / `completeSignOut(context)` — only as specified by the provider.
- `refreshOrRevalidate(context)` — only if official documentation supports it.

Internal normalized identity:
- `provider`: stable configured provider key, e.g. `lucia-id`.
- `issuer`: exact verified issuer from official configuration, if the protocol supplies one.
- `subject`: exact stable provider subject from verified authentication.
- `email`, `emailVerified`, `displayName`: optional profile claims only when documented, verified and needed.

Rules:
- External identity uniqueness is `(provider, issuer, subject)`; never use email as the primary identity key.
- Never accept identity fields supplied directly by the browser as proof.
- Never trust an unverified decoded JWT. Verify signature, issuer, audience, expiry, nonce/state and key rotation exactly as official Lucia ID docs require if the official protocol is JWT/OIDC-based. This is conditional guidance, not an assumption that Lucia ID uses JWT/OIDC.
- Do not store provider access/refresh tokens unless the official integration requires it and the security design explicitly approves encrypted server-side storage.
- Never put provider tokens in localStorage, Zustand persistence, URLs, analytics or logs.
- Use a secure, HttpOnly, SameSite cookie for an Ariovelle session only if the official provider flow and security review support it. Add CSRF protection for cookie-authenticated state-changing requests. Do not assume a cookie exchange flow before reading provider documentation.
- Dev mock identity may exist only in local development and automated tests. It must be impossible to activate in production builds/deployments. Add a hard startup failure if a mock provider is configured in production.
- No Firebase fallback in production after migration acceptance.

### 2.5 Internal user and workspace model

- Ariovelle generates its own UUID internal `users.id`.
- An internal user may link one or more verified external identities.
- Create a Personal workspace for each new user.
- Business workspaces are separate tenants with membership and role checks.
- Every tenant-owned financial/business row includes `workspace_id`.
- A request's user ID comes only from verified server auth context, never from a request body or query parameter.
- A workspace is accessible only if the authenticated user has an active membership and the required permission.
- Roles begin with `owner`, `admin`, `member`, `viewer`; permission checks should be capability-based so roles can evolve.
- Enforce authorization in the application service layer and add PostgreSQL row-level security as defense in depth where compatible with the selected connection/transaction strategy. RLS context must be set transaction-locally from the verified server identity; never trust a client-provided workspace ID as authorization.
- Use a dedicated database runtime role with least privilege. Migrations use a separate privileged role.

---

## 3. PostgreSQL domain model

This is the logical target model. It is not a command to create every product table in the first migration. Implement only foundation tables in Phase 2 and add feature tables with their feature modules.

### 3.1 Foundation tables — Phase 2 scope

#### `users`
- `id UUID PRIMARY KEY`
- `status TEXT NOT NULL` constrained to `active | suspended | deletion_pending`
- `display_name TEXT NULL`
- `primary_email TEXT NULL` (profile/contact field, not identity key)
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

#### `external_identities`
- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `provider TEXT NOT NULL`
- `issuer TEXT NOT NULL` (store exact configured/verified issuer; use documented sentinel only if provider has no issuer concept)
- `subject TEXT NOT NULL`
- `email_snapshot TEXT NULL`
- `email_verified BOOLEAN NULL`
- `linked_at TIMESTAMPTZ NOT NULL`
- `last_authenticated_at TIMESTAMPTZ NULL`
- UNIQUE `(provider, issuer, subject)`
- Index `(user_id)`
- Do not store passwords or raw provider tokens here.

#### `user_profiles`
- `user_id UUID PRIMARY KEY REFERENCES users(id)`
- `first_name TEXT NULL`, `last_name TEXT NULL`, `avatar_url TEXT NULL`
- `locale TEXT NULL`, `timezone TEXT NULL`
- `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

#### `user_preferences`
- `user_id UUID PRIMARY KEY REFERENCES users(id)`
- `theme TEXT NOT NULL DEFAULT 'system'` constrained to `dark | light | system`
- `base_currency CHAR(3) NULL` (ISO 4217; null until user chooses or migration resolves it)
- `timezone TEXT NULL`, `locale TEXT NULL`
- `created_at`, `updated_at TIMESTAMPTZ NOT NULL`

#### `workspaces`
- `id UUID PRIMARY KEY`
- `type TEXT NOT NULL` constrained to `personal | business`
- `name TEXT NOT NULL`
- `owner_user_id UUID NOT NULL REFERENCES users(id)`
- `status TEXT NOT NULL DEFAULT 'active'`
- `created_at`, `updated_at TIMESTAMPTZ NOT NULL`
- Each user gets one personal workspace initially; enforce uniqueness with an appropriate partial unique index or an explicit personal-workspace relation.

#### `workspace_memberships`
- `id UUID PRIMARY KEY`
- `workspace_id UUID NOT NULL REFERENCES workspaces(id)`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `role TEXT NOT NULL` constrained to `owner | admin | member | viewer`
- `status TEXT NOT NULL` constrained to `invited | active | suspended | removed`
- `created_at`, `updated_at TIMESTAMPTZ NOT NULL`
- UNIQUE `(workspace_id, user_id)`
- Index `(user_id, status)`

#### `audit_events`
- `id UUID PRIMARY KEY`
- `actor_user_id UUID NULL REFERENCES users(id)`
- `workspace_id UUID NULL REFERENCES workspaces(id)`
- `action TEXT NOT NULL`
- `entity_type TEXT NULL`, `entity_id TEXT NULL`
- `request_id TEXT NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'` with an allowlist of non-sensitive keys only
- `created_at TIMESTAMPTZ NOT NULL`
- Append-only to application roles. Never place raw financial payloads, secrets or authentication tokens in metadata.

#### `migration_batches` and `migration_records`
- Track source, batch, schema version, status, counts and checksums.
- `migration_records` records source system, source owner key, source collection/type, source record ID, target record ID, source checksum, result/status and error code.
- UNIQUE `(source_system, source_owner_key, source_collection, source_record_id)` for idempotent imports.
- Do not store passwords or raw provider tokens in migration metadata.

### 3.2 Financial tables — introduce with Personal Finance feature

Recommended first finance schema:
- `financial_accounts`: workspace, name, account type, currency code, currency exponent, opening balance and status.
- `transactions`: workspace, account, transaction type, positive integer `amount_minor BIGINT`, currency code, currency exponent, transaction date (`DATE`), optional occurred-at timestamp, category, description, source/provenance, external reference, created/updated timestamps, optional reversal link and version.
- `categories`: workspace or system scope, name, type, parent, active flag.
- `budgets`: workspace, category, period, amount minor, currency and date boundaries.
- `recurring_rules`: workspace, schedule, start/end, timezone and next-run metadata. Do not infer recurrence schedules from a legacy boolean.
- `bills`: workspace, due date, amount/currency, status and recurrence-rule reference where applicable.
- `bill_payments`: immutable payment-record history (recording a payment, not initiating money movement).
- `savings_goals` and `savings_goal_entries`: target plus append-only contribution/withdrawal entries.
- `debts` and `debt_payments`: principal/remaining amount, APR representation and immutable repayment events.
- All amounts include currency. A row must never combine different currencies in one arithmetic total without an explicit FX conversion record/source/time.

### 3.3 Business tables — introduce with Business Finance feature

- `business_profiles`, `contacts` (or separate customers/suppliers with clear constraints), `quotes`, `quote_lines`, `invoices`, `invoice_lines`, `invoice_payment_records`, `business_expenses`.
- Every business row includes `workspace_id`.
- Invoice/payment status transitions are validated server-side and audited.
- These are bookkeeping records only. Do not implement payment initiation, custody, deposits or withdrawals in this scope.
- Do not market the initial product as statutory accounting software without a separate accounting/compliance review.

### 3.4 Billing and entitlements — later phase, schema can be added when needed

- `plans`, `feature_definitions`, `plan_entitlements`, `subscriptions`, `subscription_events`, `provider_payment_events`, `usage_counters`.
- Stable feature keys; quotas/configuration stored centrally.
- Webhook events are signature-verified, idempotent and replay-safe.
- Client redirects never grant paid entitlements.
- Expired plans never delete user data.
- No final prices or quotas are approved. Do not seed invented commercial values.

### 3.5 AI and market tables — later phases only

Add AI conversations/usage/source references and market instruments/provider quotes/candles/news/forecasts only when providers, privacy policy, licensing, retention, cost and quality are approved. Do not add a generic JSON table as a substitute for typed financial or market data.

### 3.6 Monetary representation and time rules

- Preferred persisted amount representation: `BIGINT amount_minor` + `CHAR(3) currency_code` + `SMALLINT currency_exponent`.
- `amount_minor` is an integer string at API boundaries to avoid JavaScript integer precision loss. Domain code uses `bigint` or a tested decimal library; never cast money to `number` for arithmetic.
- Currency exponent comes from a vetted ISO 4217 currency metadata table/library, with explicit versioning; do not hardcode exponent 2 globally.
- Legacy values are integers in hundredths according to the observed helper. Preserve the original raw integer and record the chosen migration interpretation. Do not assume NGN unless source/user evidence and a migration decision support it.
- Persist instants as UTC `TIMESTAMPTZ`. Use SQL `DATE` for due dates, transaction business dates and calendar periods. Store IANA timezone for recurrence and local reporting.
- All rounding rules are explicit and tested. No floating point in money paths.

---

## 4. API contract and behavior

### 4.1 General rules

- Base path `/api/v1`.
- JSON request/response; UTF-8.
- Zod validation on every external input.
- Authenticated endpoints derive user identity from server auth middleware.
- Workspace IDs are selectors, not proof of access; authorize membership and capability on every request.
- List endpoints use cursor pagination, stable ordering and bounded page sizes. Do not expose unbounded collection reads.
- Create endpoints accept `Idempotency-Key` for retryable writes; persist key + request hash + result in a bounded idempotency store/table.
- Updates use version/ETag or an explicit expected version to reject stale writes; return `409 Conflict` on version mismatch.
- Use a consistent error shape: `{ "error": { "code": "MACHINE_CODE", "message": "Safe human-readable message", "requestId": "..." } }`.
- Never return SQL errors, stack traces, provider tokens, secrets or raw internal auth payloads.
- Return money as `amountMinor` string, `currency`, `currencyExponent`.
- Date-only values use `YYYY-MM-DD`; timestamps use RFC 3339 UTC.

### 4.2 Foundation endpoints

Implement only after auth specification and database authorization:
- `GET /api/health/live` — process/function alive.
- `GET /api/health/ready` — readiness; return generic unavailable state if DB cannot be reached.
- `GET /api/v1/me` — current internal user and safe profile.
- `GET /api/v1/workspaces` — memberships for current user only.
- `POST /api/v1/workspaces` — create workspace after role/type validation.
- `GET /api/v1/workspaces/:workspaceId` — only if caller has access.
- `PATCH /api/v1/me/preferences` — validated preference update.
- No finance CRUD endpoint is part of the identity/workspace-only foundation milestone.

### 4.3 Future finance API conventions

- `GET /api/v1/workspaces/:workspaceId/transactions?cursor=&limit=&from=&to=&type=`
- `POST /api/v1/workspaces/:workspaceId/transactions`
- `GET /api/v1/workspaces/:workspaceId/transactions/:transactionId`
- `PATCH /api/v1/workspaces/:workspaceId/transactions/:transactionId`
- `POST /api/v1/workspaces/:workspaceId/transactions/:transactionId/reversals`

Validate account ownership and currency consistency in the service layer. Never trust a client-supplied `userId`, owner ID or workspace role.

---

## 5. Client integration and offline behavior

- Create a typed API client; do not let pages call `fetch` ad hoc.
- Keep auth/session details out of Zustand persisted state.
- For authenticated data, use server responses as canonical source of truth. Zustand may cache normalized query results and UI state but must not silently overwrite server data.
- Distinguish guest/local-only mode from authenticated server-backed mode in state and UI.
- Do not automatically upload guest localStorage data when a user signs in. Present a reviewed import/merge flow with a preview and explicit user confirmation.
- Do not automatically clear guest data after login or account switching.
- When switching users, clear in-memory caches for the previous identity and ensure no previous user's records render while the next user's data loads.
- Offline writes require a separately designed IndexedDB outbox with unique idempotency keys, per-record versions, retry/backoff and explicit conflict states. Do not treat the existing Zustand/Firestore full-state sync as a model.
- Do not cache authenticated API responses or private financial records in service-worker CacheStorage. Static assets may be cached.
- Offline mode should clearly indicate when data is stale and which writes are pending. Phase 2 foundation does not require offline mutation support.

---

## 6. Security, privacy and operational controls

- Validate all environment variables at server startup. Fail closed when required server secrets are absent.
- Proposed server-only environment variable names (not values): `DATABASE_URL`, `APP_ORIGIN`, `LUCIA_ID_*` only after official docs define exact settings, and provider-specific secrets only when approved.
- Client-safe variables may use `VITE_`; no credentials or server secrets may.
- Use HTTPS, secure headers, restrictive CSP where compatible, request size limits, rate limiting and dependency scanning.
- Same-origin API preferred. If cross-origin becomes necessary, allowlist exact origins; never wildcard credentialed CORS.
- Cookie-based session designs require Secure, HttpOnly, appropriate SameSite, CSRF protection and session rotation. Implement only after official Lucia ID flow is known.
- Avoid logging emails where unnecessary. Redact identifiers and financial payloads. No analytics event may contain transaction descriptions, amounts, account numbers, tokens or provider payloads.
- Add data retention, account deletion, export and consent policies before public launch.
- Backups must be encrypted, access-controlled, retention-defined and restore-tested.
- Production and staging data must be isolated. Never copy production data into development fixtures.
- Add dependency/license and vulnerability review before choosing new packages.
- Threat model at minimum: cross-workspace IDOR, stale sessions, account-link takeover, replay, CSRF, XSS/token theft, SQL injection, mass assignment, brute force, data export abuse, migration duplication and log leakage.

---

## 7. Phase 2 implementation sequence (Codex work packages)

Do these in order. Each package must be separately reviewable.

### P2.0 — complete source and data audit (read-only)

- Inspect the complete `src/` tree, all Firebase imports, all calls to `auth`, `db`, Firestore and cloud backup/restore.
- Inspect service worker caching, analytics, environment variable references, import/export, native storage and current CI.
- Run `npm ci`, `npm test`, `npm run build` in a local checkout and record actual results. Do not infer from old CI runs.
- Produce a Firebase dependency graph and legacy data inventory.
- Confirm whether Firestore documents contain data not represented in the current Zustand store.
- Do not print secret values or user data in audit output.
- Deliver updated `docs/REPOSITORY_AUDIT.md` and a keep/adapt/replace/retire matrix.

**Exit:** all auth, data, backup and persistence paths are accounted for.

### P2.1 — backend scaffold, no live identity

- Add server-only runtime/config validation and a health endpoint.
- Add API router and standard error/request-ID middleware.
- Add Zod contracts for health, user/workspace DTOs.
- Add typed frontend API client.
- Add test harness and fake adapters only for unit/integration tests.
- Do not add live auth, finance CRUD, payment, AI or market endpoints.
- Confirm Vercel function routing and local dev proxy behavior before selecting final file layout.

**Exit:** health endpoint and API contract tests pass; frontend build remains green; no secrets required for static UI build.

### P2.2 — database schema and migration tooling (development only)

- Only after owner authorizes a development database and credentials.
- Add Drizzle configuration and first migrations for users, external identities, profiles/preferences, workspaces, memberships, audit events and migration tracking.
- Add schema constraints, indexes, foreign keys and transaction-safe tenant context.
- Add seed fixtures with synthetic users/workspaces only.
- Add database integration tests against an isolated development database.
- No production database and no user data import.

**Exit:** migrations apply from empty database, migrate forward, and test reset in development; tenant isolation tests pass.

### P2.3 — Lucia ID adapter (blocked on official documentation)

- Obtain official Lucia ID integration docs, supported SDK/protocol, test environment and test credentials.
- Document issuer/subject/token/session/redirect/logout/key-rotation semantics from that source.
- Implement only documented behavior and add provider contract tests.
- Map verified external subject to internal user; create personal workspace transactionally.
- Add account-linking and duplicate identity safeguards.
- Keep dev mock impossible to activate in production.
- Do not migrate Firebase auth or remove Firebase in this package.

**Exit:** sign-in, sign-out, expiry/revocation and identity mapping pass integration tests in the provider test environment.

### P2.4 — tenant authorization and user/workspace API

- Add authentication middleware using the verified adapter.
- Add permission/capability service and workspace authorization.
- Implement `/me`, workspace list/create/read, preference update.
- Add two-user/two-workspace IDOR and privilege-escalation tests.
- Add audit events for workspace creation and membership changes.
- No finance data migration yet.

**Exit:** every endpoint rejects unauthenticated, cross-user and unauthorized workspace access.

### P2.5 — legacy migration dry-run tooling

- Implement strict versioned parsers for local JSON backup and Firestore export formats.
- Build read-only source extractors with explicit source owner consent and least-privilege credentials.
- Generate a dry-run report only; do not write to target DB.
- Report record counts by collection, invalid records, duplicates, ID collisions, unknown currency, date anomalies, unsupported fields, missing history and checksum totals.
- Require a currency resolution policy before any amount is imported.
- Do not automatically merge guest local data and cloud records.

**Exit:** deterministic repeatable dry-run with zero unexplained dropped records; owner can inspect and approve the mapping.

### P2.6 — controlled development import and reconciliation

- Requires explicit approval after dry-run review.
- Import into development/staging only; use migration batch IDs and unique source record mapping.
- Use idempotent chunked transactions and resume markers.
- Preserve source IDs and raw source checksums.
- Verify counts and sums per currency, sample records and ownership mapping.
- Never run against production without a separately approved cutover plan.

**Exit:** reconciliation report passes and restore/replay tests pass.

---

## 8. Legacy-to-target mapping

| Legacy source | Target | Mapping notes |
|---|---|---|
| Firebase Auth UID | `external_identities.subject` | Only as legacy source identity after proof/approval; not internal user ID |
| Legacy generated `LUCIA-...` label | `migration_records` metadata / legacy profile field | Do not treat as verified Lucia ID |
| Firebase `users/{uid}` profile | `users`, `user_profiles`, `user_preferences` | Map only documented profile fields; ignore provider internals |
| Zustand localStorage `trendoratools-v10` | Versioned migration source | Parse only known schema versions; retain original export |
| JSON export `version: 1.0.0` | Versioned importer | Strict schema validation; reject or quarantine unknown versions |
| Firestore `products/trendora-tools/expenses` | `transactions` | Map to expense type; preserve source collection and source ID |
| Firestore `.../incomes` | `transactions` | Map to income type; preserve source collection and source ID |
| Firestore `.../budgets` | `budgets` | Resolve category and currency; do not infer unsupported period semantics |
| Firestore `.../savingsGoals` | `savings_goals` | Preserve current/target balances; historical entries are unavailable unless another source proves them |
| Firestore `.../bills` | `bills` | Map paid flag as legacy status; do not invent payment event date |
| Firestore `.../debts` | `debts` | Preserve stored totals/rate/minimum; do not invent repayment history |
| Firestore `.../chat` | Optional AI conversation archive | Only if privacy/retention approval and user consent permit; otherwise export separately and omit from operational import |
| Firestore `_meta/profile.customCategories` | `categories` | Preserve custom names and owner/workspace scope |
| Local chat state | Optional AI conversation archive | Current local persist excludes chat; don't assume localStorage has it |

### 8.1 Duplicate/conflict policy

- A user may have local-only data, cloud-only data, or both.
- Never assume local and cloud records with the same ID are identical.
- Build a source inventory for each owner and compare canonicalized record hashes.
- If both sources have the same source record ID but different content, mark conflict and require explicit resolution or retain both with distinct source references; never silently choose “cloud wins”.
- Do not deduplicate separate records solely because amounts/dates/descriptions match; legitimate repeated transactions exist.
- Preserve original data export and immutable source snapshot before any transform.
- No source deletion is permitted after import.

### 8.2 Currency resolution policy

- Legacy records have no currency field. Current UI formatting defaults to NGN, but that is not enough to silently rewrite historical data.
- Dry-run report must list all records with unknown currency.
- Candidate policy is to assign NGN only where owner/product evidence and user confirmation support it; otherwise quarantine the record or require user selection before import.
- Preserve raw legacy amount integer and document whether it is interpreted as two-decimal minor units.
- Never reinterpret a legacy integer as a major-unit decimal or convert it using a guessed exchange rate.

### 8.3 Identity linking policy

- New internal user is created only after a verified Lucia ID authentication event.
- Link old Firebase UID to that user only after the user proves control of the legacy account through a secure, approved flow or another explicitly verified ownership process.
- Email equality alone is not enough.
- If no safe proof mechanism exists, provide a manual support/recovery process with audit trail; do not auto-link.
- Do not attempt password hash migration from Firebase. Passwords remain with the identity provider.
- Do not remove the old Firebase login path until all eligible accounts have a supported transition and users have been notified.

---

## 9. Testing and quality gates

Required automated coverage before any user-data import:

1. Environment validation fails closed when required secrets/config are absent.
2. Health endpoint never leaks internal config or database error details.
3. Auth adapter rejects invalid, expired, wrong-audience/wrong-issuer credentials where applicable to the official protocol.
4. User identity cannot be supplied or overridden by request payload.
5. Workspace isolation: user A cannot read/update/delete user B's workspace or rows.
6. Role matrix: viewer/member/admin/owner permissions are explicit and tested.
7. Concurrent workspace/user initialization does not create duplicate personal workspaces.
8. Idempotency key replay returns the same result and does not duplicate writes.
9. Migration parser rejects malformed/unknown schema versions without partial import.
10. Re-running the same migration batch does not duplicate records.
11. Source checksum, counts and per-currency sums reconcile.
12. Money tests cover zero, large values, currencies with 0/2/3 minor digits, rounding, negative inputs policy and JS safe-integer boundaries.
13. Date tests cover timezone boundaries, daylight-saving transitions where relevant, leap days and date-only semantics.
14. PWA tests prove private API data is not cached in service-worker CacheStorage.
15. No secret values are emitted in logs, test snapshots or built client bundles.

Minimum checks when code is changed:
- `npm ci --no-audit --no-fund`
- `npm test`
- `npm run build`
- Add and run server-specific tests when server code is introduced.
- CI should run tests on feature branch. Do not trigger Vercel deployment from CI.

---

## 10. Operational configuration and secrets

Proposed names only; do not create fake values:
- `DATABASE_URL` — server-only pooled development/staging/production connection string.
- `APP_ORIGIN` — approved origin used for origin/CSRF checks.
- `LUCIA_ID_*` — exact names must follow official Lucia ID documentation; do not pre-guess.
- `LOG_LEVEL` — validated non-secret runtime setting.

Rules:
- Never prefix server secrets with `VITE_`.
- Do not commit `.env` files or real credentials.
- Update `.env.example` with safe descriptions only after final environment names are known.
- Separate credentials per environment.
- No production database or identity credentials in local development.
- Use Vercel environment variables only after explicit owner authorization.
- Keep automatic Vercel Git deployments disabled. No deployment is part of Phase 2 planning.

---

## 11. Production migration and cutover — not authorized yet

Production cutover is a separate project gate and requires explicit owner approval.

Required sequence:
1. Inventory all data sources and owners, including local-only devices and Firestore.
2. Publish a clear user notice and data export instructions.
3. Verify encrypted backups and restore them into an isolated environment.
4. Freeze source writes for a short, announced migration window or implement a proven delta-capture method. Do not dual-write to old and new systems without a formally tested consistency protocol.
5. Create a final immutable source snapshot and checksums.
6. Run approved transformation and idempotent import.
7. Reconcile counts, amounts per currency, identities, workspace ownership and sampled records.
8. Obtain owner sign-off and, where required, user confirmation for unresolved currency/identity conflicts.
9. Switch application reads/writes to the new backend.
10. Keep legacy source data read-only and retained according to the approved retention policy.
11. Monitor error rates, data integrity, latency and support reports.
12. Decommission Firebase only after all users/data paths, legal retention and backup restoration have been verified and separately approved.

Rollback:
- Before cutover, revert routing/configuration; source remains untouched.
- After new writes begin, do not simply point the app back to legacy because new records would be lost. Either freeze writes and perform a validated reverse export/delta reconciliation or forward-fix the new system.
- Document rollback trigger thresholds and owner decision authority before launch.
- Never delete legacy backups as part of rollback.

---

## 12. Explicit blockers and decisions still required

These are intentional blockers; Codex must not fill them with guesses.

| Item | Current status | Required before |
|---|---|---|
| Official Lucia ID integration documentation | Not present in inspected repository | Real auth adapter, account linking, Firebase auth retirement |
| Lucia ID test tenant/credentials | Not supplied | Provider integration tests |
| Development Neon project/database | Not provisioned/authorized in this task | Database connection/migrations against hosted DB |
| Final currency policy for legacy records | Unknown per record | Financial data import |
| Local-vs-Firestore conflict resolution | Not approved | User data merge |
| Legacy account ownership proof/linking flow | Not designed/approved | Identity migration |
| Backup retention and privacy policy | Requires review | Production migration/decommission |
| Vercel server function routing/runtime confirmation | Must be verified during P2.1 | API deployment |
| Payment provider and commercial prices/quotas | Not finalized | Billing implementation |
| Market-data provider and redistribution rights | Not finalized | Market feed implementation |

---

## 13. Definition of done for the backend foundation

The backend foundation is accepted only when:
- Complete repository/data/auth inventory is documented.
- Same-origin API scaffold and typed contracts exist.
- Development database migrations are reproducible from an empty database (only after provisioning authorization).
- Verified Lucia ID provider integration works according to official documentation (not a mock).
- Internal user and workspace authorization passes cross-tenant tests.
- Audit events and idempotent request patterns work.
- Versioned local/Firestore migration dry-run produces deterministic reconciliation reports.
- No production data has been changed without explicit approval.
- Firebase remains intact until migration/cutover gates pass.
- CI, tests and production build pass on the feature branch.
- Documentation and `AGENTS.md` match the actual implementation state.

**Current status:** specification authored from selected source inspection. No backend code, database, credentials, auth provider, migration, production deployment or user data has been changed by this document.


---

## 14. Implementation status — 2026-11-13

### P2.0 source inventory
- Complete recursive Git tree inspection on `feat/ariovelle-phase-1-design-system`.
- Firebase/Auth/Firestore import and call-site inventory recorded in `docs/REPOSITORY_AUDIT.md`.
- Local persistence keys, store schema, export/import format, Firestore paths, rules, sync deletion behavior and legal/PWA dependencies documented.
- Remote Firebase Auth/Firestore contents and per-device localStorage remain pending owner-authorized exports. No live user data has been accessed.

### P2.1 API scaffold
Implemented on the feature branch:
- `api/_lib/http.ts`: shared API request/response types, request IDs, no-store/security headers, and a consistent method-not-allowed error.
- `api/health/live.ts`: GET-only liveness endpoint.
- `api/health/ready.ts`: GET-only readiness endpoint explicitly scoped to the health-only API scaffold.
- `api/health/health.test.ts`: endpoint tests for liveness, readiness, headers and unsupported methods.
- `tsconfig.json`: API source is included in TypeScript typechecking.

Expected routes:
- `GET /api/health/live`
- `GET /api/health/ready`

Readiness currently reports `database: not_configured` and `identityProvider: not_configured`. A successful health response means only that the API scaffold is responsive; it does not mean the finance backend, authentication, database or user/workspace services are available.

Explicitly not implemented:
- No live authentication, mock auth route, Lucia ID adapter or session cookie.
- No database client, connection string or schema.
- No financial read/write routes.
- No payment, AI, market-data or background-job integration.
- No Firebase code removal or data migration.
- No Vercel deployment or production change.

**Validation status:** GitHub Actions must verify `npm ci`, `npm test` and `npm run build` against the resulting feature-branch commit. No local commands are claimed as run in this environment.


---

## 15. P2.2 server configuration and database boundary

Added contract-only server foundation files:
- `api/_lib/config.ts`: parses `NODE_ENV` and optional server-only `DATABASE_URL`; accepts only PostgreSQL URL schemes and rejects malformed URLs without echoing credentials. It does not read process environment at import time and does not connect.
- `api/_lib/database.ts`: defines a driver-neutral `SqlExecutor`, typed query result and transaction callback contract. All query parameters are passed separately from SQL text.
- `api/_lib/config.test.ts`: tests defaults, valid PostgreSQL URL parsing, invalid environment, malformed URL, unsupported protocol and missing database name.

Security and operational boundaries:
- `DATABASE_URL` is optional until a development database is explicitly authorized.
- Never use a `VITE_` prefix for server credentials; never serialize server configuration into client bundles or API responses.
- No PostgreSQL driver, pool, ORM, connection, schema execution or database health probe has been added.
- No identity-provider details or authentication implementation have been assumed.
- The database interface is a seam for a later approved adapter, not a working persistence layer.

Next gate: obtain explicit authorization for a disposable development PostgreSQL database, then test the foundation SQL against PostgreSQL 15+ and add the selected driver/adapter. Do not connect production or deploy as part of that work.


---

## 16. Disposable development PostgreSQL provisioned — 2026-11-13

Owner authorization received to provision a disposable development database.

**Provisioned resource**
- Provider: Neon, Lucia organization (Free plan).
- Project: `ariovelle-dev`
- Project ID: `super-base-35733977`
- Region: `aws-eu-central-1`
- PostgreSQL: `17.12`
- Default branch: `main` (`br-young-sound-ba8m1n50`)
- Database: `ariovelle_dev`
- Owner role: `ariovelle_owner`
- Compute: minimum and maximum 0.25 CU; provider default scale-to-zero behavior.
- Branch history retention: 6 hours (organization maximum).
- Purpose: disposable development and migration validation only. Not production, not staging, and not connected to Vercel or application runtime.

**Migration validation**
- Executed the nine-table foundation schema corresponding to `db/migrations/0001_foundation.sql`.
- Verified PostgreSQL server version `17.12`.
- Verified 9 public base tables and 90 table constraints.
- Verified expected tables: users, external_identities, user_profiles, user_preferences, workspaces, workspace_memberships, audit_events, migration_batches, migration_records.
- No customer, beta-tester or Firebase data was inserted.
- No auth, financial data, RLS policy or runtime application role was added.

**Credential handling**
- No connection string or password was committed to Git.
- No `DATABASE_URL` was added to Vercel or local app configuration.
- The database is provisioned but not yet connected to Ariovelle API runtime.
- Create a separate least-privilege runtime role and configure a secret only when the application adapter is ready and the owner approves that integration.

**Provider constraints encountered**
- Organization rejects HIPAA-mode projects; HIPAA was not enabled.
- Account does not permit overriding compute suspend interval; provider default was retained.
- Organization caps branch history retention at 21,600 seconds (6 hours); this cap was retained.


---

## 17. P2.4 PostgreSQL adapter and workspace authorization primitives

Implemented on the feature branch:
- `api/_lib/postgres-adapter.ts`: wraps a node-postgres-compatible pool interface; parameterized query forwarding, nullable row-count normalization, explicit BEGIN/COMMIT/ROLLBACK behavior, original-error preservation and guaranteed client release.
- `api/_lib/postgres-adapter.test.ts`: adapter tests cover parameter forwarding, commit, rollback and client release on setup failure.
- `api/_lib/workspace-access.ts`: checks an internal verified user ID against an active workspace membership and active workspace using a parameterized join; applies role permissions.
- `api/_lib/workspace-access.test.ts`: tests missing/inactive membership, inactive workspace, viewer write denial, member finance permissions, admin membership management and owner-only workspace settings.

Permission policy:
- owner: workspace read, finance read/write, member management and workspace settings.
- admin: workspace read, finance read/write and member management; cannot manage workspace settings.
- member: workspace read and finance read/write.
- viewer: workspace read and finance read only.

Security boundaries:
- The authorization function accepts a server-verified internal user ID. It must never receive a user ID asserted by a browser request.
- Workspace ID and user ID are bound as SQL parameters; no client-supplied SQL is constructed.
- These primitives are not yet wired to an HTTP route or live identity provider.
- The concrete `pg` driver and lazy pool factory now exist in `api/_lib/postgres-pool.ts`; no route imports the factory and no application runtime connection is configured.
- Database RLS and least-privilege runtime-role grants have been applied and verified on the disposable development database. Production remains unconnected.
- No financial tables or financial API writes were added.

The disposable development database contains only the foundation schema, RLS helpers/policies and the dedicated runtime role; all temporary tenant-isolation fixtures were removed. Next: keep this boundary intact, then review identity-provider documentation before any verified-auth adapter or product data route is implemented.


---

## 18. P2.5 Transaction-local identity, RLS and runtime database hardening

Implemented in source:
- `api/_lib/request-context.ts`: `withVerifiedRequestContext` accepts only a branded server-verified internal user ID and a workspace UUID, opens one database transaction, sets `app.user_id` and `app.workspace_id` with parameterized `set_config(..., true)`, asks PostgreSQL to verify active membership, then invokes work using that same transaction executor.
- Context values are transaction-local. PostgreSQL clears them at COMMIT/ROLLBACK; pooled connections are not allowed to retain one user's identity for the next request.
- Invalid UUIDs and inactive/non-member workspaces are rejected before request work executes.
- `api/_lib/request-context.test.ts` tests local context setup, parameter binding, membership rejection and invalid IDs.
- `api/_lib/rls.integration.test.ts` is an opt-in real-PostgreSQL suite using separate owner and runtime URLs. It seeds isolated test tenants, connects as the runtime role, verifies cross-tenant reads/writes are denied, verifies own-profile updates work, and verifies request context clears on rollback. It is skipped in CI unless both dedicated test URLs are explicitly configured.
- `api/_lib/postgres-pool.ts` provides the concrete node-postgres `Pool` factory and wraps it with the driver-neutral adapter. It uses TLS certificate verification, one connection per warm serverless instance, bounded idle/connection timeouts and lazy connection creation. It reads no environment variables and is not imported by routes.
- `pg` and `@types/pg` are declared dependencies.

Database migrations:
- `db/migrations/0002_request_context_and_rls.sql` creates private helper functions and enables RLS on all nine foundation tables.
- `db/migrations/0003_runtime_role_grants.sql` documents the provider-created runtime role and the narrow grants/default-privilege restrictions.
- The RLS migration and equivalent runtime grants were applied to the disposable Neon development database.

RLS policy coverage:
- `users`, `external_identities`, `user_profiles` and `user_preferences` are restricted to the current internal user.
- `workspaces` are restricted to the transaction's current workspace and active membership; only workspace owners can update workspace settings.
- `workspace_memberships` expose only the current user's memberships or the selected workspace's memberships. Owner/admin member-management policies cannot let an admin mutate owner/admin rows or assign privileged roles.
- `audit_events` are readable only by the actor or an active member of the selected workspace; inserts must match the current actor/workspace. No runtime UPDATE/DELETE grant exists.
- `migration_batches` and `migration_records` have RLS enabled with no runtime policies and no runtime table grants (default deny).

Runtime role on Neon:
- Project `ariovelle-dev`, branch `main`, database `ariovelle_dev`, role `ariovelle_runtime`.
- Created as a database-scoped `read_only` role (not provider admin). Explicitly granted only profile/preferences writes, workspace UPDATE, membership DML, and audit INSERT. Migration metadata privileges were revoked.
- Verified `rolsuper=false`, `rolcreaterole=false`, `rolcreatedb=false`, `rolbypassrls=false`.
- Role-level limits: statement timeout 10s, lock timeout 2s, idle-in-transaction timeout 15s.
- Future public tables receive no default SELECT grant to this role; future private-schema functions receive no default PUBLIC EXECUTE grant. New tables must have RLS and reviewed explicit grants before runtime use.
- A disposable future-table probe confirmed the runtime role receives permission denied by default.

Actual development-database tenant-isolation test:
- Seeded two temporary users, two personal workspaces, two owner memberships and two profiles.
- Connected directly as `ariovelle_runtime` (not merely simulated in application code).
- With no request context, the runtime role saw zero users/workspaces.
- With tenant A context, it saw only A, could update A's profile, could not read or update B's profile, and a cross-tenant insert was rejected with SQLSTATE `42501`.
- The membership helper returned true for A and false for B.
- Switching to tenant B context exposed only B.
- A subsequent runtime query showed both transaction-local settings cleared (empty GUC values) after transaction completion.
- All temporary test rows were deleted. A future-table probe was also dropped.
- Neon maintains an owner-to-runtime membership (grantor `cloud_admin`) for provider role administration. The runtime role is not a member of the owner role, has no inherited owner privileges and cannot escalate to owner; direct catalog inspection confirmed this directionality.

Important limitations:
- RLS context is trusted only because the database credential remains server-side. A holder of the runtime credential can set custom PostgreSQL GUCs; therefore the credential must never be exposed to browsers, mobile clients, logs or user-controlled SQL. The future API must derive the internal user ID exclusively from a verified Lucia ID token/session and set context in the same transaction as every tenant query.
- The runtime role exists in the development database, but its password/connection string is not stored in the repository or Vercel. The pool factory is not wired to the application. No database secret was configured.
- The RLS suite has been exercised directly against the development database through the Neon runtime role. CI's opt-in integration suite remains skipped until dedicated owner/runtime test secrets are deliberately configured.
- No financial tables, financial write routes, Lucia ID auth adapter, production DB, deployment or Firebase retirement were implemented.
