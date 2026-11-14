import { meResponseSchema } from '../_lib/contracts.js';
import { hashSessionToken } from '../_lib/lucia-session.js';
import { setVerifiedRequestContext, WorkspaceContextError } from '../_lib/request-context.js';
import type { VerifiedInternalUserId } from '../_lib/workspace-access.js';
import { createRuntimePostgres } from '../_lib/postgres-pool.js';
import { luciaCookieNames, parseCookies } from '../_lib/lucia-oauth.js';
import { sendError, sendJson, sendMethodNotAllowed, type ApiRequest, type ApiResponse } from '../_lib/http.js';

function header(request: ApiRequest, name: string): string | undefined {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export default async function getCurrentAriovelleSession(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') return sendMethodNotAllowed(response, ['GET']);
  if (process.env.LUCIA_AUTH_ENABLED !== 'true') {
    return sendError(response, 401, 'AUTH_DISABLED', 'No authenticated Ariovelle session is available.');
  }

  const token = parseCookies(header(request, 'cookie'))[luciaCookieNames.session];
  if (!token || token.length > 256) {
    return sendError(response, 401, 'AUTHENTICATION_REQUIRED', 'Sign in with Lucia to continue.');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return sendError(response, 503, 'SESSION_STORE_UNAVAILABLE', 'Ariovelle session storage is not configured.');
  }

  let runtime: ReturnType<typeof createRuntimePostgres> | undefined;
  try {
    runtime = createRuntimePostgres(databaseUrl);
    const session = await runtime.database.transaction(async (transaction) => {
      const resolved = await transaction.query<{ user_id: string | null }>(
        'SELECT app_private.resolve_ariovelle_session($1, now()) AS user_id',
        [hashSessionToken(token)],
      );
      const userId = resolved.rows[0]?.user_id;
      if (!userId) return null;

      // Only the server-verified session result may establish the RLS identity.
      await transaction.query("SELECT set_config('app.user_id', $1, true)", [userId]);
      const users = await transaction.query<{
        id: string;
        primary_email: string | null;
        display_name: string | null;
        created_at: Date | string;
      }>(
        'SELECT id, primary_email, display_name, created_at FROM public.users WHERE id = $1 AND status = $2 LIMIT 1',
        [userId, 'active'],
      );
      const user = users.rows[0];
      if (!user) return null;

      // RLS permits a user to enumerate only their own active memberships.
      const memberships = await transaction.query<{
        workspace_id: string;
        role: 'owner' | 'admin' | 'member' | 'viewer';
      }>(
        "SELECT workspace_id, role FROM public.workspace_memberships WHERE user_id = $1 AND status = 'active' ORDER BY created_at ASC",
        [userId],
      );

      for (const membership of memberships.rows) {
        try {
          await setVerifiedRequestContext(transaction, userId as VerifiedInternalUserId, membership.workspace_id);
        } catch (error) {
          if (error instanceof WorkspaceContextError) continue;
          throw error;
        }
        const workspaces = await transaction.query<{
          id: string;
          name: string;
          type: 'personal' | 'business';
        }>(
          "SELECT id, name, type FROM public.workspaces WHERE id = $1 AND status = 'active' LIMIT 1",
          [membership.workspace_id],
        );
        const workspace = workspaces.rows[0];
        if (!workspace) continue;

        return {
          user: {
            id: user.id,
            email: user.primary_email,
            displayName: user.display_name,
            createdAt: new Date(user.created_at).toISOString(),
          },
          workspace: {
            id: workspace.id,
            name: workspace.name,
            type: workspace.type,
            role: membership.role,
          },
        };
      }

      return null;
    });

    if (!session) {
      return sendError(response, 401, 'AUTHENTICATION_REQUIRED', 'Your Ariovelle session is no longer active. Please sign in again.');
    }
    const validated = meResponseSchema.parse(session);
    return sendJson(response, 200, validated);
  } catch {
    return sendError(response, 503, 'SESSION_LOOKUP_FAILED', 'Ariovelle could not verify your session. Please try again.');
  } finally {
    await runtime?.pool.end();
  }
}
