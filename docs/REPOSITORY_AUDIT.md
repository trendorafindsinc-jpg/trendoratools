# Ariovelle Repository, Firebase Dependency and Data Inventory

**Audit date:** 2026-11-13  
**Audited ref:** `feat/ariovelle-phase-1-design-system`  
**Audited commit:** `c61df927f556df27f84cadfed21f1b251ebe3ac5` (source inventory baseline)  
**Status:** Source-code dependency inventory completed from the complete Git tree and relevant file contents. Remote Firebase dataset inventory remains blocked until an authorized export/read-only access is supplied. No Firebase data was accessed, exported, modified or deleted.

## 1. Audit method and limits

The repository Git tree was enumerated recursively (87 entries; GitHub reported no truncated tree). All source paths were inspected for Firebase, Firestore, authentication, browser persistence and cloud-sync references. Relevant implementation files, security rules, environment template, package manifest, PWA configuration and legal disclosure were read.

This was a source-code audit using GitHub repository contents. A local checkout was not available in this execution environment, so `npm ci`, `npm test`, `npm run build`, browser runtime inspection, emulator tests, dependency scanning and localStorage inspection were **not run**. No Firebase Console access, production Firestore export, user backup file or live account data was supplied. Therefore the source dependency graph is complete to the inspected tree, but the actual remote data inventory is not yet complete.

## 2. Complete Firebase dependency graph

### 2.1 SDK and initialization

| Path | Firebase dependency | Responsibility | Disposition |
|---|---|---|---|
| `package.json` | `firebase@^12.1.0` | Client SDK dependency | Retain until all Firebase references are removed and data migration is accepted |
| `src/lib/firebase.ts` | `firebase/app`, `firebase/auth`, `firebase/firestore` | Initializes app, Auth, Firestore, Google provider from six `VITE_FIREBASE_*` variables | Replace after provider and data cutover; never expose Admin credentials |
| `.env.example` | Six `VITE_FIREBASE_*` entries | Documents client config; misleadingly labels it LUCIA ID | Correct after migration; never commit values |
| `firebase.json` | Firestore rules config | Points Firebase CLI to `firestore.rules` | Retain as legacy migration artifact until retirement approval |
| `firestore.rules` | Firestore rules language | Owner-scoped user/profile/product data access | Preserve unchanged until migration and retention review |

Firebase is initialized only when every expected client config value is non-empty. `firebase.ts` exports nullable `auth` and `db` plus a Google provider.

### 2.2 Authentication and identity

| Path | Calls / dependency | Data or behavior |
|---|---|---|
| `src/lib/lucia-auth.ts` | Firebase Auth email/password create/sign-in, Google popup/redirect, redirect completion, password reset, sign-out, auth-state subscription | Creates/updates Firestore user profile on sign-in |
| `src/components/LuciaAuth.tsx` | Imports the auth service and Firebase configuration status | UI for sign-in, sign-up, reset, Google and guest entry |
| `src/App.tsx` | Firebase `User` type, auth listener and redirect completion | Auth-gated startup; starts/stops Firestore sync |
| `src/pages/Settings.tsx` | Firebase current user and sign-out | Account status, sign-out, manual cloud backup/restore |

**Critical identity finding:** `makeLuciaId(uid)` derives a display string `LUCIA-XXXXXXXX` from the first eight sanitized Firebase UID characters. This is not a verified Lucia ID provider subject and must never be migrated as authenticated identity. Firestore `users/{firebaseUid}` stores `firebaseUid`, generated `id`, display/email/photo, email verification, account status, identity, profile, preferences, privacy and product flags.

### 2.3 Firestore data paths

The source code reads/writes the following Firestore paths. These are known code paths, not confirmation that every path currently contains documents.

| Firestore path | Operation | Source |
|---|---|---|
| `users/{uid}` | Read existing profile; merge profile, identity, preferences, privacy and product flags | `src/lib/lucia-auth.ts` |
| `users/{uid}/products/trendora-tools` | Read/write manual JSON backup and cloud sync metadata | `src/lib/lucia-cloud.ts` |
| `users/{uid}/products/trendora` | Read legacy backup fallback if current product backup absent | `src/lib/lucia-cloud.ts` |
| `users/{uid}/products/trendora-tools/expenses/{recordId}` | Full collection read; set changed records; delete remote records missing locally | `src/lib/lucia-cloud-sync.ts` |
| `.../incomes/{recordId}` | Same | `src/lib/lucia-cloud-sync.ts` |
| `.../budgets/{recordId}` | Same | `src/lib/lucia-cloud-sync.ts` |
| `.../savingsGoals/{recordId}` | Same | `src/lib/lucia-cloud-sync.ts` |
| `.../bills/{recordId}` | Same | `src/lib/lucia-cloud-sync.ts` |
| `.../debts/{recordId}` | Same | `src/lib/lucia-cloud-sync.ts` |
| `.../chat/{recordId}` | Same | `src/lib/lucia-cloud-sync.ts` |
| `.../_meta/profile` | Read/write `customCategories` and sync metadata | `src/lib/lucia-cloud-sync.ts` |

