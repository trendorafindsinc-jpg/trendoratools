# Lucia Core runtime verification — Ariovelle integration

**Original evidence snapshot:** 2026-11-13. **Current follow-up:** 2026-11-14. The original deployment and nonce findings below are historical and are superseded by the dated follow-up in Section 6. Lucia Core remains owned by its separate agent; this report is read-only. Do not modify Core. Current Ariovelle implementation/database status is in [ARIOVELLE_PHASE_2_STATUS.md](ARIOVELLE_PHASE_2_STATUS.md).

Date: 2026-11-13  
Scope: read-only inspection of Lucia Core source and Vercel configuration, plus additive schema and integration verification on the disposable Ariovelle development database. No Lucia Core source, settings, secrets or deployments were changed.

## Result

**Ariovelle's local authentication foundation is implemented and exercised against the disposable development database. Production login remains disabled. The Core deployment and nonce findings below are the last read-only snapshot from 2026-11-13 and must be reconfirmed by Core's agent before integration.**

## 1. Lucia Core deployment verification

Read-only Vercel inspection of project `lucia-secure` (linked to `trendorafindsinc-jpg/lucia-core`) found:

- Project reports `live: false`.
- Attached domains: `lucia-secure-trendoraplc-5738.vercel.app` and `lucia-secure-git-main-trendoraplc-5738.vercel.app`.
- Latest deployment `dpl_5LH23WbmX4DQTHAjswg6KhSeHptq` is `CANCELED`.
- Latest inspected production-target deployment `dpl_DXeiJzC5XuDAiAveoXZTiext4orH` is also `CANCELED`.
- SSO protection is enabled for deployment URLs except custom domains.
- No custom Lucia identity domain is attached. A project-domain lookup for `auth.lucia.name.ng` returned 404.
- The discovery document on the attached deployment domain was not accessible through the available public retrieval path.
- Earlier read-only environment inventory found no configured `OIDC_ISSUER`, no Ariovelle consumer client registration/credentials, and a `TRUSTED_ORIGINS` value that did not include `https://ariovelle.lucia.name.ng`. No secret values were retrieved or changed.

Therefore there is no verified deployed discovery document, JWKS, token exchange or UserInfo response. Source inspection and local tests are not substitutes for live provider verification.

## 2. Core nonce propagation defect

Current Lucia Core main has a concrete defect:

1. `src/modules/consumer/consent.ts` stores the incoming authorization request nonce on the consent transaction and copies it to the authorization-code row.
2. `src/modules/consumer/service.ts` consumes the authorization code but `exchangeAuthorizationCode()` does not include `existing.nonce` in its return object.
3. `src/app/api/v1/consumer/oauth/token/route.ts` passes `exchangeWithNonce.nonce ?? null` to ID-token issuance.
4. Consequently, the issued ID token omits the nonce.

Ariovelle correctly rejects missing or mismatched nonce claims. Do not weaken that validation.

Required Core-side correction (not performed here):
- Return the consumed authorization-code nonce from `exchangeAuthorizationCode()`.
- Pass it unchanged to `maybeIssueIdToken()`.
- Add Core tests for exact nonce propagation and missing/wrong nonce rejection.
- Deploy the correction to a reachable HTTPS issuer and verify the live token.

## 3. Ariovelle implementation

Implemented on `feat/ariovelle-phase-1-design-system`:

- Server-side OIDC discovery and exact issuer/endpoint allowlisting.
- Authorization Code + PKCE S256 initiation.
- Server-side one-time OAuth transaction storage in PostgreSQL. State and browser-binding hashes are stored; nonce/verifier payload is encrypted with the server-only session secret.
- Browser receives only a random opaque HttpOnly browser-binding cookie.
- Callback atomically consumes the state/browser pair; wrong-browser and replayed callbacks fail.
- Confidential-client token exchange using server-side HTTP Basic authentication.
- RS256 ID-token signature validation using maintained `jose@6.2.17` against Core JWKS, with one JWKS refresh for an unknown `kid`.
- Exact issuer, audience, expiry, issued-at, nonce and UserInfo subject checks.
- Stable local user mapping by issuer + OIDC subject, independent of email.
- Opaque Ariovelle sessions with SHA-256 hash-at-rest and local revocation.
- Personal workspace bootstrap for a new identity.
- Workspace authorization that resolves session, sets transaction-local RLS context, checks membership/role and runs protected queries in one transaction.
- Logout revokes the local session and clears the cookie.

