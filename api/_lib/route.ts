import { z } from 'zod';
import { apiErrorSchema } from './contracts';
import type { ApiRequest, ApiResponse } from './http';

type RouteResult = { status: number; body: unknown };
type RouteHandler<TBody> = (request: ApiRequest, body: TBody | undefined) => RouteResult | Promise<RouteResult>;

type RouteOptions<TBody> = {
  methods: readonly string[];
  responseSchema: z.ZodTypeAny;
  requestSchema?: z.ZodType<TBody>;
  handler: RouteHandler<TBody>;
};

function applyHeaders(response: ApiResponse, requestId: string): void {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('X-Request-Id', requestId);
}

function send(response: ApiResponse, status: number, body: unknown, requestId: string): void {
  applyHeaders(response, requestId);
  response.status(status).json(body);
}

function sendSafeError(
  response: ApiResponse,
  status: number,
  code: string,
  message: string,
  requestId: string,
): void {
  const body = apiErrorSchema.parse({ error: { code, message, requestId } });
  send(response, status, body, requestId);
}

/**
 * Shared Vercel Node function boundary. Request IDs are generated server-side;
 * errors and schema failures never serialize exception details or input values.
 */
export function createApiHandler<TBody = never>(options: RouteOptions<TBody>) {
  const allowedMethods = options.methods.map((method) => method.toUpperCase());

  return async function apiHandler(request: ApiRequest, response: ApiResponse): Promise<void> {
    const requestId = globalThis.crypto.randomUUID();
    const method = (request.method ?? '').toUpperCase();

    if (!allowedMethods.includes(method)) {
      response.setHeader('Allow', allowedMethods.join(', '));
      sendSafeError(
        response,
        405,
        'METHOD_NOT_ALLOWED',
        `Only ${allowedMethods.join(', ')} is supported for this endpoint.`,
        requestId,
      );
      return;
    }

    let parsedBody: TBody | undefined;
    if (options.requestSchema) {
      const parsed = options.requestSchema.safeParse(request.body);
      if (!parsed.success) {
        sendSafeError(response, 400, 'INVALID_REQUEST', 'Request body is invalid.', requestId);
        return;
      }
      parsedBody = parsed.data;
    }

    try {
      const result = await options.handler(request, parsedBody);
      const payload = { ...(result.body as Record<string, unknown>), requestId };
      const validated = options.responseSchema.parse(payload);
      send(response, result.status, validated, requestId);
    } catch {
      sendSafeError(
        response,
        500,
        'INTERNAL_ERROR',
        'An unexpected server error occurred.',
        requestId,
      );
    }
  };
}
