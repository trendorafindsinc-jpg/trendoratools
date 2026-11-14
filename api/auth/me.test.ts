import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  transaction: vi.fn(),
  end: vi.fn(),
  createRuntimePostgres: vi.fn(),
}));

vi.mock('../_lib/postgres-pool', () => ({
  createRuntimePostgres: mocks.createRuntimePostgres,
}));

import getCurrentAriovelleSession from './me';
import { luciaCookieNames } from '../_lib/lucia-oauth';

function responseMock() {
  const response = {
    headers: new Map<string, string | string[]>(),
    statusCode: 200,
    body: undefined as unknown,
    setHeader(name: string, value: string | string[]) {
      this.headers.set(name, value);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
    },
  };
  return response;
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LUCIA_AUTH_ENABLED = 'true';
    process.env.DATABASE_URL = 'postgres://runtime:secret@localhost:5432/ariovelle';
    mocks.transaction.mockImplementation(async (work: (tx: { query: typeof mocks.query }) => Promise<unknown>) => work({ query: mocks.query }));
    mocks.createRuntimePostgres.mockReturnValue({
      database: { transaction: mocks.transaction },
      pool: { end: mocks.end },
    });
  });

  it('rejects unsupported methods and missing session cookies before connecting', async () => {
    const methodResponse = responseMock();
    await getCurrentAriovelleSession({ method: 'POST' }, methodResponse);
    expect(methodResponse.statusCode).toBe(405);
    expect(methodResponse.headers.get('Allow')).toBe('GET');

    const missingCookieResponse = responseMock();
    await getCurrentAriovelleSession({ method: 'GET', headers: {} }, missingCookieResponse);
    expect(missingCookieResponse.statusCode).toBe(401);
    expect(mocks.createRuntimePostgres).not.toHaveBeenCalled();
  });

  it('returns only the session user and an active workspace under transaction-local RLS context', async () => {
    const userId = '8d3c6a40-7f7e-4b82-8c5b-0c6e5a8d8a11';
    const workspaceId = 'a42d67f2-1b39-47b2-9e4e-6d4a9e42e9f0';
    mocks.query.mockImplementation(async (sql: string) => {
      if (sql.includes('resolve_ariovelle_session')) return { rows: [{ user_id: userId }], rowCount: 1 };
      if (sql.includes('FROM public.users')) return { rows: [{
        id: userId,
        primary_email: 'person@example.test',
        display_name: 'Test Person',
        created_at: new Date('2026-11-14T12:00:00.000Z'),
      }], rowCount: 1 };
      if (sql.includes('FROM public.workspace_memberships')) return { rows: [{ workspace_id: workspaceId, role: 'owner' }], rowCount: 1 };
      if (sql.includes('FROM public.workspaces')) return { rows: [{ id: workspaceId, name: 'Test workspace', type: 'personal' }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    });

    const response = responseMock();
    await getCurrentAriovelleSession({
      method: 'GET',
      headers: { cookie: `${luciaCookieNames.session}=opaque-session-token` },
    }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      user: {
        id: userId,
        email: 'person@example.test',
        displayName: 'Test Person',
        createdAt: '2026-11-14T12:00:00.000Z',
      },
      workspace: {
        id: workspaceId,
        name: 'Test workspace',
        type: 'personal',
        role: 'owner',
      },
    });
    const statements = mocks.query.mock.calls.map(([sql]) => sql);
    expect(statements.findIndex(sql => sql.includes("set_config('app.user_id'"))).toBeLessThan(
      statements.findIndex(sql => sql.includes('FROM public.users')),
    );
    expect(statements.findIndex(sql => sql.includes("set_config('app.workspace_id'"))).toBeLessThan(
      statements.findIndex(sql => sql.includes('FROM public.workspaces')),
    );
    expect(mocks.end).toHaveBeenCalledTimes(1);
  });

  it('rejects revoked or expired sessions without reading user data', async () => {
    mocks.query.mockResolvedValue({ rows: [{ user_id: null }], rowCount: 1 });
    const response = responseMock();
    await getCurrentAriovelleSession({
      method: 'GET',
      headers: { cookie: `${luciaCookieNames.session}=opaque-session-token` },
    }, response);
    expect(response.statusCode).toBe(401);
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(mocks.end).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the session store cannot be reached', async () => {
    mocks.transaction.mockRejectedValue(new Error('private database detail'));
    const response = responseMock();
    await getCurrentAriovelleSession({
      method: 'GET',
      headers: { cookie: `${luciaCookieNames.session}=opaque-session-token` },
    }, response);
    expect(response.statusCode).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain('private database detail');
    expect(mocks.end).toHaveBeenCalledTimes(1);
  });
});