The manual backup document contains:
- `product: "trendora-tools"`
- `cloudSync.enabled` and `cloudSync.lastSyncedAt`
- `backup.app: "trendora-tools"`
- `backup.version: 1`
- `backup.data`: JSON string produced by the local store export
- `backup.updatedAt`

The restore helper first checks `trendora-tools`, then falls back to the legacy product key `trendora`.

### 2.4 Firestore rules and access model

`firestore.rules` allows:
- A user to create/read/update their own `users/{uid}` document where request auth UID equals path UID, with additional immutable-ish UID/id/account-status checks.
- An authenticated user to read/write their own `users/{uid}/products/{productId}` document and any nested collection/record under it.

The rules do not provide Ariovelle workspace/team tenancy. The future backend must independently enforce user and workspace authorization. Do not copy these rules as the PostgreSQL authorization model.

### 2.5 Other Firebase references

- `src/pages/Legal.tsx` describes Firebase Authentication as an example provider and names the Firebase JavaScript SDK in license text. Legal/privacy copy must be updated when the actual provider and data flow change.
- The remaining inspected pages/components did not directly import Firebase or call Firestore. Authentication and sync reach them through the app shell/store.
- No Firebase Storage SDK use was found in the inspected source tree.
- No Firebase Admin SDK, Cloud Functions or Firebase Storage rules were found in the repository tree.
- `firebase.json` configures Firestore rules only.

## 3. Data inventory — on-device

### 3.1 Zustand financial store

File: `src/store.ts`  
Persist middleware: Zustand `persist` + `createJSONStorage(() => localStorage)`  
Storage key: `trendoratools-v10`  
Persist schema version: `2`

Persisted fields:
- `expenses[]`
- `incomes[]`
- `budgets[]`
- `savingsGoals[]`
- `bills[]`
- `debts[]`
- `customCategories[]`

The `chat[]` messages exist in live Zustand state but are omitted by `partialize`, so they are not included in the persisted localStorage snapshot. Cloud sync does include chat while the app is running. Do not assume local and Firestore chat histories are equivalent.

### 3.2 Legacy record shapes

Observed in `src/types.ts`:

| Type | Fields | Important caveats |
|---|---|---|
| Expense | `id, amount, category, date, note?` | No currency, account, timestamps or delete history |
| Income | `id, amount, source, date, recurring?, note?` | Recurring is boolean only; no schedule |
| Budget | `id, category, limit` | No period, currency or date range |
| SavingsGoal | `id, name, targetAmount, currentAmount, targetDate, description?` | Current balance is mutable; contribution history not represented |
| Bill | `id, name, amount, dueDate, paid, recurring, category?, note?` | Paid boolean; no payment history or recurrence rule |
| Debt | `id, name, totalAmount, remainingAmount, interestRate, minimumPayment, note?` | Mutable remaining balance; repayment history not represented |
| ChatMessage | `id, role, text, createdAt` | Runtime state; cloud collection exists; local persistence excludes it |

Amounts are TypeScript `number` values generated by `toMinorUnits`, which assumes two decimal places. Currency is absent from records; formatting defaults to NGN in the UI. This is not proof of currency for each historical record. Do not import until currency is resolved per record/user.

### 3.3 Export/import format

- Export JSON marker: `version: "1.0.0"`.
- Export includes expenses, incomes, budgets, savingsGoals, bills, debts and customCategories.
- Export excludes chat.
- Import parses JSON and performs only a minimal object/array check before replacing those arrays. It does not validate each record, ID, amount, date or currency.
- Settings downloads a file named `ariovelle-backup-YYYY-MM-DD.json`.
- Settings imports by FileReader and then reloads the page.
- Manual cloud backup stores this JSON as a string in Firestore.
- Manual cloud restore calls the same permissive import path and replaces current local records.

Do not use the existing importer for a server-side migration. Build a strict versioned parser and quarantine malformed records.

## 4. Sync behavior and data-loss risks

The current sync is not a safe migration or conflict-resolution engine:
1. It reads the full remote collections for each of the seven record types.
2. It merges local and cloud by record ID; cloud values overwrite local values on duplicate IDs.
3. It writes local records that are missing/different remotely.
4. It deletes every remote record whose ID is absent from the local array.
5. It uses a delayed 1.2-second whole-store subscription and JSON snapshot comparison.
6. It has no version number, tombstone, conflict queue, source checksum, idempotency key, transactional snapshot or three-way merge.

**Migration rule:** do not start this legacy sync as part of any migration dry-run. Do not reuse its deletion/merge algorithm. Keep legacy source read-only once a formal snapshot window begins.

## 5. Browser persistence and privacy inventory

Observed local/session storage keys and usage:
- `trendoratools-v10`: financial Zustand store.
- `trendora_tools_welcome_seen`: welcome flow completion.
- `trendora_tools_guest_mode`: guest mode flag.
- `trendora_tools_theme`: theme preference; Ariovelle theme helper retains a legacy fallback.
- `trendora_ga4_app_launch`: per-session analytics launch marker.

