-- Ariovelle migration 0003: narrow runtime grants.
-- Precondition: Neon has created ariovelle_runtime as a read_only role scoped
-- to database ariovelle_dev and schemas public, app_private. Do not use access=admin.
-- This migration deliberately grants no permissions on future financial tables.
BEGIN;

GRANT USAGE ON SCHEMA app_private TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.current_user_id() TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.current_workspace_id() TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.is_active_workspace_member(UUID) TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.is_workspace_owner(UUID) TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.is_workspace_admin(UUID) TO ariovelle_runtime;

REVOKE ALL ON TABLE public.migration_batches, public.migration_records
  FROM ariovelle_runtime;

-- Future public tables receive no automatic SELECT grant to the runtime role.
-- Every new tenant table must explicitly enable RLS and receive reviewed grants.
ALTER DEFAULT PRIVILEGES FOR ROLE ariovelle_owner IN SCHEMA public
  REVOKE SELECT ON TABLES FROM ariovelle_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE ariovelle_owner IN SCHEMA app_private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Only the profile/preferences/workspace membership and audit operations needed
-- by the future server are granted. RLS remains the row-level authorization gate.
GRANT INSERT, UPDATE ON TABLE public.user_profiles, public.user_preferences
  TO ariovelle_runtime;
GRANT UPDATE ON TABLE public.workspaces TO ariovelle_runtime;
GRANT INSERT, UPDATE, DELETE ON TABLE public.workspace_memberships
  TO ariovelle_runtime;
GRANT INSERT ON TABLE public.audit_events TO ariovelle_runtime;

ALTER ROLE ariovelle_runtime SET statement_timeout = '10s';
ALTER ROLE ariovelle_runtime SET lock_timeout = '2s';
ALTER ROLE ariovelle_runtime SET idle_in_transaction_session_timeout = '15s';

COMMIT;
