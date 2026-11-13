import { randomBytes } from 'node:crypto';
import {
  readLuciaConfig,
  createPkcePair,
  sealOAuthTransaction,
  buildCookie,
  fetchOidcDiscovery,
  luciaCookieNames,
} from '../../_lib/lucia-oauth';
import { createRuntimePostgres } from '../../_lib/postgres-pool';
import { storeOAuthTransaction } from '../../_lib/lucia-oauth-store';
import { sendError, sendMethodNotAllowed, type ApiRequest, type ApiResponse } from '../../_lib/http';

export default async function startLuciaAuth(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') return sendMethodNotAllowed(response, ['GET']);
  try {
    if (process.env.LUCIA_AUTH_ENABLED !== 'true') {
      return sendError(response, 404, 'AUTH_DISABLED', 'Sign-in is not enabled.');
    }
    const config = readLuciaConfig(process.env);
    if (!config.enabled) return sendError(response, 404, 'AUTH_DISABLED', 'Sign-in is not enabled.');
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('OAuth transaction store is not configured.');

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

    const url = new URL(discovery.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('audience', config.audience);
    url.searchParams.set('scope', 'openid email profile');
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
    response.setHeader('Location', url.toString());
    response.status(302).json({ redirecting: true });
  } catch {
    sendError(response, 503, 'AUTH_UNAVAILABLE', 'Lucia sign-in is temporarily unavailable.');
  }
}
