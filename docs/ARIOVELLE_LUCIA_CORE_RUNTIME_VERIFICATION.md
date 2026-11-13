# Lucia Core runtime verification — Ariovelle integration

Date: 2026-11-13  
Scope: read-only inspection of Lucia Core source and Vercel configuration, plus additive schema and integration verification on the disposable Ariovelle development database. No Lucia Core source, settings, secrets or deployments were changed.

## Result

**Ariovelle's local authentication foundation is implemented and exercised against the disposable development database. Production login remains disabled because the deployed Lucia Core environment is not currently verifiable and Core's current source drops the OIDC nonce.**

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
