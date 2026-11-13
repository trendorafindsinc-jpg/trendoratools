# Ariovelle ↔ Lucia Core Identity Integration Contract

Status: implementation specification; authentication remains disabled.

Source of truth inspected read-only:
- Repository: https://github.com/trendorafindsinc-jpg/lucia-core
- Branch inspected: main
- Relevant modules: `src/modules/oidc/config.ts`, `src/modules/oidc/id-token.ts`, `src/modules/oidc/keys.ts`, `src/modules/oidc/userinfo.ts`, `src/modules/consumer/service.ts`, `src/modules/consumer/consent.ts`
- Relevant routes: OIDC discovery, JWKS, consumer OAuth authorize/token, OIDC UserInfo.

## 1. Responsibility boundary

Lucia Core is the identity provider. Ariovelle is an OAuth/OIDC relying party and owns its own application users, sessions, workspaces, memberships, roles, entitlements, financial records, audit trail and database.

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

Never hardcode a guessed production Lucia hostname. Configure the issuer as a server-side environment variable only after confirming the deployed Core value. Require HTTPS outside local development. Discovery/JWKS are public documents; cache briefly and refresh JWKS on unknown `kid`.

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

No client has been registered as part of this documentation work.

## 4. Authorization-code flow

1. Generate cryptographically random `state` (at least 32 characters) and `nonce` (at least 8 characters). Generate a PKCE verifier and S256 challenge even though Core's confidential-client flow permits PKCE to be optional; Ariovelle should require it.
2. Store state, nonce, verifier, creation time and a short expiry in a server-side, one-time authorization transaction bound to the initiating browser session. Do not rely on unsigned client-side state.
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

## 5. Token response: two distinct JWTs

The inspected Core implementation returns an access assertion and, when the granted scope contains `openid`, an OIDC ID token. They are not interchangeable.

### Consumer access assertion

- `access_token` and compatibility alias `token` contain the same value.
- Signed HS256 using Core's private `CONSUMER_ASSERTION_SECRET`.
- Claims include `iss=lucia-core`, `aud`, Core internal `sub`, `client_id`, `scope`, `iat`, `exp`, `jti`.
- Lifetime is 300 seconds.
- This signing secret is not published in JWKS. Ariovelle must not attempt to verify this assertion as an RS256 OIDC token or copy the Core secret into Ariovelle.

Use this access token as a bearer credential only when calling Core's protected consumer endpoints, notably UserInfo. Core verifies it internally and checks client status, audience and active Core user.

### OIDC ID token

- Present as `id_token` when the granted scope includes `openid`.
- Signed RS256 with Core-managed RSA key material; JWT header contains `kid`.
- Public keys are published through JWKS.
- Claims include `iss`, `sub` (the stable OIDC subject), `aud` (client ID), `exp`, `iat`, `auth_time`, `jti`, and `nonce` when provided.
- Lifetime is 300 seconds.
- Email/name claims are scope-dependent.

Ariovelle must validate the ID token signature using the discovered JWKS and a maintained JOSE library; enforce exact issuer, audience equal to Ariovelle client ID, expiry, issued-at sanity, allowed algorithm RS256, non-empty subject, and exact nonce match. Reject missing/incorrect nonce. Do not accept `alg=none`, HS256, an untrusted key URL, or a key supplied by the token. Handle key rotation by refreshing JWKS once for an unknown `kid`, then fail closed.

The token route returns a `user` object with Core's internal UUID/email/displayName for compatibility. Do not use that object as the durable Ariovelle identity. The validated ID token's `sub` is the identity contract.

## 6. UserInfo

Call the discovered UserInfo endpoint from the server using:

`Authorization: Bearer {access_token}`

Core's UserInfo handler authenticates the HS256 consumer assertion internally and returns claims according to granted scopes. The response includes `sub`; optional claims include `name`, `email`, `email_verified`, and selected `lucia.profile` claims.

Require UserInfo `sub` to exactly equal the validated ID token `sub`. Treat a mismatch as a hard authentication failure. UserInfo is supplemental profile data, not a substitute for ID-token validation.

The Core code deliberately excludes date of birth and phone from the general profile scope. Ariovelle should request no unnecessary personal information.

## 7. Ariovelle session and database mapping

After all validation succeeds, in a database transaction:
- Find or create Ariovelle's local user by unique `lucia_subject`.
- Preserve the existing local UUID on subsequent logins.
- Update only explicitly permitted profile fields; do not silently overwrite user preferences or workspace data.
- Create a new opaque, cryptographically random Ariovelle session token.
- Store only a strong hash of the session token in PostgreSQL.
- Set an HttpOnly, Secure, SameSite=Lax cookie with a bounded expiry and Path=/.
- Rotate/revoke any pre-authentication transaction state.
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
