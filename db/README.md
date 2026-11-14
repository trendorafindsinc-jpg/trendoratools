# Ariovelle database migrations

The checked-in SQL in `db/migrations/` is the canonical schema history. The DDL ledger created by `0000_schema_migrations.sql` is deliberately separate from `public.migration_batches` and `public.migration_records`, which are reserved for future data-import provenance.

## Connection boundary

The runner reads **only** `ARIOVELLE_MIGRATION_DATABASE_URL`. It never falls back to the application's `DATABASE_URL`. Use a direct, non-pooled PostgreSQL URL and a dedicated migration-owner role. Never run schema migrations as `ariovelle_runtime`, and never put a URL in source control, a browser variable, logs or this document.

The runner refuses Neon pooled hostnames containing `-pooler`.

## Commands

Preview the migration plan without changing schema:

```bash
npm run db:migrate:plan
```

Apply pending migrations to an empty database or a database that already has a valid ledger:

```bash
npm run db:migrate:apply
```

Verify every checked-in migration against the immutable checksum recorded in the ledger:

```bash
npm run db:migrate:verify
```

The existing disposable Ariovelle development database already contains the structural results of migrations 0001–0005 but has no DDL ledger. Its baseline reconciliation remains a separate, explicitly approved operation. Do not replay 0001–0005 against it. Once approved, baseline 0000–0005, then apply pending 0006 and 0007.

## Production provisioning record

A separate Neon project, `ariovelle-production`, hosts database `ariovelle_prod` on the protected production branch. It was provisioned with PostgreSQL 17, a dedicated `ariovelle_owner` migration role, and a separate `ariovelle_runtime` role. The production database was empty before setup; migrations 0000–0007 were applied in order, and the DDL ledger records the SHA-256 checksum of each exact checked-in file.

Production database controls:
- RLS is enabled on all 12 public tables.
- The foundation has 17 tenant policies.
- The runtime role is not superuser, cannot create roles or databases, and has no BYPASSRLS.
- Runtime timeouts are 10 seconds for statements, 2 seconds for locks and 15 seconds for idle transactions.
- The runtime role has no direct access to session, OAuth transaction, import-provenance or schema-migration tables; it uses narrowly scoped SECURITY DEFINER functions for those operations.
- The migration owner is never used by application routes.
- No financial tables, financial records or imported user data exist in this production database.

The production app receives only the pooled runtime-role connection string through Vercel's sensitive `DATABASE_URL` variable. The direct migration-owner connection string is not stored in Vercel.

## Existing development database baseline

After reviewing the live catalog, the explicit reconciliation command is:

```bash
npm run db:migrate:baseline-existing
```

That command creates the ledger and records the exact checksums of the existing prefix 0000–0005 only after verifying the expected existing tables and columns, RLS on all 11 existing tables, 17 public policies, 10 `app_private` functions, owner/runtime role properties, runtime timeouts, protected-table ACLs and function execution grants. It does not rerun migrations 0001–0005 or change application rows. It deliberately leaves later migrations pending; run `npm run db:migrate:apply` afterwards to apply pending migrations. It is an additive schema-history operation, but it still writes to the database and must only be run against the disposable development database with the dedicated migration-owner direct URL.

The command does not clean, delete or rewrite the existing synthetic identity/session/OAuth fixtures.

## Execution guarantees

- Migrations are discovered in contiguous numeric order; gaps and missing bootstrap migration 0000 fail closed.
- SHA-256 is calculated over the exact checked-in UTF-8 file contents.
- A changed file whose version is already recorded is checksum drift; the runner refuses to continue.
- A PostgreSQL advisory lock serializes concurrent migration runners.
- Each migration's SQL and its ledger row commit in the same transaction. The runner removes only the outer `BEGIN`/`COMMIT` wrapper so DDL and ledger insertion are atomic.
- A failed migration rolls back and leaves no ledger row for that migration.
- Re-running a successful migration plan is a no-op.
- There is deliberately no destructive reset command. CI provisions a fresh ephemeral PostgreSQL 17 service for every run; local smoke tests should use a disposable Neon branch.

## CI verification

The Ariovelle verification workflow provisions an isolated PostgreSQL 17 service, creates non-production owner/runtime roles, applies all checked-in migrations from an empty database, reruns the migration command, verifies the ledger, and runs the PostgreSQL RLS integration tests. It also builds a second ephemeral database by applying 0001–0005 without a ledger, then tests the explicit baseline-reconciliation path, applies the pending migrations and verifies a no-op rerun. The test-only read-only membership is provisioned only inside that ephemeral CI database.

The live disposable Neon database is not used as the CI migration target. Its existing schema is reconciled separately using the explicit baseline command above.