## 4. Disposable development database verification

Migrations 0004 (identity/session functions) and 0005 (one-time OAuth transaction store) have been applied only to the disposable Neon development database `ariovelle_dev`. No production database was changed. The runtime role has EXECUTE on the narrow SECURITY DEFINER functions and no direct table access to local sessions or OAuth transactions.

Checks using the separate `ariovelle_runtime` role confirmed:

- Two different Lucia subjects create distinct Ariovelle users and personal workspaces.
- Local session hashes resolve to the corresponding Ariovelle users.
- Transaction-local identity/workspace context is honored by RLS.
- A user sees their own workspace and cannot see another user's workspace.
- Cross-workspace membership checks deny access.
- Local session revocation causes subsequent resolution to return null.
- OAuth state storage succeeds; a wrong browser binding cannot consume it; the correct binding consumes it once; a replay returns no transaction.

The disposable database currently contains two temporary identity/workspace fixtures, their session records, and one consumed OAuth transaction fixture from these manual checks. They contain synthetic test data only. Cleanup is pending owner authorization; no financial records were created.

The automated opt-in PostgreSQL integration suite now covers OAuth one-time consumption, identity creation, session hash-at-rest, session resolution/revocation, authenticated workspace access and cross-workspace denial. The suite requires separate owner/runtime database URLs and is intentionally skipped in ordinary CI unless those variables are explicitly provided. GitHub Actions run [43500787261](https://github.com/trendorafindsinc-jpg/trendoratools/actions/runs/43500787261) passed the production build and automated tests: 13 test files and 64 tests passed; the two opt-in real-PostgreSQL suites were skipped because CI does not receive development database credentials. The workflow reconciled and committed the npm lockfile for `jose`.

## 5. Runtime configuration and release gate

The routes fail closed unless `LUCIA_AUTH_ENABLED=true`. Required secrets and issuer values are server-only:

- `LUCIA_ISSUER`
- `LUCIA_CLIENT_ID`
- `LUCIA_CLIENT_SECRET`
- `LUCIA_AUDIENCE`
- `LUCIA_REDIRECT_URI`
- `ARIOVELLE_SESSION_SECRET`
- `DATABASE_URL`

No production credentials were added, no Lucia Core consumer was registered, no Core changes/deployments were made, and no Ariovelle deployment or production login was enabled.

Do not enable login until all are true:

1. Core fixes nonce propagation and its tests pass.
2. Core is deployed to a reachable HTTPS canonical issuer.
3. Discovery and JWKS are fetched from that deployment and match the configured issuer/endpoints.
4. Ariovelle's first-party confidential consumer is registered with exact callback, audience and granted scopes.
5. Development migrations and real PostgreSQL identity/session/OAuth/RLS integration tests pass.
6. Ariovelle CI build and unit tests pass.
7. An end-to-end test completes sign-in, local session resolution, workspace authorization and logout against the deployed Core test environment.

No production login, deployment, Core configuration change or production database migration is authorized by this report.


## 6. 2026-11-14 follow-up — production issuer, OIDC and signing-key audit (read-only)

The owner reported that Lucia Core Production is now configured with `OIDC_ISSUER=https://auth.lucia.name.ng`, the existing production deployment was redeployed without source changes or branch merge and reached READY, the custom domain is assigned to that Production deployment, excluded from deployment SSO protection, and not pinned to Preview. The owner also supplied successful live discovery and JWKS results. This replaces the deployment/domain findings in Sections 1 and 5; do not repeat or change the completed domain work.

Independent metadata/catalog inspection performed for this follow-up:

- Vercel Core project `lucia-secure` has a READY Production deployment `dpl_3shBd4FTe5Yrm68aY8VjQKScAhkS` from `main` commit `35a4e3d010803d99cd200084a653c1aee048c374`.
- Vercel Production environment metadata contains `OIDC_ISSUER` with the canonical issuer and a Production-scoped Sensitive `OIDC_SIGNING_KEY_ENCRYPTION_KEY`. The secret value was not requested or read.
- The Production Neon project `lucia-core-v2-production` (branch `main`) contains exactly one active OIDC signing-key row. Its `kid` is `0c05947a954f4edd`, matching the owner's published JWKS key ID. The private PEM column is stored as `enc:v1:`; there are zero plaintext key rows. No key was created, changed, decrypted or rotated during this inspection.
- The Production deployment's checked-in `src/modules/oidc/keys.ts` uses AES-256-GCM, a fresh 12-byte IV, a key-ID-bound AAD value, a versioned `enc:v1:` storage format, and strict canonical-Base64/32-byte key validation. Its JWKS path calls `ensureActiveSigningKey()`, which materializes (and therefore decrypts) the active key before returning the public JWKS. The owner's successful live JWKS response, combined with the matching encrypted active row and Production secret metadata, is consistent with the production runtime being able to decrypt the active key. No private PEM or secret value was retrieved.
- Current Core `main` source now propagates nonce through the authorization flow: `consent.ts` stores nonce on the consent transaction and copies it to the authorization-code row; `service.ts` returns `existing.nonce`; the token route passes it to `maybeIssueIdToken()`; and `id-token.ts` includes it in the RS256 ID token. The 2026-11-13 nonce finding above is therefore superseded in the current inspected source. A real token exchange is still needed to verify deployed behavior.
- Read-only Neon Object Storage inspection of the known Core production project and its main branch returned no buckets; the named `lucia-core-key-recovery` bucket was not found there. The runbook requires a private recovery object plus a separately protected age identity backup. This is a recovery-evidence gap, not proof that no copy exists elsewhere. Do not create, delete or upload anything as part of this audit.

### Current Ariovelle preview state

- Ariovelle's preview-only `LUCIA_ISSUER` is now set to `https://auth.lucia.name.ng`.
- The existing client ID, confidential client secret, audience `ariovelle`, exact callback `https://ariovelle.lucia.name.ng/api/auth/lucia/callback`, and `openid profile email` request scopes are preserved. No Core client registration, redirect URI, scopes, secrets or deployment were changed.
- `LUCIA_AUTH_ENABLED=true` is configured for Ariovelle Preview only on `feat/ariovelle-phase-1-design-system`; production authentication remains disabled.
- Ariovelle's manual Preview deployment `dpl_AmxKawKeeA6FHjHnkpEPVTMq28QY` is READY and has the `ariovelle.lucia.name.ng` alias. Git auto-deploy remains disabled.
- The current callback validates the RS256 ID token against Core JWKS, checks issuer/client audience/time/nonce, then verifies UserInfo and requires its subject to match before creating a local Ariovelle session.

### Remaining acceptance

1. Complete the latest Ariovelle CI run, including the new negative signature, unknown-key, issuer, expiry and UserInfo subject-binding tests.
2. Perform one real browser sign-in against the Preview deployment. This requires an authenticated Lucia account and browser interaction; no user credentials should be shared in chat.
3. Confirm the callback completes, a local Ariovelle session is established, workspace access resolves correctly, and logout revokes that session.
4. Separately verify the recovery object and age-identity backup with the designated recovery operator. Do not rotate the production encryption key. Do not change Lucia Core production settings or database.
5. Keep production Ariovelle login disabled until Preview acceptance and the recovery evidence gap are reviewed.
