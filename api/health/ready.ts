import { readyHealthResponseSchema } from '../_lib/contracts';
import { createApiHandler } from '../_lib/route';
import { isIdentityProviderConfigured } from '../_lib/health-config';

/**
 * Reports API scaffold readiness and configuration presence only.
 * Dependency connectivity is deliberately not probed by this health route.
 */
const readyHandler = createApiHandler({
  methods: ['GET'],
  responseSchema: readyHealthResponseSchema,
  handler: () => ({
    status: 200,
    body: {
      status: 'ready',
      service: 'ariovelle-api',
      scope: 'api-scaffold',
      capabilities: ['health'],
      dependencies: {
        database: {
          configuration: process.env.DATABASE_URL?.trim() ? 'configured' : 'not_configured',
          connectivity: 'not_checked',
        },
        identityProvider: {
          configuration: isIdentityProviderConfigured(process.env) ? 'configured' : 'not_configured',
          connectivity: 'not_checked',
        },
      },
    },
  }),
});

export default readyHandler;