The app also creates ephemeral object URLs for downloaded JSON export and uses FileReader for local import. No IndexedDB usage was found in the inspected source. No client Firebase Storage usage was found.

Analytics uses GA4 only when `VITE_GA_MEASUREMENT_ID` is set. It filters event parameters through an allowlist; store tracking sends tool name and action, not transaction amounts/descriptions. Review consent/privacy requirements before enabling analytics in new regions.

## 6. PWA and mobile data handling

- `vite.config.ts` uses `vite-plugin-pwa` with Workbox precache glob patterns for static JS/CSS/HTML/fonts/images and Google Fonts cache-first runtime caching.
- No explicit authenticated API runtime cache rule exists in the inspected config.
- The offline page is a static legacy Trendora-branded HTML page.
- Capacitor is configured for Android. No separate native database or secure token storage implementation was found in the inspected `src/lib/native.ts`.
- Before authenticated API data is introduced, explicitly test that service-worker runtime caches never store private API responses. Keep only static assets cacheable.
- Keep the current Android application ID until its published/update implications are established.

## 7. Repository file inventory relevant to this audit

- App bootstrap: `src/main.tsx`, `src/App.tsx`
- Authentication UI: `src/components/LuciaAuth.tsx`
- Account and backup UI: `src/pages/Settings.tsx`
- Firebase initialization: `src/lib/firebase.ts`
- Auth/profile service: `src/lib/lucia-auth.ts`
- Live Firestore sync: `src/lib/lucia-cloud-sync.ts`
- Manual backup/restore: `src/lib/lucia-cloud.ts`
- Local state and import/export: `src/store.ts`
- Legacy data shapes: `src/types.ts`
- Money helpers: `src/lib/utils.ts`
- Analytics: `src/lib/analytics.ts`, `src/lib/analytics-store.ts`, `src/components/AnalyticsTracker.tsx`
- PWA config: `vite.config.ts`
- Firebase CLI/rules: `firebase.json`, `firestore.rules`
- Environment template: `.env.example`
- Legal disclosure: `src/pages/Legal.tsx`
- Product specification: `docs/ARIOVELLE_PRODUCT_SPEC.md`
- Backend/migration authority: `docs/ARIOVELLE_BACKEND_ARCHITECTURE_AND_MIGRATION.md`

## 8. Keep / adapt / replace / retire matrix

| Component | Decision | Gate |
|---|---|---|
| React/Vite/TypeScript, router, shell | Keep | Existing build/test validation |
| Zustand finance store | Keep temporarily; adapt into local guest cache/export | New server data path and migration accepted |
| Financial calculation helpers | Audit and selectively reuse | Unit/rounding/currency tests |
| Firebase SDK | Retire | No code references, migration/reconciliation accepted, legacy retention decision |
| Firebase Auth | Retire after identity transition | Official Lucia ID integration and secure account linking |
| Firestore profile data | Migrate only approved profile fields | Export, mapping and ownership proof |
| Firestore finance collections | Migrate through versioned importer | Dry-run, currency resolution, reconciliation |
| Firestore chat | Optional archive only | Privacy/retention and user consent decision |
| Manual JSON backup | Preserve and version | New strict importer plus user export remains available |
| Legacy cloud sync | Replace; do not reuse | New conflict-safe backend sync if needed |
| Firestore rules/config | Retain as historical source | Decommission approval |
| GA4 | Adapt | Consent/privacy review and sensitive-data audit |
| PWA | Keep/adapt | Prove authenticated API responses are never cached |
| Capacitor | Keep provisionally | Native auth/session and app-upgrade review |
| Legal copy | Rewrite when actual data flow is implemented | Legal/privacy approval |

## 9. Outstanding remote-data inventory requirements

The following cannot be established from source code:
- Number of Firebase projects/environments and their project IDs.
- Number of registered Firebase Auth users, disabled/deleted users, provider mix and verified-email states.
- Actual Firestore document counts/bytes per path and any fields not represented in current code.
- Whether legacy `trendora` backup documents still exist.
- Whether manual backup snapshots differ from live collections.
- Data age, duplicate IDs, malformed records, unknown fields and actual currency distributions.
- Users who have local-only data on devices not represented in Firestore.
- Whether any support/export archives exist outside this repository.

Required next input/action: an owner-authorized Firestore export or read-only inventory report, plus an approved Firebase Auth user export containing only necessary metadata (never password hashes or secrets). Use synthetic/redacted examples for development. Do not request or store users' passwords, provider tokens or private keys. Keep raw export encrypted and access-controlled outside Git.

## 10. Audit completion status

**Source-code dependency and schema inventory: complete for the inspected feature-branch tree.**  
**Live Firebase project / remote user-data inventory: pending authorized export.**  
**Local device data inventory: pending user/device export; no localStorage contents were accessed.**  
**Local build/test/runtime/security validation: not run in this environment.**

No Firebase code, Firebase project, Firestore data, customer records, user devices, authentication accounts, production deployment or domain configuration was modified by this audit.
