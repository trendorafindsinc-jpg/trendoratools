# Ariovelle ↔ Lucia Core Identity Integration Contract

Status: Ariovelle OIDC adapter restored to the registered `openid profile email` flow. Owner has confirmed production issuer/domain routing and public RS256 JWKS availability. Preview end-to-end sign-in, active client/scope confirmation and user callback acceptance remain pending.

Source of truth inspected read-only:
- Repository: https://github.com/trendorafindsinc-jpg/lucia-core
- Branch inspected: main
- Relevant modules: `src/modules/oidc/config.ts`, `src/modules/oidc/id-token.ts`, `src/modules/oidc/keys.ts`, `src/modules/oidc/userinfo.ts`, `src/modules/consumer/service.ts`, `src/modules/consumer/consent.ts`
- Relevant routes: OIDC discovery, JWKS, consumer OAuth authorize/token, OIDC UserInfo.

## 1. Responsibility boundary

Lucia Core is the identity provider. Ariovelle uses Core's confidential OAuth authorization-code flow with PKCE, validates the RS256-signed OIDC ID token against Core's published JWKS, enforces issuer, client audience, expiry, issued-at and transaction nonce, then calls Core's protected UserInfo identity-verification API and requires its `sub` to match the validated ID token. Ariovelle owns its own application users, sessions, workspaces, memberships, roles, entitlements, financial records, audit trail and database.

Ariovelle must not connect to Lucia Core's database, import Lucia Core's internal user UUID as its durable identity key, or treat client-supplied identity fields as proof of authentication.

