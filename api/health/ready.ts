import {
  sendJson,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/http';

/**
 * Readiness of the currently deployed API scaffold, not the full Ariovelle
 * product. Database and identity integrations are deliberately not configured.
 */
export default function readyHandler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    return sendMethodNotAllowed(response, ['GET']);
  }

  return sendJson(response, 200, {
    status: 'ready',
    service: 'ariovelle-api',
    scope: 'api-scaffold',
    capabilities: ['health'],
    dependencies: {
      database: 'not_configured',
      identityProvider: 'not_configured',
    },
  });
}
