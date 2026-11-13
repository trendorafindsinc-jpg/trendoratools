import { describe, expect, it } from 'vitest';
import liveHandler from './live';
import readyHandler from './ready';
import type { ApiRequest, ApiResponse } from '../_lib/http';

function createResponse() {
  const headers = new Map<string, string | string[]>();
  const result: { statusCode?: number; body?: unknown } = {};
  const response: ApiResponse = {
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    status(code) {
      result.statusCode = code;
      return response;
    },
    json(body) {
      result.body = body;
    },
  };
  return { response, headers, result };
}

describe('Ariovelle API health endpoints', () => {
  it('returns a liveness response without initializing product dependencies', () => {
    const { response, result, headers } = createResponse();
    liveHandler({ method: 'GET' }, response);

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      status: 'ok',
      service: 'ariovelle-api',
      probe: 'live',
    });
    expect(headers.get('cache-control')).toContain('no-store');
    expect(headers.get('x-request-id')).toBeTruthy();
  });

  it('reports unconfigured dependencies explicitly on readiness', () => {
    const { response, result } = createResponse();
    readyHandler({ method: 'GET' }, response);

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      status: 'ready',
      scope: 'api-scaffold',
      capabilities: ['health'],
      dependencies: {
        database: 'not_configured',
        identityProvider: 'not_configured',
      },
    });
  });

  it('rejects unsupported methods and declares the allowed method', () => {
    const { response, result, headers } = createResponse();
    liveHandler({ method: 'POST' } as ApiRequest, response);

    expect(result.statusCode).toBe(405);
    expect(headers.get('allow')).toBe('GET');
    expect(result.body).toMatchObject({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET is supported for this endpoint.',
      },
    });
  });

  it('rejects non-GET requests to readiness', () => {
    const { response, result } = createResponse();
    readyHandler({ method: 'DELETE' }, response);

    expect(result.statusCode).toBe(405);
    expect(result.body).toMatchObject({
      error: { code: 'METHOD_NOT_ALLOWED' },
    });
  });
});
