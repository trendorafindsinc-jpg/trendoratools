-- Ariovelle migration 0005: one-time server-side Lucia OAuth transactions.
-- Apply only to the disposable Ariovelle development database as ariovelle_owner.
BEGIN;
CREATE TABLE public.oauth_transactions (
  state_hash CHAR(64) PRIMARY KEY CHECK (state_hash ~ '^[0-9a-f]{64}$'),
  browser_binding_hash CHAR(64) NOT NULL CHECK (browser_binding_hash ~ '^[0-9a-f]{64}$'),
  transaction_data TEXT NOT NULL CHECK (length(transaction_data) <= 4096),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX oauth_transactions_expiry_idx ON public.oauth_transactions(expires_at);
ALTER TABLE public.oauth_transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION app_private.create_lucia_oauth_transaction(
  p_state_hash CHAR(64),
  p_browser_binding_hash CHAR(64),
  p_transaction_data TEXT,
  p_expires_at TIMESTAMPTZ
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_state_hash !~ '^[0-9a-f]{64}$'
     OR p_browser_binding_hash !~ '^[0-9a-f]{64}$'
     OR length(p_transaction_data) = 0
     OR length(p_transaction_data) > 4096
     OR p_expires_at <= now()
     OR p_expires_at > now() + interval '10 minutes' THEN
    RAISE EXCEPTION 'invalid OAuth transaction input' USING ERRCODE='22023';
  END IF;
  DELETE FROM public.oauth_transactions WHERE expires_at < now() - interval '1 day';
  INSERT INTO public.oauth_transactions(state_hash,browser_binding_hash,transaction_data,expires_at)
    VALUES(p_state_hash,p_browser_binding_hash,p_transaction_data,p_expires_at);
  RETURN TRUE;
END $$;

CREATE OR REPLACE FUNCTION app_private.consume_lucia_oauth_transaction(
  p_state_hash CHAR(64),
  p_browser_binding_hash CHAR(64),
  p_now TIMESTAMPTZ DEFAULT now()
) RETURNS TABLE(transaction_data TEXT)
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.oauth_transactions
     SET consumed_at = p_now
   WHERE state_hash = p_state_hash
     AND browser_binding_hash = p_browser_binding_hash
     AND consumed_at IS NULL
     AND expires_at > p_now
  RETURNING oauth_transactions.transaction_data
$$;

REVOKE ALL ON public.oauth_transactions FROM PUBLIC, ariovelle_runtime;
REVOKE ALL ON FUNCTION app_private.create_lucia_oauth_transaction(CHAR,CHAR,TEXT,TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.consume_lucia_oauth_transaction(CHAR,CHAR,TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.create_lucia_oauth_transaction(CHAR,CHAR,TEXT,TIMESTAMPTZ) TO ariovelle_runtime;
GRANT EXECUTE ON FUNCTION app_private.consume_lucia_oauth_transaction(CHAR,CHAR,TIMESTAMPTZ) TO ariovelle_runtime;
COMMIT;
