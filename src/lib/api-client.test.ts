import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, ariovelleApi } from './api-client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Ariovelle API client', () => {
  it('requests liveness without caching or cross-origin credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          service: 'ariovelle-api',
          probe: 'live',
          requestId: 'request-1',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'request-1' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await ariovelleApi.health.live();

    expect(result.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith('/api/health/live', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
  });

  it('returns typed readiness information', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 'ready',
            service: 'ariovelle-api',
            scope: 'api-scaffold',
            capabilities: ['health'],
            dependencies: { database: 'not_configured', identityProvider: 'not_configured' },
            requestId: 'request-2',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await ariovelleApi.health.ready();
    expect(result.dependencies.database).toBe('not_configured');
    expect(result.capabilities).toEqual(['health']);
  });

  it('maps structured API errors to ApiClientError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: 'Only GET is supported.',
              requestId: 'request-3',
            },
          }),
          { status: 405, headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'request-3' } },
        ),
      ),
    );

    await expect(ariovelleApi.health.live()).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 405,
      code: 'METHOD_NOT_ALLOWED',
      requestId: 'request-3',
    });
  });

  it('does not expose fetch exceptions or response internals', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret connection detail')));

    try {
      await ariovelleApi.health.live();
      throw new Error('Expected request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiClientError);
      expect((error as Error).message).toContain('could not be reached');
      expect((error as Error).message).not.toContain('secret connection detail');
    }
  });
});
