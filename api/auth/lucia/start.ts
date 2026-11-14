import { randomBytes } from 'node:crypto';
import {
  readLuciaConfig,
  createPkcePair,
  sealOAuthTransaction,
  buildCookie,
  fetchOidcDiscovery,
  luciaCookieNames,
  LuciaAuthError,
} from '../../_lib/lucia-oauth.js';
import { createRuntimePostgres } from '../../_lib/postgres-pool.js';
import { storeOAuthTransaction } from '../../_lib/lucia-oauth-store.js';
import { sendError, sendMethodNotAllowed, type ApiRequest, type ApiResponse } from '../../_lib/http.js';

export default async function startLuciaAuth(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') return sendMethodNotAllowed(response, ['GET']);
  let stage = 'configuration';
  try {
    if (process.env.LUCIA_AUTH_ENABLED !== 'true') {
      return sendError(response, 404, 'AUTH_DISABLED', 'Sign-in is not enabled.');
    }
    const config = readLuciaConfig(process.env);
    if (!config.enabled) return sendError(response, 404, 'AUTH_DISABLED', 'Sign-in is not enabled.');
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('OAuth transaction store is not configured.');

    stage = 'oidc_discovery';
    const discovery = await fetchOidcDiscovery(config);
    const { verifier, challenge } = createPkcePair();
    const tx = {
      state: randomBytes(32).toString('base64url'),
      nonce: randomBytes(32).toString('base64url'),
      verifier,
      createdAt: Date.now(),
    };
    const browserBinding = randomBytes(32).toString('base64url');
    const expiresAt = new Date(tx.createdAt + 10 * 60_000);
    stage = 'oauth_transaction_persistence';
    const runtime = createRuntimePostgres(databaseUrl);
    try {
      await storeOAuthTransaction(runtime.database, {
        state: tx.state,
        browserBinding,
        encryptedTransaction: sealOAuthTransaction(tx, config.sessionSecret),
        expiresAt,
      });
    } finally {
      await runtime.pool.end();
    }

    stage = 'authorization_redirect';
    const url = new URL(discovery.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('audience', config.audience);
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('state', tx.state);
    url.searchParams.set('nonce', tx.nonce);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');

    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Set-Cookie',
      buildCookie(luciaCookieNames.transaction, browserBinding, {
        maxAge: 600,
        secure: config.environment === 'production',
      }),
    );
    response.redirect(302, url.toString());
  } catch (error) {
    // Log only a stable error code/type; never log credentials, tokens, URLs or user data.
    const sqlState = typeof error === 'object' && error !== null && 'code' in error &&
      typeof (error as { code?: unknown }).code === 'string' &&
      /^[0-9A-Z]{5}$/.test((error as { code: string }).code)
      ? (error as { code: string }).code
      : undefined;
    console.error('[ariovelle][lucia-start] failed', {
      stage,
      code: error instanceof LuciaAuthError ? error.code : sqlState ?? 'UNEXPECTED_ERROR',
      errorType: error instanceof Error ? error.name : 'unknown',
    });
    sendError(response, 503, 'AUTH_UNAVAILABLE', 'Lucia sign-in is temporarily unavailable.');
  }
}
