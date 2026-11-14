-- Ariovelle migration 0006: establish transaction-local user context during Lucia identity bootstrap.
-- The identity SECURITY DEFINER function must set app.user_id before self-scoped
-- profile/preferences INSERT and existing-user UPDATE policies are evaluated.
-- This preserves RLS; it does not grant runtime direct table privileges.
BEGIN;

CREATE OR REPLACE FUNCTION app_private.establish_lucia_identity(
  p_issuer TEXT,p_subject TEXT,p_email TEXT,p_email_verified BOOLEAN,p_display_name TEXT,
  p_session_hash CHAR(64),p_expires_at TIMESTAMPTZ
) RETURNS TABLE(user_id UUID,personal_workspace_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $$
DECLARE v_user UUID; v_workspace UUID;
BEGIN
  IF length(trim(p_issuer))=0 OR length(trim(p_subject))=0 OR p_session_hash !~ '^[0-9a-f]{64}$'
     OR p_expires_at <= now() OR p_expires_at > now()+interval '31 days' THEN
    RAISE EXCEPTION 'invalid identity/session input' USING ERRCODE='22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    octet_length(p_issuer)::text || ':' || p_issuer ||
    octet_length(p_subject)::text || ':' || p_subject, 0
  ));

  SELECT ei.user_id INTO v_user FROM public.external_identities ei
   WHERE ei.provider='lucia' AND ei.issuer=p_issuer AND ei.subject=p_subject FOR UPDATE;

  IF v_user IS NULL THEN
    v_user := gen_random_uuid();
    -- This ID was generated inside the trusted database function, not supplied
    -- by the browser. Scope self-row policies to this verified new identity.
    PERFORM set_config('app.user_id', v_user::text, true);
    IF app_private.current_user_id() IS DISTINCT FROM v_user THEN
      RAISE EXCEPTION 'verified user context could not be established during identity bootstrap' USING ERRCODE='42501';
    END IF;

    INSERT INTO public.users(id,status,display_name,primary_email)
      VALUES(v_user,'active',NULLIF(trim(p_display_name),''),NULLIF(lower(trim(p_email)),''));
    INSERT INTO public.external_identities(id,user_id,provider,issuer,subject,email_snapshot,email_verified,last_authenticated_at)
      VALUES(gen_random_uuid(),v_user,'lucia',p_issuer,p_subject,NULLIF(lower(trim(p_email)),''),p_email_verified,now());
    RAISE NOTICE 'bootstrap diagnostic: current_user=%, session_user=%, app_user_id=%, helper_user_id=%, row_security=%', current_user, session_user, current_setting('app.user_id', true), app_private.current_user_id(), current_setting('row_security', true);
    INSERT INTO public.user_profiles(user_id,first_name)
      VALUES(v_user,NULLIF(trim(p_display_name),' '));
    INSERT INTO public.user_preferences(user_id) VALUES(v_user);

    v_workspace := gen_random_uuid();
    INSERT INTO public.workspaces(id,type,name,owner_user_id,status)
      VALUES(v_workspace,'personal',COALESCE(NULLIF(trim(p_display_name),''),'Personal')||' workspace',v_user,'active');
    INSERT INTO public.workspace_memberships(id,workspace_id,user_id,role,status)
      VALUES(gen_random_uuid(),v_workspace,v_user,'owner','active');
  ELSE
    -- Existing identity was resolved from the provider+issuer+subject tuple.
    PERFORM set_config('app.user_id', v_user::text, true);
    IF app_private.current_user_id() IS DISTINCT FROM v_user THEN
      RAISE EXCEPTION 'verified user context could not be established during identity refresh' USING ERRCODE='42501';
    END IF;

    SELECT w.id INTO v_workspace FROM public.workspaces w
      WHERE w.owner_user_id=v_user AND w.type='personal' AND w.status='active' LIMIT 1;
    IF v_workspace IS NULL THEN
      RAISE EXCEPTION 'personal workspace missing' USING ERRCODE='23514';
    END IF;

    UPDATE public.users
      SET primary_email=NULLIF(lower(trim(p_email)),''),display_name=COALESCE(NULLIF(trim(p_display_name),''),display_name),updated_at=now()
      WHERE id=v_user AND status='active';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'application account is inactive' USING ERRCODE='42501';
    END IF;
    UPDATE public.external_identities
      SET email_snapshot=NULLIF(lower(trim(p_email)),''),email_verified=p_email_verified,last_authenticated_at=now()
      WHERE provider='lucia' AND issuer=p_issuer AND subject=p_subject;
  END IF;

  INSERT INTO public.app_sessions(token_hash,user_id,expires_at)
    VALUES(p_session_hash,v_user,p_expires_at);
  RETURN QUERY SELECT v_user,v_workspace;
END $$;

-- Keep the trusted bootstrap routine owned by the dedicated BYPASSRLS migration role;
-- the application runtime can only EXECUTE it and never inherits this role.
ALTER FUNCTION app_private.establish_lucia_identity(TEXT,TEXT,TEXT,BOOLEAN,TEXT,CHAR,TIMESTAMPTZ)
  OWNER TO ariovelle_owner;

COMMIT;
