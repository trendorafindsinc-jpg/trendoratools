-- Ariovelle migration 0000: dedicated DDL migration ledger.
-- This is separate from migration_batches/migration_records, which track data imports.
BEGIN;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY CHECK (version ~ '^[0-9]{4}$'),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  checksum CHAR(64) NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  execution_ms BIGINT NOT NULL DEFAULT 0 CHECK (execution_ms >= 0),
  applied_by TEXT NOT NULL DEFAULT current_user
);

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schema_migrations FROM PUBLIC;

COMMIT;
