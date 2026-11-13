import {
  sendJson,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/http';

/**
 * Liveness probe only. It does not authenticate callers or access financial data.
 */
export default function liveHandler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    return sendMethodNotAllowed(response, ['GET']);
  }

  return sendJson(response, 200, {
    status: 'ok',
    service: 'ariovelle-api',
    probe: 'live',
  });
}
