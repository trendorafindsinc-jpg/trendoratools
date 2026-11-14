import { liveHealthResponseSchema } from '../_lib/contracts.js';
import { createApiHandler } from '../_lib/route.js';

/** Liveness probe only; it does not authenticate callers or access product data. */
const liveHandler = createApiHandler({
  methods: ['GET'],
  responseSchema: liveHealthResponseSchema,
  handler: () => ({
    status: 200,
    body: { status: 'ok', service: 'ariovelle-api', probe: 'live' },
  }),
});

export default liveHandler;
