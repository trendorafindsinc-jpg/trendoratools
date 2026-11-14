import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import liveHandler from './live';
import readyHandler from './ready';
import { createApiHandler } from '../_lib/route';
import {
  liveHealthResponseSchema,
  meResponseSchema,
  readyHealthResponseSchema,
  workspaceDtoSchema,
} from '../_lib/contracts';
import type { ApiResponse } from '../_lib/http';

function createResponse() {
  const headers = new Map<string, string | string[]>();
  const result: { statusCode?: number; body?: unknown } = {};
  const response: ApiResponse = {
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
    status(code) { result.statusCode = code; return response; },
    json(body) { result.body = body; },
  };
  return { response, headers, result };
}

function expectSecurityHeaders(headers: Map<string, string | string[]>, body: any) {
  const requestId = headers.get('x-request-id');
  expect(requestId).toEqual(expect.any(String));
  expect(body.requestId ?? body.error?.requestId).toBe(requestId);
  expect(headers.get('cache-control')).toBe('no-store, max-age=0');
  expect(headers.get('pragma')).toBe('no-cache');
  expect(headers.get('x-content-type-options')).toBe('nosniff');
  expect(headers.get('referrer-policy')).toBe('no-referrer');
  expect(headers.get('x-frame-options')).toBe('DENY');
  expect(headers.get('permissions-policy')).toContain('geolocation=()');
}

describe('Ariovelle API health endpoints', () => {
  it('returns a validated liveness response with request and security headers', async () => {
    const { response, result, headers } = createResponse();
    await liveHandler({ method: 'GET' }, response);
    expect(result.statusCode).toBe(200);
    expect(liveHealthResponseSchema.parse(result.body)).toMatchObject({
      status: 'ok', service: 'ariovelle-api', probe: 'live',
    });
    expectSecurityHeaders(headers, result.body);
  });

  it('reports configured state separately from unverified connectivity', async () => {
    const { response, result, headers } = createResponse();
    await readyHandler({ method: 'GET' }, response);
    expect(result.statusCode).toBe(200);
    expect(readyHealthResponseSchema.parse(result.body)).toMatchObject({
      status: 'ready',
      scope: 'api-scaffold',
      capabilities: ['health'],
      dependencies: {
        database: { connectivity: 'not_checked' },
        identityProvider: { connectivity: 'not_checked' },
      },
    });
    expectSecurityHeaders(headers, result.body);
  });

  it('returns 405, Allow and the standard error envelope for unsupported methods', async () => {
    const { response, result, headers } = createResponse();
    await liveHandler({ method: 'POST' }, response);
    expect(result.statusCode).toBe(405);
    expect(headers.get('allow')).toBe('GET');
    expect(result.body).toMatchObject({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is supported for this endpoint.' },
    });
    expectSecurityHeaders(headers, result.body);
  });

  it('rejects malformed request bodies without echoing input', async () => {
    const handler = createApiHandler({
      methods: ['POST'],
      requestSchema: z.object({ label: z.string().min(1) }).strict(),
      responseSchema: z.object({ accepted: z.literal(true), requestId: z.string().uuid() }).strict(),
      handler: (_request, body) => ({ status: 200, body: { accepted: body?.label === 'safe' } }),
    });
    const { response, result, headers } = createResponse();
    await handler({ method: 'POST', body: { label: 'SECRET-INPUT', extra: true } }, response);
    expect(result.statusCode).toBe(400);
    expect(JSON.stringify(result.body)).not.toContain('SECRET-INPUT');
    expect(JSON.stringify(result.body)).not.toContain('extra');
    expectSecurityHeaders(headers, result.body);
  });

  it('maps thrown exceptions and response-schema failures to a generic 500', async () => {
    const failing = createApiHandler({
      methods: ['GET'],
      responseSchema: z.object({ ok: z.literal(true), requestId: z.string().uuid() }).strict(),
      handler: () => { throw new Error('postgres://user:password@host/private SQL stack'); },
    });
    const { response, result, headers } = createResponse();
    await failing({ method: 'GET' }, response);
    expect(result.statusCode).toBe(500);
    expect(result.body).toMatchObject({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' },
    });
    expect(JSON.stringify(result.body)).not.toContain('password');
    expect(JSON.stringify(result.body)).not.toContain('SQL');
    expectSecurityHeaders(headers, result.body);

    const invalidResponse = createApiHandler({
      methods: ['GET'],
      responseSchema: z.object({ ok: z.literal(true), requestId: z.string().uuid() }).strict(),
      handler: () => ({ status: 200, body: { ok: false } }),
    });
    const invalid = createResponse();
    await invalidResponse({ method: 'GET' }, invalid.response);
    expect(invalid.result.statusCode).toBe(500);
    expect(invalid.result.body).toMatchObject({ error: { code: 'INTERNAL_ERROR' } });
    expectSecurityHeaders(invalid.headers, invalid.result.body);
  });

  it('validates future /me and workspace DTOs strictly', () => {
    expect(meResponseSchema.safeParse({
      user: { id: 'not-a-uuid', email: null, displayName: null, createdAt: 'bad' },
    }).success).toBe(false);
    expect(workspaceDtoSchema.safeParse({
      id: 'not-a-uuid', name: 'Workspace', type: 'personal', role: 'owner', extra: 'blocked',
    }).success).toBe(false);
  });
});
