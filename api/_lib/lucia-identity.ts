import type { OidcDiscovery, LuciaConfig } from './lucia-oauth';

export class LuciaIdentityApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'LuciaIdentityApiError';
  }
}

export type LuciaVerifiedIdentity = {
  subject: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
};

/** Exchanges the one-time authorization code with Lucia Core. */
export async function exchangeLuciaAuthorizationCode(input: {
  config: LuciaConfig;
  discovery: OidcDiscovery;
  code: string;
  verifier: string;
  fetcher?: typeof fetch;
}): Promise<{ accessToken: string; expiresIn: number; scope: string }> {
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.config.redirectUri,
    audience: input.config.audience,
    code_verifier: input.verifier,
  });
  const basic = Buffer.from(input.config.clientId + ':' + input.config.clientSecret).toString('base64');
  let response: Response;
  try {
    response = await (input.fetcher ?? fetch)(input.discovery.token_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + basic,
      },
      body: form,
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new LuciaIdentityApiError('TOKEN_ENDPOINT_UNAVAILABLE', 'Lucia Core token endpoint is unavailable.');
  }
  if (!response.ok) {
    throw new LuciaIdentityApiError('TOKEN_EXCHANGE_FAILED', 'Lucia Core rejected the authorization-code exchange.');
  }
  let body: unknown;
  try { body = await response.json(); } catch {
    throw new LuciaIdentityApiError('TOKEN_RESPONSE_INVALID', 'Lucia Core returned an invalid token response.');
  }
  if (typeof body !== 'object' || body === null) {
    throw new LuciaIdentityApiError('TOKEN_RESPONSE_INVALID', 'Lucia Core returned an invalid token response.');
  }
  const token = body as Record<string, unknown>;
  if (
    typeof token.access_token !== 'string' ||
    token.access_token.length < 20 ||
    token.access_token.length > 16_384 ||
    typeof token.token_type !== 'string' ||
    token.token_type.toLowerCase() !== 'bearer' ||
    typeof token.expires_in !== 'number' ||
    !Number.isInteger(token.expires_in) ||
    token.expires_in < 1 ||
    token.expires_in > 300 ||
    typeof token.scope !== 'string'
  ) {
    throw new LuciaIdentityApiError('TOKEN_RESPONSE_INVALID', 'Lucia Core did not return a valid short-lived bearer credential.');
  }
  return { accessToken: token.access_token, expiresIn: token.expires_in, scope: token.scope };
}

export async function verifyLuciaIdentity(input: {
  discovery: OidcDiscovery;
  accessToken: string;
  fetcher?: typeof fetch;
}): Promise<LuciaVerifiedIdentity> {
  let response: Response;
  try {
    response = await (input.fetcher ?? fetch)(input.discovery.userinfo_endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + input.accessToken,
      },
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new LuciaIdentityApiError('IDENTITY_ENDPOINT_UNAVAILABLE', 'Lucia Core identity verification endpoint is unavailable.');
  }
  if (!response.ok) {
    throw new LuciaIdentityApiError('IDENTITY_VERIFICATION_FAILED', 'Lucia Core could not verify the authenticated identity.');
  }
  let body: unknown;
  try { body = await response.json(); } catch {
    throw new LuciaIdentityApiError('IDENTITY_RESPONSE_INVALID', 'Lucia Core returned an invalid identity response.');
  }
  if (typeof body !== 'object' || body === null) {
    throw new LuciaIdentityApiError('IDENTITY_RESPONSE_INVALID', 'Lucia Core returned an invalid identity response.');
  }
  const claims = body as Record<string, unknown>;
  if (
    typeof claims.sub !== 'string' ||
    claims.sub.trim().length === 0 ||
    claims.sub.length > 255 ||
    (claims.email !== undefined && (typeof claims.email !== 'string' || claims.email.length > 320)) ||
    (claims.email_verified !== undefined && typeof claims.email_verified !== 'boolean') ||
    (claims.name !== undefined && (typeof claims.name !== 'string' || claims.name.length > 200))
  ) {
    throw new LuciaIdentityApiError('IDENTITY_RESPONSE_INVALID', 'Lucia Core identity claims failed validation.');
  }
  return {
    subject: claims.sub,
    ...(typeof claims.email === 'string' ? { email: claims.email } : {}),
    emailVerified: claims.email_verified === true,
    ...(typeof claims.name === 'string' ? { displayName: claims.name } : {}),
  };
}
