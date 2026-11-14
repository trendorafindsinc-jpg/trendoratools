export type ApiRequest = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

export function createRequestId(): string {
  return globalThis.crypto.randomUUID();
}

function applyResponseHeaders(response: ApiResponse, requestId: string) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-Request-Id', requestId);
}

export function sendJson(
  response: ApiResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  const requestId = createRequestId();
  applyResponseHeaders(response, requestId);
  response.status(statusCode).json({ ...body, requestId });
}


export function sendError(
  response: ApiResponse,
  statusCode: number,
  code: string,
  message: string,
) {
  const requestId = createRequestId();
  applyResponseHeaders(response, requestId);
  const body: ApiErrorBody = {
    error: { code, message, requestId },
  };
  response.status(statusCode).json(body);
}

export function sendMethodNotAllowed(
  response: ApiResponse,
  allowedMethods: readonly string[],
) {
  response.setHeader('Allow', allowedMethods.join(', '));
  return sendError(
    response,
    405,
    'METHOD_NOT_ALLOWED',
    `Only ${allowedMethods.join(', ')} is supported for this endpoint.`,
  );
}
