-- Ariovelle migration 0007: keep DDL migration history private from the runtime role.
-- Schema history is an operational control plane, not application data.
BEGIN;

REVOKE ALL ON TABLE public.schema_migrations FROM PUBLIC, ariovelle_runtime;

COMMIT;
