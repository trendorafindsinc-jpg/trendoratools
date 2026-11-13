import {
  readLuciaConfig,
  constantTimeEqual,
  fetchOidcDiscovery,
  exchangeLuciaCode,
  validateLuciaIdToken,
  fetchLuciaUserInfo,
  openOAuthTransaction,
  parseCookies,
  buildCookie,
  clearCookie,
  luciaCookieNames,
} from '../../_lib/lucia-oauth';
import { consumeOAuthTransaction } from '../../_lib/lucia-oauth-store';
import { establishLuciaSession } from '../../_lib/lucia-session';
import { createRuntimePostgres } from '../../_lib/postgres-pool';
import { sendError, sendMethodNotAllowed, type ApiRequest, type ApiResponse } from '../../_lib/http';

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

    // Consume before processing provider errors or exchanging the code. A
    // callback can only consume this state/browser pair once.
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
    const claims = await validateLuciaIdToken({
      token: tokens.id_token!,
      config,
      discovery,
      nonce: tx.nonce,
    });
    const profile = await fetchLuciaUserInfo({
      discovery,
      accessToken: tokens.access_token!,
      expectedSubject: claims.sub!,
    });

    const established = await establishLuciaSession(runtime.database, {
      issuer: config.issuer,
      subject: claims.sub!,
      email: typeof profile.email === 'string' ? profile.email : undefined,
      emailVerified: profile.email_verified === true,
      displayName: typeof profile.name === 'string' ? profile.name : undefined,
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
