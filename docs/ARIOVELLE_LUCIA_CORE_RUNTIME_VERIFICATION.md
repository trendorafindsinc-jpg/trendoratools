# Lucia Core runtime verification — Ariovelle integration

Date: 2026-11-13
Scope: read-only inspection of Lucia Core source and its linked Vercel project. No Core settings, deployments, domains, environment variables or secrets were changed.

## Result

**Production OIDC integration is not currently verifiable and login must remain disabled.** Two concrete blockers were identified.

### 1. Deployed Core environment is not live

Read-only Vercel inspection of the Git-linked Core project found:
- Project: `lucia-secure`, linked to `trendorafindsinc-jpg/lucia-core`.
- Project reports `live: false`.
- Its only attached verified project domain is `lucia-secure.vercel.app`.
- The latest deployment record is `CANCELED`; the most recent production-target deployment in the inspected history is also `CANCELED`.
- No custom `auth.lucia.name.ng` domain is attached to this Vercel project.
- The project's configured `APPLICATION_URL` is `https://lucia-secure.vercel.app`; no `OIDC_ISSUER` variable was present in the environment-variable inventory.
- The configured `TRUSTED_ORIGINS` value does not include `https://ariovelle.lucia.name.ng`.
- No `LUCIA_CLIENT_ID`, `LUCIA_CLIENT_SECRET` or Ariovelle audience/client configuration exists in the inspected Core project environment inventory.

The public discovery URL on the only attached domain could not be fetched from the available web retrieval path. Because the project is not live and its deployments are canceled, there is no successful runtime discovery/JWKS/token/UserInfo verification to report. Do not treat source-code tests as production endpoint verification.

### 2. Core currently drops the OIDC nonce before issuing the ID token

Source inspection found a concrete defect in the current Core main branch:

1. `src/modules/consumer/consent.ts` stores the incoming `nonce` on the consent transaction and copies it to the authorization-code row when consent is approved.
2. `src/modules/consumer/service.ts` consumes the authorization code but its `exchangeAuthorizationCode()` return object does **not** include `existing.nonce`.
3. `src/app/api/v1/consumer/oauth/token/route.ts` casts that result to a shape with optional `nonce`, then calls `maybeIssueIdToken({ nonce: exchangeWithNonce.nonce ?? null })`.
4. Therefore the value passed to `maybeIssueIdToken` is currently `null`, and `src/modules/oidc/id-token.ts` omits the ID-token `nonce` claim.

Ariovelle correctly requires an exact nonce match. Consequently, the current Core source will cause Ariovelle to reject its ID token. This is intentional fail-closed behavior, not a reason to weaken Ariovelle validation.

Required Core-side correction (not applied by this Ariovelle task):
- Include the consumed authorization-code row's `nonce` in the result returned by `exchangeAuthorizationCode()`.
- Pass that value unchanged to `maybeIssueIdToken()`.
- Add Core tests asserting the ID token includes the exact authorization request nonce, and rejects missing/wrong nonce.
- Verify the fix in a deployed Core environment before Ariovelle login is enabled.

### 3. Scope and consent configuration still require an operator check

Ariovelle requests `openid email profile`. Core validates requested scopes against each registered consumer's grants. No Ariovelle consumer client is registered in the inspected project. The future client must explicitly grant the requested scopes, use a confidential client secret, register the exact callback URI, and use the agreed Ariovelle audience.

## Ariovelle implementation state

Implemented on `feat/ariovelle-phase-1-design-system`:
- Server-side discovery and endpoint allowlist validation.
- Authorization Code + PKCE S256 initiation.
- Encrypted, expiring OAuth transaction cookie.
- Token exchange using server-side confidential-client Basic authentication.
- RS256 signature verification using Core JWKS, with one refresh for unknown `kid`.
- Exact issuer/audience/expiry/issued-at/nonce checks.
- UserInfo subject equality check.
- Opaque local session tokens with SHA-256 hash-at-rest.
- Database functions for stable external subject mapping, personal workspace bootstrap, session resolution and revocation.
- Workspace permission checks inside transaction-local verified user/workspace RLS context.
- Unit tests and opt-in real PostgreSQL integration suites.

The routes are guarded by `LUCIA_AUTH_ENABLED=true`; the default is disabled. No production secrets were read or changed. No Core consumer was provisioned. No Core changes or deployments were made. Migration 0004 has been added to source but must be applied to the disposable Ariovelle development database before the PostgreSQL integration suite can run.

## Release gate

Do not enable Ariovelle login until all are true:
1. Core fixes nonce propagation and its tests pass.
2. Core is deployed to a reachable HTTPS canonical issuer.
3. Discovery and JWKS are fetched from that deployed issuer and match the configured issuer/endpoints.
4. The Ariovelle first-party confidential consumer is registered with exact callback, audience and scopes.
5. Ariovelle development migration 0004 is applied and its real PostgreSQL identity/session/RLS integration tests pass.
6. Ariovelle CI passes build and unit tests.
7. An end-to-end test completes sign-in, session resolution, workspace authorization and logout against the deployed Core test environment.

No production login, deployment or Core configuration change is authorized by this report.
