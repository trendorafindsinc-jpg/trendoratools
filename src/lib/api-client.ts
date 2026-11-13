export type ApiHealthLive = {
  status: 'ok';
  service: 'ariovelle-api';
  probe: 'live';
  requestId: string;
};

export type ApiHealthReady = {
  status: 'ready';
  service: 'ariovelle-api';
  scope: 'api-scaffold';
  capabilities: string[];
  dependencies: {
    database: 'not_configured' | 'connected' | 'unavailable';
    identityProvider: 'not_configured' | 'configured';
  };
  requestId: string;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    requestId?: string | null;
  }) {
    super(input.message);
    this.name = 'ApiClientError';
    this.status = input.status;
    this.code = input.code;
    this.requestId = input.requestId ?? null;
  }
}

async function getJson<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiClientError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'The Ariovelle service could not be reached. Check your connection and try again.',
    });
  }

  const requestId = response.headers.get('X-Request-Id');
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError({
      status: response.status,
      code: 'INVALID_RESPONSE',
      message: 'The Ariovelle service returned an unreadable response.',
      requestId,
    });
  }

  if (!response.ok) {
    const errorPayload = payload as Partial<ApiErrorPayload>;
    throw new ApiClientError({
      status: response.status,
      code: errorPayload?.error?.code ?? 'REQUEST_FAILED',
      message: errorPayload?.error?.message ?? 'The request could not be completed.',
      requestId: errorPayload?.error?.requestId ?? requestId,
    });
  }

  return payload as T;
}

/** Health-only client. No authentication or financial endpoints are exposed here. */
export const ariovelleApi = {
  health: {
    live: () => getJson<ApiHealthLive>('/api/health/live'),
    ready: () => getJson<ApiHealthReady>('/api/health/ready'),
  },
};
