-- Ariovelle migration 0002: verified request context and tenant RLS.
-- Apply to the disposable development database before creating the runtime role.
BEGIN;

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;

CREATE OR REPLACE FUNCTION app_private.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $function$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$function$;

CREATE OR REPLACE FUNCTION app_private.current_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $function$
  SELECT NULLIF(current_setting('app.workspace_id', true), '')::uuid
$function$;

CREATE OR REPLACE FUNCTION app_private.is_active_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT EXISTS (
    SELECT 1
      FROM public.workspace_memberships AS wm
      JOIN public.workspaces AS w ON w.id = wm.workspace_id
      JOIN public.users AS u ON u.id = wm.user_id
     WHERE wm.workspace_id = target_workspace_id
       AND wm.user_id = app_private.current_user_id()
       AND wm.status = 'active'
       AND w.status = 'active'
       AND u.status = 'active'
  )
$function$;

CREATE OR REPLACE FUNCTION app_private.is_workspace_owner(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT EXISTS (
    SELECT 1
      FROM public.workspace_memberships AS wm
      JOIN public.workspaces AS w ON w.id = wm.workspace_id
     WHERE wm.workspace_id = target_workspace_id
       AND wm.user_id = app_private.current_user_id()
       AND wm.role = 'owner'
       AND wm.status = 'active'
       AND w.status = 'active'
  )
$function$;

CREATE OR REPLACE FUNCTION app_private.is_workspace_admin(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT EXISTS (
    SELECT 1
      FROM public.workspace_memberships AS wm
      JOIN public.workspaces AS w ON w.id = wm.workspace_id
     WHERE wm.workspace_id = target_workspace_id
       AND wm.user_id = app_private.current_user_id()
       AND wm.role IN ('owner', 'admin')
       AND wm.status = 'active'
       AND w.status = 'active'
  )
$function$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;

-- Runtime execution is granted to the dedicated role after it is provisioned.
-- Do not grant schema access or helper execution to PUBLIC.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (id = app_private.current_user_id());
CREATE POLICY users_update_self ON public.users
  FOR UPDATE
  USING (id = app_private.current_user_id())
  WITH CHECK (id = app_private.current_user_id());

CREATE POLICY external_identities_select_self ON public.external_identities
  FOR SELECT USING (user_id = app_private.current_user_id());

CREATE POLICY user_profiles_select_self ON public.user_profiles
  FOR SELECT USING (user_id = app_private.current_user_id());
CREATE POLICY user_profiles_insert_self ON public.user_profiles
  FOR INSERT WITH CHECK (user_id = app_private.current_user_id());
CREATE POLICY user_profiles_update_self ON public.user_profiles
  FOR UPDATE
  USING (user_id = app_private.current_user_id())
  WITH CHECK (user_id = app_private.current_user_id());

CREATE POLICY user_preferences_select_self ON public.user_preferences
  FOR SELECT USING (user_id = app_private.current_user_id());
CREATE POLICY user_preferences_insert_self ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = app_private.current_user_id());
CREATE POLICY user_preferences_update_self ON public.user_preferences
  FOR UPDATE
  USING (user_id = app_private.current_user_id())
  WITH CHECK (user_id = app_private.current_user_id());

CREATE POLICY workspaces_select_current_member ON public.workspaces
  FOR SELECT
  USING (
    id = app_private.current_workspace_id()
    AND app_private.is_active_workspace_member(id)
  );
CREATE POLICY workspaces_update_owner ON public.workspaces
  FOR UPDATE
  USING (
    id = app_private.current_workspace_id()
    AND app_private.is_workspace_owner(id)
  )
  WITH CHECK (
    id = app_private.current_workspace_id()
    AND app_private.is_workspace_owner(id)
  );

CREATE POLICY memberships_select_self_or_current_workspace ON public.workspace_memberships
  FOR SELECT
  USING (
    user_id = app_private.current_user_id()
    OR (
      workspace_id = app_private.current_workspace_id()
      AND app_private.is_active_workspace_member(workspace_id)
    )
  );
CREATE POLICY memberships_insert_manager ON public.workspace_memberships
  FOR INSERT
  WITH CHECK (
    workspace_id = app_private.current_workspace_id()
    AND (
      app_private.is_workspace_owner(workspace_id)
      OR (
        app_private.is_workspace_admin(workspace_id)
        AND role IN ('member', 'viewer')
      )
    )
  );
CREATE POLICY memberships_update_manager ON public.workspace_memberships
  FOR UPDATE
  USING (
    workspace_id = app_private.current_workspace_id()
    AND (
      app_private.is_workspace_owner(workspace_id)
      OR (
        app_private.is_workspace_admin(workspace_id)
        AND role IN ('member', 'viewer')
      )
    )
  )
  WITH CHECK (
    workspace_id = app_private.current_workspace_id()
    AND (
      app_private.is_workspace_owner(workspace_id)
      OR (
        app_private.is_workspace_admin(workspace_id)
        AND role IN ('member', 'viewer')
      )
    )
  );
CREATE POLICY memberships_delete_manager ON public.workspace_memberships
  FOR DELETE
  USING (
    workspace_id = app_private.current_workspace_id()
    AND (
      app_private.is_workspace_owner(workspace_id)
      OR (
        app_private.is_workspace_admin(workspace_id)
        AND role IN ('member', 'viewer')
      )
    )
  );

CREATE POLICY audit_events_select_current_workspace ON public.audit_events
  FOR SELECT
  USING (
    actor_user_id = app_private.current_user_id()
    OR (
      workspace_id = app_private.current_workspace_id()
      AND app_private.is_active_workspace_member(workspace_id)
    )
  );
CREATE POLICY audit_events_insert_actor ON public.audit_events
  FOR INSERT
  WITH CHECK (
    actor_user_id = app_private.current_user_id()
    AND workspace_id = app_private.current_workspace_id()
    AND app_private.is_active_workspace_member(workspace_id)
  );

-- No runtime policies for migration metadata: default deny, reserved to the owner.
COMMIT;