The durable cross-product identity key is the OIDC `sub` claim (Lucia's `oidcSubject`). Map it to a locally generated Ariovelle UUID:

`ariovelle_users.id` (UUID) ↔ `ariovelle_users.lucia_subject` (unique, immutable external subject).

Do not use email as the identity key. Email may change and is a profile attribute.

## 2. Discovery and endpoints

The Core code constructs its issuer from `OIDC_ISSUER` when configured, otherwise from `APPLICATION_URL`. It does not derive issuer from the request Host header.

At runtime, Ariovelle must fetch and validate the discovery document from the operator-confirmed canonical issuer:

- Discovery: `{issuer}/.well-known/openid-configuration`
- Authorization: `{issuer}/api/v1/consumer/oauth/authorize`
- Token: `{issuer}/api/v1/consumer/oauth/token`
- JWKS: `{issuer}/.well-known/jwks.json`
- UserInfo: `{issuer}/api/v1/oidc/userinfo`

Never hardcode a guessed production Lucia hostname. Configure the issuer as a server-side environment variable only after confirming the deployed Core value. Require HTTPS outside local development. Discovery and JWKS are public documents; validate exact issuer and endpoint origins, and refresh JWKS at most once when a key ID is unknown. Never follow token-supplied key URLs.

## 3. Client registration

Register Ariovelle in Lucia Core as a first-party **confidential** consumer client.

Provisioning inputs supported by Core include:
- `clientId`
- `clientSecret` (minimum 32 characters; Core stores a password hash)
- `audience` (required; productKey is only a legacy fallback)
- exact `redirectUri`
- `clientType: "confidential"`
- optional display name/description.

Use a dedicated audience for Ariovelle, agreed during provisioning. Register only the exact callback URI(s), including scheme, host, path and any required port. Production callback must use HTTPS. Keep client secret in server-side secret storage; never expose it in Vite variables, browser bundles, source control, logs or client responses.

The owner supplied client ID `lucia_4d08f98c2e1fe8335403d916`; Ariovelle has the ID and secret configured server-side on its preview environment. The Core-side database registration and exact granted-scope rows have not yet been independently confirmed. Do not treat the presence of an Ariovelle environment variable as proof that Core has an active registered client.

## 4. Authorization-code flow

1. Generate cryptographically random `state` (at least 32 characters) and `nonce` (at least 8 characters). Generate a PKCE verifier and S256 challenge even though Core's confidential-client flow permits PKCE to be optional; Ariovelle should require it.
2. Store the SHA-256 state hash, SHA-256 browser-binding hash, encrypted nonce/verifier payload, creation time and a ten-minute expiry in PostgreSQL. Set only a random opaque browser-binding value in an HttpOnly, SameSite=Lax cookie; do not put state, nonce or verifier in the browser. The callback atomically consumes the matching state/browser pair once through a narrowly scoped database function. Replayed, expired or wrong-browser callbacks return no transaction.
3. Redirect the browser to the discovered authorization endpoint with:
   - `response_type=code`
   - `client_id`
   - exact `redirect_uri`
   - registered `audience`
   - `scope=openid email profile` (only if those scopes are granted to the client; request the minimum needed)
   - `state`
   - `nonce`
   - `code_challenge`
   - `code_challenge_method=S256`.
4. Core requires a signed-in Core session, checks the registered redirect URI and audience, validates requested/granted scopes, and presents consent. The authorization code is single-use and expires after 60 seconds in the inspected implementation.
5. On callback, compare state in constant time where practical, require the original browser transaction, reject duplicate/replayed callbacks, and handle OAuth error responses without creating an Ariovelle session.
6. Exchange the code from the Ariovelle server only. POST form-encoded fields to the token endpoint:
   - `grant_type=authorization_code`
   - `code`
   - `redirect_uri` (exact same URI)
   - `audience`
   - HTTP Basic client authentication (`client_id:client_secret`) for the confidential client
   - `code_verifier`.
7. Do not log authorization codes, verifier, client secret, access token or ID token.

## 5. Token response and identity verification credential

The inspected Core token route returns a short-lived consumer bearer assertion and, when `openid` is granted, an OIDC ID token. Ariovelle requires both credentials: the access assertion for Core UserInfo and the ID token for local RS256 signature and claim validation.

### Consumer access assertion

- `access_token` and compatibility alias `token` contain the same value.
- Signed HS256 using Core's private `CONSUMER_ASSERTION_SECRET`.
- Claims include `iss=lucia-core`, `aud`, Core internal `sub`, `client_id`, `scope`, `iat`, `exp`, `jti`.
- Lifetime is 300 seconds.
- The signing secret is not published in JWKS. Ariovelle must not attempt to validate or decode this credential, must not copy Core's signing secret, and must not use the token response's `user.id` as the durable Ariovelle identity.
- Ariovelle exchanges the authorization code server-side using HTTP Basic confidential-client authentication and the PKCE verifier. It accepts only a Bearer token with a positive lifetime no greater than 300 seconds and immediately calls the protected identity endpoint.

### Protected identity verification API

Call the discovered UserInfo endpoint from the Ariovelle server using:

`Authorization: Bearer {access_token}`

Core's handler calls `authenticateConsumerRequest()`, which verifies the HMAC signature using Core's private assertion secret and checks that the consumer client is active, the audience matches, and the Core user is active. It then returns claims from the Core user record.

The response's `sub` is `users.oidcSubject`, Lucia's stable cross-product subject. It must exactly match the locally validated ID token `sub`. This is the only external identity key Ariovelle accepts. Optional `email`, `email_verified` and `name` claims are profile attributes and are validated before use. Core's internal user UUID is not used.

The UserInfo implementation always includes `sub` and only returns optional claims for explicitly granted scopes. Date of birth and phone are deliberately excluded from the general profile scope. Treat a missing/empty subject, malformed response, non-success HTTP response, or network error as an authentication failure. Never cache the bearer credential or identity response in the browser.

## 7. Ariovelle session and database mapping

After all validation succeeds, in a database transaction:
- Find or create Ariovelle's local user by unique `lucia_subject`.
- Preserve the existing local UUID on subsequent logins.
- Update only explicitly permitted profile fields; do not silently overwrite user preferences or workspace data.
- Create a new opaque, cryptographically random Ariovelle session token.
- Store only a strong hash of the session token in PostgreSQL.
- Set an HttpOnly, Secure, SameSite=Lax cookie with a bounded expiry and Path=/.
- Atomically consume the server-side pre-authentication transaction before token exchange; clear the browser-binding cookie after callback success or failure.
- Record a minimal authentication audit event without tokens, secrets, authorization codes or unnecessary PII.

The application session is independent of Lucia Core's browser session and must be revocable by Ariovelle. Do not make every API request depend on a live Core call; use the validated local session, with an explicit account-disable/revocation strategy to be designed.

## 8. Tenant and financial-data security

A successful Lucia login proves identity only. It does not grant workspace membership, owner/admin status, billing entitlement or access to financial records.

For each protected request:
- Resolve the Ariovelle user from the validated Ariovelle session.
- Resolve workspace membership and permission from Ariovelle's own database.
- Establish transaction-local verified identity and tenant context.
- Apply PostgreSQL RLS and least-privilege runtime role.
- Deny by default when user, workspace, membership or permission context is absent.
- Never accept `user_id`, `tenant_id`, role or entitlement from an untrusted browser payload as authority.

## 9. Required tests before enabling login

- Discovery issuer is exactly the configured allowlisted issuer and uses HTTPS in production.
- State mismatch, missing state, expired state and replayed callback fail.
- PKCE verifier mismatch fails.
- Invalid client, secret, audience, redirect URI and reused/expired code fail.
- Invalid signature, unknown `kid`, wrong issuer/audience, expired ID token, future `iat`, missing/wrong nonce and unsupported algorithm fail.
- JWKS rotation is handled safely.
- UserInfo errors and `sub` mismatch fail.
- Missing/changed email does not create a duplicate account.
- Concurrent first login cannot create duplicate local users.
- Session cookie flags, hash-at-rest, expiry, rotation, logout and revocation are tested.
- Unauthenticated requests and cross-workspace access are denied by RLS integration tests.

## 10. Deployment facts still requiring confirmation

Repository inspection is not proof of the deployed Core environment. Before enabling authentication, an operator must confirm:
- Canonical deployed issuer URL and its HTTPS certificate.
- Discovery document values match the repository and deployed release.
- JWKS is reachable and contains the active RS256 signing key.
- Core's production OAuth consumer registration is enabled and healthy.
- Ariovelle's client ID, audience, exact redirect URI and granted scopes.
- Client secret is stored in the approved secret manager and never exposed.
- Core production signing-key encryption configuration is healthy.

Do not probe or alter production Core settings as part of this specification. Do not enable login until these checks and the implementation tests pass.

## 11. Explicitly out of scope

This contract does not authorize changes to Lucia Core, client registration, production secrets, deployment, Firebase deletion, data migration, financial writes, payment processing or production database changes.
\n\n## 12. Implementation status and fail-closed runtime gate

Ariovelle contains a server-side adapter, OAuth start/callback routes, local hashed session persistence, logout/revocation, and a workspace wrapper that resolves the local session, establishes transaction-local RLS context, checks membership/role permissions and runs protected queries in one transaction.

OAuth state is stored server-side in PostgreSQL. Only state and browser-binding hashes are indexed; the nonce/verifier payload is encrypted with the server-only session secret. The browser receives only a random HttpOnly browser-binding cookie. The callback consumes the state/browser pair atomically and exactly once.

Migration 0004 (local identity/session functions) and migration 0005 (one-time OAuth transaction store) are applied only to the disposable Ariovelle development database. Neither migration has been applied to production. The runtime role receives EXECUTE on narrowly scoped SECURITY DEFINER functions and no direct session/OAuth transaction table access.

Login remains disabled. Owner confirmed on 2026-11-14 that Core production now uses `OIDC_ISSUER=https://auth.lucia.name.ng`, its production deployment is READY, the custom domain is assigned to production and excluded from deployment SSO, and discovery advertises the same issuer plus the canonical JWKS URL with an RS256 signing key (`kid=0c05947a954f4edd`). Ariovelle preview must use this canonical issuer. Do not change Core issuer or rotate the signing key as part of Ariovelle integration. Complete a live preview token exchange and a real user login before enabling production authentication.
