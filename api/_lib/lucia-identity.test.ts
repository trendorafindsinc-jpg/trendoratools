import { describe, expect, it, vi } from 'vitest';
import { readLuciaConfig, type OidcDiscovery } from './lucia-oauth';
import {
  exchangeLuciaAuthorizationCode,
  verifyLuciaIdentity,
} from './lucia-identity';

const config = readLuciaConfig({
  NODE_ENV: 'test',
  LUCIA_AUTH_ENABLED: 'true',
  LUCIA_ISSUER: 'https://identity.example.test',
  LUCIA_CLIENT_ID: 'ariovelle-client',
  LUCIA_CLIENT_SECRET: 'c'.repeat(40),
  LUCIA_AUDIENCE: 'ariovelle',
  LUCIA_REDIRECT_URI: 'https://ariovelle.example.test/api/auth/lucia/callback',
  ARIOVELLE_SESSION_SECRET: 's'.repeat(48),
});
const discovery: OidcDiscovery = {
  issuer: config.issuer,
  authorization_endpoint: config.issuer + '/api/v1/consumer/oauth/authorize',
  token_endpoint: config.issuer + '/api/v1/consumer/oauth/token',
  userinfo_endpoint: config.issuer + '/api/v1/oidc/userinfo',
  jwks_uri: config.issuer + '/.well-known/jwks.json',
  response_types_supported: ['code'],
  id_token_signing_alg_values_supported: ['RS256'],
  code_challenge_methods_supported: ['S256'],
};

describe('Lucia identity verification API adapter', () => {
  it('exchanges a one-time code with confidential Basic auth and PKCE', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>).Authorization).toBe(
        'Basic ' + Buffer.from(config.clientId + ':' + config.clientSecret).toString('base64'),
      );
      const form = new URLSearchParams(String(init?.body));
      expect(form.get('grant_type')).toBe('authorization_code');
      expect(form.get('code')).toBe('single-use-code');
      expect(form.get('redirect_uri')).toBe(config.redirectUri);
      expect(form.get('audience')).toBe(config.audience);
      expect(form.get('code_verifier')).toBe('v'.repeat(43));
      return new Response(JSON.stringify({
        access_token: 'opaque-core-bearer-token-123456789',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'profile email',
      }), { status: 200 });
    }) as unknown as typeof fetch;

    await expect(exchangeLuciaAuthorizationCode({
      config, discovery, code: 'single-use-code', verifier: 'v'.repeat(43), fetcher,
    })).resolves.toEqual({
      accessToken: 'opaque-core-bearer-token-123456789',
      expiresIn: 300,
      scope: 'profile email',
    });
  });

  it('does not require or consume an OIDC ID token in the token response', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      access_token: 'opaque-core-bearer-token-123456789',
      token_type: 'Bearer',
      expires_in: 300,
      scope: 'profile email',
    }), { status: 200 })) as unknown as typeof fetch;
    await expect(exchangeLuciaAuthorizationCode({
      config, discovery, code: 'single-use-code', verifier: 'v'.repeat(43), fetcher,
    })).resolves.toMatchObject({ scope: 'profile email' });
  });

  it('rejects malformed, non-bearer or excessively long-lived credentials', async () => {
    for (const payload of [
      { access_token: 'short', token_type: 'Bearer', expires_in: 300, scope: 'profile email' },
      { access_token: 'a'.repeat(20), token_type: 'Basic', expires_in: 300, scope: 'profile email' },
      { access_token: 'a'.repeat(20), token_type: 'Bearer', expires_in: 301, scope: 'profile email' },
    ]) {
      const fetcher = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })) as unknown as typeof fetch;
      await expect(exchangeLuciaAuthorizationCode({
        config, discovery, code: 'single-use-code', verifier: 'v'.repeat(43), fetcher,
      })).rejects.toMatchObject({ code: 'TOKEN_RESPONSE_INVALID' });
    }
  });

  it('obtains the stable subject only from Core verified UserInfo', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe('GET');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer opaque-token');
      return new Response(JSON.stringify({
        sub: 'stable-lucia-oidc-subject',
        email: 'person@example.test',
        email_verified: true,
        name: 'Test Person',
      }), { status: 200 });
    }) as unknown as typeof fetch;

    await expect(verifyLuciaIdentity({
      discovery, accessToken: 'opaque-token', fetcher,
    })).resolves.toEqual({
      subject: 'stable-lucia-oidc-subject',
      email: 'person@example.test',
      emailVerified: true,
      displayName: 'Test Person',
    });
  });

  it('rejects missing subject and invalid optional identity claims', async () => {
    for (const payload of [
      { email: 'person@example.test' },
      { sub: 'subject', email_verified: 'yes' },
      { sub: 'subject', name: 123 },
    ]) {
      const fetcher = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })) as unknown as typeof fetch;
      await expect(verifyLuciaIdentity({
        discovery, accessToken: 'opaque-token', fetcher,
      })).rejects.toMatchObject({ code: 'IDENTITY_RESPONSE_INVALID' });
    }
  });

  it('fails closed when Core rejects the bearer or is unavailable', async () => {
    const denied = vi.fn(async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
    await expect(verifyLuciaIdentity({
      discovery, accessToken: 'opaque-token', fetcher: denied,
    })).rejects.toMatchObject({ code: 'IDENTITY_VERIFICATION_FAILED' });
    const unavailable = vi.fn(async () => { throw new Error('network detail'); }) as unknown as typeof fetch;
    await expect(verifyLuciaIdentity({
      discovery, accessToken: 'opaque-token', fetcher: unavailable,
    })).rejects.toMatchObject({ code: 'IDENTITY_ENDPOINT_UNAVAILABLE' });
  });
});
