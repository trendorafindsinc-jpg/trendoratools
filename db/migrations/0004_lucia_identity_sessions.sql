-- Ariovelle migration 0004: Lucia identity bootstrap and revocable local sessions.
-- Apply ONLY to the disposable development database as ariovelle_owner.
-- Runtime receives EXECUTE on narrow functions, never direct bootstrap/session table writes.
BEGIN;
CREATE TABLE public.app_sessions (
  token_hash CHAR(64) PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX app_sessions_user_expiry_idx ON public.app_sessions(user_id, expires_at);
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

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
  -- Length-prefix both components; PostgreSQL text cannot contain chr(0).
  PERFORM pg_advisory_xact_lock(hashtextextended(
    octet_length(p_issuer)::text || ':' || p_issuer ||
    octet_length(p_subject)::text || ':' || p_subject, 0
  ));
  SELECT ei.user_id INTO v_user FROM public.external_identities ei
   WHERE ei.provider='lucia' AND ei.issuer=p_issuer AND ei.subject=p_subject FOR UPDATE;
  IF v_user IS NULL THEN
    v_user := gen_random_uuid();
    INSERT INTO public.users(id,status,display_name,primary_email) VALUES(v_user,'active',NULLIF(trim(p_display_name),''),NULLIF(lower(trim(p_email)),''));
    INSERT INTO public.external_identities(id,user_id,provider,issuer,subject,email_snapshot,email_verified,last_authenticated_at)
      VALUES(gen_random_uuid(),v_user,'lucia',p_issuer,p_subject,NULLIF(lower(trim(p_email)),''),p_email_verified,now());
    INSERT INTO public.user_profiles(user_id,first_name) VALUES(v_user,NULLIF(trim(p_display_name),''));
    INSERT INTO public.user_preferences(user_id) VALUES(v_user);
    v_workspace := gen_random_uuid();
    INSERT INTO public.workspaces(id,type,name,owner_user_id,status)
      VALUES(v_workspace,'personal',COALESCE(NULLIF(trim(p_display_name),''),'Personal')||' workspace',v_user,'active');
    INSERT INTO public.workspace_memberships(id,workspace_id,user_id,role,status)
      VALUES(gen_random_uuid(),v_workspace,v_user,'owner','active');
  ELSE
    SELECT w.id INTO v_workspace FROM public.workspaces w
      WHERE w.owner_user_id=v_user AND w.type='personal' AND w.status='active' LIMIT 1;
    IF v_workspace IS NULL THEN RAISE EXCEPTION 'personal workspace missing' USING ERRCODE='23514'; END IF;
    UPDATE public.users SET primary_email=NULLIF(lower(trim(p_email)),''),display_name=COALESCE(NULLIF(trim(p_display_name),''),display_name),updated_at=now()
      WHERE id=v_user AND status='active';
    IF NOT FOUND THEN RAISE EXCEPTION 'application account is inactive' USING ERRCODE='42501'; END IF;
    UPDATE public.external_identities SET email_snapshot=NULLIF(lower(trim(p_email)),''),email_verified=p_email_verified,last_authenticated_at=now()
      WHERE provider='lucia' AND issuer=p_issuer AND subject=p_subject;
  END IF;
  INSERT INTO public.app_sessions(token_hash,user_id,expires_at) VALUES(p_session_hash,v_user,p_expires_at);
  RETURN QUERY SELECT v_user,v_workspace;
END $$;

CREATE OR REPLACE FUNCTION app_private.resolve_ariovelle_session(p_hash CHAR(64),p_now TIMESTAMPTZ DEFAULT now())
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
 SELECT s.user_id FROM public.app_sessions s JOIN public.users u ON u.id=s.user_id
 WHERE s.token_hash=p_hash AND s.revoked_at IS NULL AND s.expires_at>p_now AND u.status='active'
 LIMIT 1
$$;

CREATE OR REPLACE FUNCTION app_private.revoke_ariovelle_session(p_hash CHAR(64))
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
 UPDATE public.app_sessions SET revoked_at=now() WHERE token_hash=p_hash AND revoked_at IS NULL;
 RETURN FOUND;
END $$;

REVOKE ALL ON public.app_sessions FROM PUBLIC, ariovelle_runtime;
REVOKE ALL ON FUNCTION app_private.establish_lucia_identity(TEXT,TEXT,TEXT,BOOLEAN,TEXT,CHAR,TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.resolve_ariovelle_session(CHAR,TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.revoke_ariovelle_session(CHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.establish_lucia_identity(TEXT,TEXT,TEXT,BOOLEAN,TEXT,CHAR,TIMESTAMPTZ) TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.resolve_ariovelle_session(CHAR,TIMESTAMPTZ) TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.revoke_ariovelle_session(CHAR) TO ariovelle_runtime;
COMMIT;
