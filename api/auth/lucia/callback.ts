import {
  readLuciaConfig,
  constantTimeEqual,
  fetchOidcDiscovery,
  openOAuthTransaction,
  validateLuciaIdToken,
  exchangeLuciaCode,
  fetchLuciaUserInfo,
  parseCookies,
  buildCookie,
  clearCookie,
  luciaCookieNames,
} from '../../_lib/lucia-oauth.js';
import { consumeOAuthTransaction } from '../../_lib/lucia-oauth-store.js';
import { establishLuciaSession } from '../../_lib/lucia-session.js';
import { createRuntimePostgres } from '../../_lib/postgres-pool.js';
import { sendError, sendMethodNotAllowed, type ApiRequest, type ApiResponse } from '../../_lib/http.js';

function header(request: ApiRequest, name: string): string | undefined {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}
function query(url: string | undefined): URLSearchParams {
  return new URL(url ?? '/api/auth/lucia/callback', 'https://ariovelle.invalid').searchParams;
}

export default async function luciaCallback(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') return sendMethodNotAllowed(response, ['GET']);
  if (process.env.LUCIA_AUTH_ENABLED !== 'true') {
    return sendError(response, 404, 'AUTH_DISABLED', 'Sign-in is not enabled.');
  }

  let config;
  try {
    config = readLuciaConfig(process.env);
  } catch {
    return sendError(response, 503, 'AUTH_NOT_CONFIGURED', 'Lucia sign-in is not configured.');
  }

  const cookies = parseCookies(header(request, 'cookie'));
  const params = query(request.url);
  let closePool: (() => Promise<void>) | undefined;
  try {
    const returnedState = params.get('state') ?? '';
    const browserBinding = cookies[luciaCookieNames.transaction] ?? '';
    const code = params.get('code') ?? '';
    if (!returnedState || !browserBinding) throw new Error('Missing OAuth callback binding.');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('OAuth transaction store is not configured.');
    const runtime = createRuntimePostgres(databaseUrl);
    closePool = () => runtime.pool.end();

    // Atomically consume before provider error handling or code exchange.
    const encryptedTransaction = await consumeOAuthTransaction(
      runtime.database,
      returnedState,
      browserBinding,
    );
    if (!encryptedTransaction) throw new Error('OAuth transaction is invalid or already consumed.');
    const tx = openOAuthTransaction(encryptedTransaction, config.sessionSecret);
    if (!constantTimeEqual(returnedState, tx.state)) throw new Error('OAuth state mismatch.');
    if (params.has('error')) throw new Error('The identity provider declined authorization.');
    if (!code) throw new Error('Authorization code is missing.');

    const discovery = await fetchOidcDiscovery(config);
    const tokens = await exchangeLuciaCode({
      config,
      discovery,
      code,
      verifier: tx.verifier,
    });
    if (!tokens.id_token) throw new Error('Lucia Core did not return an OIDC ID token.');

    // Validate the signed identity assertion locally against Core's published
    // RS256 keys. The nonce binds it to this one-time browser transaction.
    const idClaims = await validateLuciaIdToken({
      token: tokens.id_token,
      config,
      discovery,
      nonce: tx.nonce,
    });
    if (typeof idClaims.sub !== 'string' || !idClaims.sub) {
      throw new Error('Validated ID token has no stable subject.');
    }

    // UserInfo is an additional Core-side identity/account verification.
    // Its subject must match the locally validated ID token subject.
    const profile = await fetchLuciaUserInfo({
      discovery,
      accessToken: tokens.access_token,
      expectedSubject: idClaims.sub,
    });

    if (typeof profile.email !== 'string' || !profile.email.trim()) {
      throw new Error('Verified profile email is missing from the granted identity scopes.');
    }
    const established = await establishLuciaSession(runtime.database, {
      issuer: config.issuer,
      subject: idClaims.sub,
      email: profile.email,
      emailVerified: profile.email_verified === true,
      displayName: profile.name,
      ttlSeconds: 60 * 60 * 24 * 14,
    });
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Set-Cookie', [
      clearCookie(luciaCookieNames.transaction, config.environment === 'production'),
      buildCookie(luciaCookieNames.session, established.session.token, {
        maxAge: 60 * 60 * 24 * 14,
        secure: config.environment === 'production',
      }),
    ]);
    response.setHeader('Location', '/');
    response.status(302).json({ authenticated: true });
  } catch {
    response.setHeader(
      'Set-Cookie',
      clearCookie(luciaCookieNames.transaction, config.environment === 'production'),
    );
    sendError(response, 401, 'AUTHENTICATION_FAILED', 'Lucia sign-in could not be completed. Please try again.');
  } finally {
    await closePool?.();
  }
}
