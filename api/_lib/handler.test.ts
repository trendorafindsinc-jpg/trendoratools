import { describe, expect, it } from 'vitest';
import { withApiErrorHandling } from './handler';
import type { ApiResponse } from './http';

function createResponse() {
  const state = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: undefined as unknown,
  };
  const response: ApiResponse = {
    setHeader(name, value) {
      state.headers[name] = value;
    },
    status(code) {
      state.statusCode = code;
      return response;
    },
    json(body) {
      state.body = body;
    },
  };
  return { response, state };
}

describe('withApiErrorHandling', () => {
  it('returns a safe structured error for rejected route handlers', async () => {
    const { response, state } = createResponse();
    const handler = withApiErrorHandling(async () => {
      throw new Error('private database connection detail');
    });

    await handler({ method: 'GET' }, response);

    expect(state.statusCode).toBe(500);
    expect(state.headers['Cache-Control']).toContain('no-store');
    expect(state.headers['X-Request-Id']).toBeTruthy();
    expect(state.body).toMatchObject({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The request could not be completed. Try again later.',
        requestId: state.headers['X-Request-Id'],
      },
    });
    expect(JSON.stringify(state.body)).not.toContain('private database connection detail');
  });

  it('preserves successful handler responses', async () => {
    const { response, state } = createResponse();
    const handler = withApiErrorHandling((_request, res) => {
      res.status(204).json({});
    });

    await handler({ method: 'GET' }, response);

    expect(state.statusCode).toBe(204);
    expect(state.body).toEqual({});
  });

  it('does not leak unexpected exception messages', async () => {
    const { response, state } = createResponse();
    const handler = withApiErrorHandling(() => {
      throw new Error('secret');
    });

    await handler({ method: 'POST' }, response);

    expect(JSON.stringify(state.body)).not.toContain('secret');
  });
});
