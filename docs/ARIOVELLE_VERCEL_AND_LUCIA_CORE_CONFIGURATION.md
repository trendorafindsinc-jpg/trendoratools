# Ariovelle Vercel and Lucia ID configuration

**Last reconciled:** 2026-11-14  
**Status authority:** [ARIOVELLE_PHASE_2_STATUS.md](ARIOVELLE_PHASE_2_STATUS.md). This document records configuration boundaries; it is not the Phase 2 progress ledger.

## 1. Database ownership

Ariovelle uses its own disposable Neon development database. Do not connect Ariovelle to Lucia Core's database.

- Neon project: `ariovelle-dev` (`super-base-35733977`)
- Region: `aws-eu-central-1`
- Branch: `main` (`br-young-sound-ba8m1n50`)
- Database: `ariovelle_dev`, PostgreSQL 17.12
- Runtime role: `ariovelle_runtime`; least privilege and RLS enforced.
- Administrative role: `ariovelle_owner`; has BYPASSRLS and administrative capabilities. Never use it for application requests.

## 2. Ariovelle Vercel configuration snapshot

The following configuration was set on the Vercel project `trendoratools` for the feature branch preview. Secret values were not retrieved or disclosed.

| Variable | Preview state | Production state / note |
|---|---|---|
| `DATABASE_URL` | Configured to disposable `ariovelle_dev` using `ariovelle_runtime` | Not configured; no production database |
| `LUCIA_CLIENT_ID` | Configured with the owner-supplied Ariovelle client ID | Not confirmed configured |
| `LUCIA_CLIENT_SECRET` | Present; owner added it | Present; owner added it |
| `LUCIA_AUDIENCE` | `ariovelle` | Not confirmed configured |
| `LUCIA_REDIRECT_URI` | `https://ariovelle.lucia.name.ng/api/auth/lucia/callback` | Not confirmed configured |
| `ARIOVELLE_SESSION_SECRET` | Generated and configured as encrypted server-only value | Not configured by this work |
| `LUCIA_AUTH_ENABLED` | `false` | Must remain disabled |

**Important distinction:** the preview database URL is configured, but the PostgreSQL pool is not yet wired into HTTP route composition. This does not mean database-backed application APIs or financial writes are enabled. A configured variable alone is not a verified connection.

`LUCIA_ISSUER` is not configured because the canonical deployed Lucia ID issuer has not been handed over and verified. Do not guess it.

Vercel Git automatic deployments remain disabled by owner instruction. Do not change that setting or trigger a deployment without explicit approval. No production deployment is authorized.

## 3. Lucia Core handover boundary

Lucia Core is owned by its separate agent. Ariovelle work must not modify the Core repository, branches, database, Vercel settings, secrets, DNS or deployments. Read-only inspection is allowed only when essential to verify the integration after the Core agent supplies a handover.

The last read-only snapshot (2026-11-13) recorded:
- No confirmed canonical HTTPS issuer was reachable.
- The inspected Core Vercel project reported `live: false`; the deployment/issuer findings are historical and must be reconfirmed by Core's agent.
- A nonce-propagation defect was identified in the inspected source. Ariovelle's strict nonce validation must not be weakened.
- Ariovelle's owner-supplied client ID and secret have since been configured on the Ariovelle Vercel project as described above. This does not establish that the Core-side registration or deployed provider flow is currently ready.

Wait for the Core agent's explicit confirmation of:
1. Canonical issuer URL and reachable HTTPS deployment.
2. Discovery document and JWKS endpoint.
3. Authorization-code nonce propagation and regression test.
4. Registered first-party confidential Ariovelle client with exact callback, audience and approved scopes.
5. Successful provider-side token exchange and UserInfo behavior.

Do not change `LUCIA_ISSUER` or set `LUCIA_AUTH_ENABLED=true` until these details are verified and Ariovelle end-to-end tests pass.

## 4. OIDC and session security contract

- First-party confidential client; Authorization Code flow with PKCE S256.
- Exact callback only: `https://ariovelle.lucia.name.ng/api/auth/lucia/callback`.
- Minimum approved scopes: `openid profile email`.
- Client secret, session secret and database URL remain server-only; never use a `VITE_` prefix.
- Validate signature, exact issuer, audience, expiry, issued-at and exact nonce using the discovered issuer's RS256 JWKS.
- UserInfo subject must equal the validated ID-token subject.
- Do not validate Core's HS256 consumer assertion locally; it is only a bearer credential for Core UserInfo.
- Map stable issuer + subject to an internal Ariovelle user UUID. Never use email or Core's internal database UUID as the durable identity key.
- Keep local opaque sessions hash-only at rest, HttpOnly, Secure and revocable.
- Resolve session, establish transaction-local RLS identity/workspace context, authorize membership and execute tenant queries in the same database transaction.

## 5. Release gates

1. Core agent supplies verified canonical issuer and deployed provider handover.
2. Live discovery/JWKS/token/UserInfo behavior matches the integration contract.
3. Nonce propagation and replay/PKCE behavior pass provider regression tests.
4. Ariovelle's confidential client registration, audience and exact redirect are confirmed by Core's agent.
5. Apply/verify development migrations and run real PostgreSQL identity/session/OAuth/RLS tests.
6. Complete Ariovelle sign-in, session resolution, workspace authorization and logout end-to-end against the provider test environment.
7. Complete security review and obtain explicit owner approval before enabling login.
8. Keep production database, production deployment and Vercel auto-deploy disabled unless separately authorized.

## 6. Safe-state confirmation

- Ariovelle preview has a development-only database URL; no production database URL was configured.
- Ariovelle login remains disabled.
- The preview OAuth client ID, audience, callback, session secret and owner-supplied client secret are server-side configuration; secret values have not been read or exposed.
- No production login or production deployment was enabled.
- No Lucia Core code, database, Vercel settings, secrets, DNS or deployments were modified by this Ariovelle work.
- Firebase remains intact. The owner's clean-start decision excludes legacy beta-tester data migration; it does not authorize Firebase retirement.
