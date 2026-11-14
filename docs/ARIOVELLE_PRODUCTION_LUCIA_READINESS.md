# Ariovelle Production Lucia ID Readiness

**Date:** 2026-11-14  
**Product:** Ariovelle, a product of Lucia LLC  
**Scope:** Ariovelle only. Lucia Core remains owned by its separate agent.

## Production infrastructure provisioned

- Neon project: `ariovelle-production`
- Project ID: `cold-river-90224713`
- Region: `aws-eu-central-1`
- PostgreSQL: 17
- Branch: `production` (`br-lingering-darkness-b9s2sgyr`)
- Database: `ariovelle_prod`
- Owner/migration role: `ariovelle_owner`
- Application role: `ariovelle_runtime`

The production database was empty before setup. Migrations 0000–0007 are recorded in `public.schema_migrations` with SHA-256 checksums matching the exact checked-in migration files. No financial tables or financial data have been created or imported.

## Database security controls

- RLS is enabled on all 12 public tables.
- The foundation has 17 tenant policies.
- `ariovelle_runtime` is non-superuser, cannot create roles or databases, and has no BYPASSRLS.
- Runtime role timeouts: statement 10s, lock 2s, idle-in-transaction 15s.
- Runtime cannot directly read or write session, OAuth transaction, import-provenance or schema-migration tables. Narrow `app_private` SECURITY DEFINER functions provide session/OAuth operations.
- All ten `app_private` functions are owned by `ariovelle_owner`; the runtime role receives only the reviewed schema/function access and explicit RLS-scoped table grants.
- The migration-owner credential is not stored in Vercel and must never be used by application routes.

## Vercel Production environment configured

Project: `trendoratools` (`prj_losjSMBzwoDL8LkYB9KIDShm1FUe`)

Production-only variables configured:
- `DATABASE_URL`: sensitive pooled connection using `ariovelle_runtime`.
- `ARIOVELLE_SESSION_SECRET`: newly generated, independent production secret; sensitive.
- `LUCIA_ISSUER=https://auth.lucia.name.ng`.
- `LUCIA_CLIENT_ID=lucia_4d08f98c2e1fe8335403d916`.
- `LUCIA_AUDIENCE=ariovelle`.
- `LUCIA_REDIRECT_URI=https://ariovelle.lucia.name.ng/api/auth/lucia/callback`.
- `LUCIA_AUTH_ENABLED=false` pending deployment/domain activation.

The existing production `LUCIA_CLIENT_SECRET` variable is already present as a sensitive Vercel variable. Its value was not read or changed. The existing Lucia Core client registration, scopes, audience, callback and signing key were not modified.

Preview variables remain scoped to the disposable development database and feature branch. Production does not use the development database.

## Remaining activation gates

1. The verified Vercel project domain `ariovelle.lucia.name.ng` is currently assigned to Preview branch `feat/ariovelle-phase-1-design-system`. It must be reassigned to the Production deployment before the registered callback can safely establish a Production session. The available Vercel project connector does not expose a domain-branch update/removal action; do not alter DNS or parent nameservers as a workaround.
2. Create a manual Production deployment from the completed Ariovelle branch after the domain assignment is corrected. Git auto-deployment remains disabled.
3. Enable `LUCIA_AUTH_ENABLED=true` for Production only after the Production deployment has the domain and database settings.
4. Perform real browser acceptance of Lucia authorization, callback, ID-token/JWKS validation, UserInfo subject binding, Ariovelle session creation, `/api/auth/me`, workspace resolution and logout.
5. Keep Preview authentication disabled until its separate disposable-development migration approval and browser acceptance are completed.

## Product boundary

This Production setup enables Lucia identity, Ariovelle account/session bootstrap and personal-workspace ownership only. It does **not** enable cloud financial synchronization, financial writes, automatic migration of device-local records, business collaboration, or replacement of offline-first local persistence. Those remain separate product implementation milestones.

## Lucia Core boundary

No Lucia Core source, database, environment variables, signing keys, client registration, domain, or deployment was modified. The active Core signing key was not rotated. The outstanding legacy plaintext-key and recovery-evidence audit remains with the Core owner/agent.


## Manual Production deployment

- Deployment ID: `dpl_3djYUPrhdGw8qn1mXcPxNRJeHZ6q`
- State: **READY**
- Deployment URL: `https://trendoratools-ejfks2cyi-trendoraplc-5738.vercel.app`
- Target: Production
- Source branch: `feat/ariovelle-phase-1-design-system`
- Source commit: `114f655b32e6870e1e5475a76137de05edc91958`
- Build: TypeScript and Vite production build completed; PWA assets generated.
- Git auto-deploy remains disabled.
- The production deployment was created with `LUCIA_AUTH_ENABLED=false`; no login traffic is accepted until the domain assignment is corrected.

The Vercel default deployment aliases are live, but the registered custom callback domain remains branch-bound to Preview. Do not mistake the READY deployment for completed Production Lucia login.


## Domain reassignment and Production activation update

The owner removed the Preview Git Branch binding from `ariovelle.lucia.name.ng`. Vercel now reports the custom domain as verified with `gitBranch=null`, and the alias resolves to the Production deployment.

Production `LUCIA_AUTH_ENABLED` has been set to `true`. A fresh manual Production deployment was created to consume the updated environment:

- Deployment ID: `dpl_GUA8wCVPJswWuzVaDdqEa8qZTfeT`
- State: **READY**
- Production custom alias: `https://ariovelle.lucia.name.ng`
- Deployment URL: `https://trendoratools-asv7s5g9f-trendoraplc-5738.vercel.app`
- Commit: `114f655b32e6870e1e5475a76137de05edc91958`
- Alias mapping: verified to the new READY Production deployment.

The TypeScript/Vite production build completed and generated PWA assets. Vercel reports no deployment alias error. The deployment is now ready to accept the first Production Lucia sign-in.

**Live browser acceptance is still outstanding.** The connected browser context is not available in this session, and no real user authorization, callback, ID-token validation, `/api/auth/me`, or logout has yet been observed. Do not describe Lucia login as fully verified until that end-to-end sign-in is completed. The owner should open the Production site, choose **Continue with Lucia**, complete the Lucia consent/sign-in flow, and confirm that Ariovelle returns to an authenticated workspace. Then verify session persistence and logout. Do not share credentials or authorization codes in chat.
