import {
  sendError,
  type ApiRequest,
  type ApiResponse,
} from './http';

export type ApiHandler = (
  request: ApiRequest,
  response: ApiResponse,
) => void | Promise<void>;

/**
 * Converts unexpected route exceptions into a safe, correlated API error.
 * Route code must still validate input and handle expected domain errors.
 */
export function withApiErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request, response) => {
    try {
      await handler(request, response);
    } catch {
      sendError(
        response,
        500,
        'INTERNAL_ERROR',
        'The request could not be completed. Try again later.',
      );
    }
  };
}
