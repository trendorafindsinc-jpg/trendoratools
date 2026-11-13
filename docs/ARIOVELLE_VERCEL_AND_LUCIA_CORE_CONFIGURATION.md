# Ariovelle Vercel and Lucia Core configuration

Status: read-only audit and configuration specification. No variables, secrets, OAuth clients, database records, schemas or deployments were changed.

## Verified Core database

- Neon project: `lucia-core-production` (`snowy-grass-03771692`)
- Region: `aws-us-east-2`; branch: `production` (`br-calm-pine-b5gp67s1`)
- Database: `neondb`; PostgreSQL 18
- OAuth registry tables exist: `consumer_clients`, `consumer_client_redirect_uris`, `consumer_client_origins`, `consumer_client_scopes`.
- One active RS256 OIDC signing key is registered. Private key material was not queried.
- Ariovelle has no client registration. Existing first-party applications use confidential clients with exact redirect URIs, audiences and explicit scopes.

Do not connect Ariovelle to Lucia Core's database. Ariovelle must use its own Neon database and its own runtime role.

## Core Vercel project findings

The `lucia-secure` Vercel project reports `live: false`; its latest inspected deployment was `CANCELED`. No custom identity domain is attached. The inspected production `APPLICATION_URL` is `https://lucia-secure.vercel.app`, which was not in the project's attached domain list. `OIDC_ISSUER` is absent, and `TRUSTED_ORIGINS` does not include `https://ariovelle.lucia.name.ng`.

Core production variables already include `DATABASE_URL`, `CONSUMER_ASSERTION_SECRET`, and `OIDC_SIGNING_KEY_ENCRYPTION_KEY`; values were not decrypted. The encrypted database URL was not compared to the Neon endpoint, so its project mapping remains unverified.

## Required Core Vercel configuration

Only after an operator attaches and deploys the canonical HTTPS issuer:

- `OIDC_ISSUER`: exact canonical HTTPS origin, no path/query/trailing slash.
- `APPLICATION_URL`: same canonical HTTPS origin.
- `TRUSTED_ORIGINS`: preserve existing origins and add exactly `https://ariovelle.lucia.name.ng`; no wildcards.
- `DATABASE_URL`: remain pointed at Core's own `lucia-core-production` production database and Core runtime role. Never replace with Ariovelle's URL.
- Keep `CONSUMER_ASSERTION_SECRET` and `OIDC_SIGNING_KEY_ENCRYPTION_KEY` server-only and unchanged unless Core's operator separately manages rotation.

Do not assume `lucia-secure.vercel.app` or `auth.lucia.name.ng` is the canonical issuer. The latter was not attached when checked.

## Core OAuth client registration

After Core is live and its nonce bug is fixed, register a new first-party confidential client through Core's supported registration flow:

- Name: `Ariovelle`
- Product key: `ariovelle`
- Dedicated audience: `ariovelle`
- Exact production callback: `https://ariovelle.lucia.name.ng/api/auth/lucia/callback`
- Minimum scopes: `openid email profile`, only if granted/approved.
- PKCE S256 required.
- Store the generated client secret only in an approved secret manager.

Do not manually insert a client row, reuse another product's client, or register wildcard redirect URIs.

## Ariovelle Vercel variables

These are server-only. Never use a `VITE_` prefix:

| Variable | Configuration | Status |
|---|---|---|
| `DATABASE_URL` | Ariovelle-owned PostgreSQL database and least-privilege runtime role; never Core's database URL. | No production DB configured |
| `LUCIA_ISSUER` | Exact canonical issuer verified from deployed Core discovery. | Blocked |
| `LUCIA_CLIENT_ID` | Client ID issued for Ariovelle. | Not registered |
| `LUCIA_CLIENT_SECRET` | Confidential-client secret, minimum 32 characters. | Not issued |
| `LUCIA_AUDIENCE` | Dedicated registered audience; planned value `ariovelle`. | Pending registration |
| `LUCIA_REDIRECT_URI` | `https://ariovelle.lucia.name.ng/api/auth/lucia/callback` | Callback implemented; registration pending |
| `ARIOVELLE_SESSION_SECRET` | Cryptographically random secret, minimum 32 characters, unique per environment. | Not provisioned |
| `LUCIA_AUTH_ENABLED` | Unset or exactly `false` until all release gates pass. | Must remain disabled |

Vercel supplies `NODE_ENV`. The disposable `ariovelle-dev` Neon project is development-only and must not be used as a production database URL.

## Never copy from Core to Ariovelle

- Core `CONSUMER_ASSERTION_SECRET`
- Core `OIDC_SIGNING_KEY_ENCRYPTION_KEY`
- Core `DATABASE_URL`, database credentials or private signing keys

Ariovelle validates ID tokens with the public JWKS. It does not need Core's HS256 signing secret.

## Critical Core source blocker

Inspected Lucia Core `main` drops the authorization-request nonce when consuming an authorization code. Core must return the stored nonce from `exchangeAuthorizationCode()`, pass it to ID-token issuance, and add regression tests. Do not weaken Ariovelle's nonce validation.

## Release gates

1. Canonical Core HTTPS domain attached and successful deployment reachable.
2. Core `OIDC_ISSUER`, `APPLICATION_URL` and `TRUSTED_ORIGINS` correct.
3. Core nonce propagation fixed and tested.
4. Deployed discovery and JWKS verified.
5. Ariovelle confidential client registered with exact callback, audience and approved scopes.
6. Ariovelle environment-specific database and runtime role verified.
7. PostgreSQL integration tests pass against the target database.
8. Vercel server-only variables configured for the correct target environment.
9. End-to-end login, nonce, UserInfo subject, local session, workspace authorization and logout verified.
10. Explicit operator approval to set `LUCIA_AUTH_ENABLED=true`.

## Safe-state confirmation

- Core Neon was inspected read-only.
- No OAuth client was registered.
- No database rows/schema changed.
- No Vercel environment variable or secret was added, changed, decrypted or deleted.
- No deployment was triggered.
- Ariovelle login remains disabled.
- Do not remove Firebase until the separate dependency-removal and regression work is completed.