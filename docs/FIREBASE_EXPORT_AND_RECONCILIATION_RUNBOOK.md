# Firebase Read-only Export and Reconciliation Runbook

**Status:** Historical contingency procedure — not required for the approved Ariovelle clean-start path. The owner confirmed legacy Firebase data belongs only to beta testers and will not be migrated. Retain this runbook only in case recovery is requested later.  
**Product:** Ariovelle, a product of Lucia LLC.  
**Purpose:** Obtain a verifiable, least-privilege snapshot of legacy Firebase Auth metadata and Firestore records so the migration can be designed from actual data rather than assumptions.

## 1. Non-negotiable safety rules

1. This is a **read-only inventory**, not a migration. Do not write to, delete from, disable, reconfigure, or deploy anything to Firebase.
2. Do not remove Firebase SDK dependencies, Auth flows, Firestore rules, cloud backup or legacy identifiers until migration and rollback gates are separately approved.
3. Do not commit exports, user records, email addresses, UIDs, service-account keys, access tokens, password hashes, salts, or other secrets to Git, GitHub issues, chat, or a ticket.
4. Do not send credentials to the implementation team. The owner/operator should run the export in an authorized environment and share only encrypted data exports or appropriately sanitized inventory outputs through an approved private channel.
5. Never export or request passwords, password hashes, salts, refresh tokens, ID tokens, OAuth access tokens, MFA secrets, API keys or service-account private keys for this inventory.
6. Restrict access to the export directory to the minimum authorized operators. Encrypt at rest and in transit. Set a retention/deletion date.
7. Use a read-only principal. Do not use the Firebase Admin SDK with a broad project Owner/Editor account when a narrower role is available.
8. If the project ID, Firebase project ownership, required permissions, or data scope is uncertain, stop and confirm before running commands.

## 2. What is known from the source audit

The code-level audit identified these expected Firestore locations:

- `users/{uid}` — profile and account metadata.
- `users/{uid}/products/trendora-tools` — legacy product backup/sync metadata document.
- `users/{uid}/products/trendora` — legacy backup fallback.
- `users/{uid}/products/trendora-tools/expenses/{recordId}`
- `users/{uid}/products/trendora-tools/incomes/{recordId}`
- `users/{uid}/products/trendora-tools/budgets/{recordId}`
- `users/{uid}/products/trendora-tools/savingsGoals/{recordId}`
- `users/{uid}/products/trendora-tools/bills/{recordId}`
- `users/{uid}/products/trendora-tools/debts/{recordId}`
- `users/{uid}/products/trendora-tools/chat/{recordId}`
- `users/{uid}/products/trendora-tools/_meta/profile` — custom categories and sync metadata.

These are **expected paths inferred from the repository**, not a claim that every path exists in the live project. The live project may contain additional collections, documents, orphaned data, or older schema variants. The export must inspect the whole database or otherwise prove its scope is complete; exporting only the paths above is insufficient to claim a complete inventory.

The local Zustand store uses key `trendoratools-v10` and persists expenses, incomes, budgets, savings goals, bills, debts and custom categories. Chat is included in cloud sync but excluded from the persisted local store. Local browser/device storage has not been inspected by this audit.

## 3. Prepare a secure export workspace

Run from an owner-controlled workstation or controlled cloud shell, not from a public/shared machine.

1. Confirm the exact Firebase/GCP project ID and that it belongs to Lucia LLC.
2. Record the operator, project ID, export timestamp (UTC), tool/SDK versions and the approved scope.
3. Create a private directory outside the repository, for example:

   ```bash
   mkdir -p "$HOME/secure-ariovelle-firebase-export"
   chmod 700 "$HOME/secure-ariovelle-firebase-export"
   ```

4. Confirm the directory is not inside a Git worktree, synced public folder, or shared Downloads directory.
5. Ensure full-disk encryption is enabled. Use an approved encrypted transfer/storage location for any export that must be shared.
6. Create a manifest with filenames, byte sizes, SHA-256 checksums, timestamps and export scope. Do not place personal data in the manifest.
7. Keep an untouched raw snapshot. Perform parsing, normalization and redaction on a separate working copy.

## 4. IAM and access

Ask the Firebase/GCP project owner to grant a temporary, named operator account only the permissions needed to list Auth users and read Firestore documents. Prefer predefined viewer roles or a narrowly scoped custom role verified against the current Google Cloud IAM documentation.

Do not grant project Owner, Editor, Firebase Admin, Firestore write, import/export, or service-account key-creation permissions for this task. Do not create or download a long-lived service-account key. Prefer short-lived user credentials / Application Default Credentials in the controlled environment.

Before querying, verify the active account and project explicitly:

```bash
gcloud auth list
gcloud config get-value project
gcloud projects describe PROJECT_ID --format='value(projectId)'
```

Replace `PROJECT_ID` with the confirmed project ID. Stop if the active account or project is not the expected one. Do not paste access tokens or credential output into a report.

## 5. Firebase Authentication metadata

The goal is to count users and understand account/provider states, not to reproduce credentials.

Produce an allowlisted CSV or JSONL containing only:

- Firebase UID (keep in the encrypted raw inventory; pseudonymize in reports).
- Account disabled flag.
- Email-verified flag.
- Provider IDs (for example, password or google.com), not provider tokens.
- Account creation timestamp.
- Last sign-in timestamp, if present.
- Whether email is present (a boolean in the sanitized report; omit the address unless a private account-link reconciliation explicitly requires it).
- Whether display name/photo URL is present (booleans only in the sanitized report).

Use the Firebase Admin SDK `listUsers()` pagination API or another officially supported read-only Auth user listing method. Continue through every page using the returned page token until no page remains. Record the total number of pages and users. The export implementation must explicitly map the allowlisted fields above; do not serialize the complete SDK user object.

**Never include** `passwordHash`, `salt`, provider raw profile data, email addresses in the sanitized report, phone numbers, MFA factors, tokens, or credentials. If the SDK object exposes any of these, omit them before serialization.

If a secure allowlisted export cannot be produced, stop and ask for a reviewed export method rather than using a full unfiltered Auth dump.

## 6. Firestore document inventory

Use an officially supported Firestore server SDK with read-only credentials. Traverse the complete database, including nested subcollections. Firestore collection listing and recursive traversal must be handled deliberately: a parent document may have no fields but still have subcollections, and a collection-group scan alone may not reveal every collection name.

For each document, preserve in the encrypted raw export:

- Full document path (including UID and document ID).
- Document ID and parent collection path.
- Export timestamp (UTC).
- Original field names, types and values, including Firestore timestamps, references and numeric types without lossy conversion.
- A stable per-document content hash computed from a canonical serialization that preserves type distinctions.

Do not convert Firestore timestamps to local time, coerce integers to floating point, or normalize money values during raw export. Keep a separate parser output for analysis.

At minimum, verify the expected paths in section 2. Also enumerate all root collections and recursively enumerate subcollections under every document. Report any unrecognized collection/document paths rather than dropping them.

### Required completeness checks

- Root collection enumeration completed and recorded.
- Recursive subcollection traversal completed; no unexplained traversal errors.
- Every page/batch fully consumed.
- Total document count by root collection and nested collection path.
- Count of documents with missing or malformed expected fields.
- Count of documents with no parent user document.
- Count of documents under unknown product paths.
- Export manifest includes per-file SHA-256 checksums.
- A second read-only count pass agrees with the export counts, or every discrepancy is explained.

If a full recursive export is not possible with the chosen tool, clearly label the export **partial** and list excluded paths. Do not call it a complete Firebase inventory.

## 7. Local-device export

Local browser storage is separate from Firestore and cannot be inferred from a Firebase export. For each owner-authorized test device/browser profile:

1. Use the app's existing JSON export control where possible.
2. Preserve the original export file unchanged in the encrypted workspace.
3. Record app version, browser/device type, export timestamp and whether the user was signed in.
4. Do not ask users to send screenshots of financial records.
5. If a controlled localStorage inspection is needed, inspect only the `trendoratools-v10` key on an explicitly authorized profile and export it locally. Do not collect unrelated browser storage, cookies or session data.
6. Do not assume one device represents every user's local-only records. Local data is user/device-specific and may not exist in cloud backups.

The app's current JSON export has version `1.0.0` and omits chat. Record this limitation in the inventory.

## 8. Reconciliation and data-quality analysis

Run analysis only on a working copy. Preserve source values and add derived columns rather than overwriting the raw data.

Build a reconciliation report with these sections:

### A. Coverage
- Auth user count.
- Firestore document counts by path.
- Users with a profile document.
- Users with product backup documents.
- Users with one or more financial subcollections.
- Users with Auth accounts but no Firestore profile.
- Firestore user documents with no matching Auth UID.
- Unknown/unexpected collection paths.
- Local export counts, reported separately from cloud counts.

### B. Record integrity
For each record type (expenses, incomes, budgets, savings goals, bills, debts, chat):
- Total records.
- Missing IDs / duplicate IDs within the same owner and collection.
- Missing required fields.
- Invalid numeric values, negative values where disallowed, NaN/infinity, and numeric precision anomalies.
- Invalid or ambiguous dates/timestamps.
- Records with unexpected field types or unknown fields.
- Duplicate-looking records (flag only; do not automatically deduplicate).
- Orphaned records and owner/path mismatches.

### C. Currency and money
- Count records by explicit currency if any field exists.
- Count records with no currency.
- Inspect amount field type, magnitude, integer/fractional characteristics and historical conversion code.
- Do not infer currency solely from the current NGN display default, user locale, email, location or account profile.
- Do not infer a currency exponent solely from the numeric value.
- Keep currency-unresolved records in a separate migration exception group until the owner defines a safe resolution policy.

### D. Cross-source reconciliation
Compare cloud backup documents, subcollection records and local JSON exports by stable source ID and canonical content hash. Classify each item as:
- Cloud-only.
- Local-only.
- Backup-only.
- Present in multiple sources with identical content.
- Present in multiple sources with conflicting content.
- Malformed / cannot be parsed.
- Potential duplicate (review required).

Do not auto-merge, overwrite, delete, or choose a winning copy. Existing sync behavior is not an acceptable conflict-resolution policy.

## 9. Migration staging output

Produce these files in the encrypted workspace:

- `manifest.json` — project identifier, scope, export timestamp, tool versions, counts, completeness flags and file checksums; no credentials.
- `auth-users-allowlisted.jsonl` — restricted identity metadata; UID retained only in the encrypted raw copy.
- `firestore-raw/` — original typed records and path metadata.
- `firestore-inventory.csv` — path/count/field-shape summary, no personal values.
- `record-quality.csv` — counts of validation findings by collection and issue code.
- `currency-review.csv` — counts and unresolved categories; no transaction notes or personal descriptions.
- `source-reconciliation.csv` — source ID/hash classifications; pseudonymized owner IDs in the shareable copy.
- `migration-exceptions.csv` — exception code, source path reference, pseudonymized owner, and remediation status; no raw personal content.
- `README.txt` — operator, date, scope, known omissions and checksums.

Keep the mapping from pseudonymized owner IDs to Firebase UIDs only in the encrypted restricted raw workspace. Never include raw financial notes, chat messages or email addresses in a general report.

## 10. Review and acceptance gates

The inventory is accepted only when all of the following are true:

- [ ] Project ownership and project ID confirmed.
- [ ] Export was performed with read-only access.
- [ ] Auth listing pagination reached completion and only allowlisted fields were exported.
- [ ] Firestore root collections and nested subcollections were enumerated.
- [ ] Completeness checks and second-pass counts completed.
- [ ] Raw exports are encrypted, checksummed and stored outside Git.
- [ ] Auth, Firestore and local-device counts are reported separately.
- [ ] Currency ambiguity and all migration exceptions are explicit.
- [ ] Cloud/local/backup conflicts are classified without automatic resolution.
- [ ] A named owner has reviewed and approved the inventory report.

An inventory sign-off does **not** authorize data migration, Firebase deletion, authentication changes, production database provisioning, or a production deployment. Those require separate approval and a tested rollback plan.

## 11. Handoff package

Share through the approved private channel:

1. The sanitized `manifest.json`.
2. Sanitized collection/path counts and record-quality summaries.
3. Sanitized currency review.
4. Pseudonymized source reconciliation and exception counts.
5. A note confirming whether the export was complete or partial.
6. The checksum of the encrypted raw export and the secure location where the owner retains it.

Do not upload raw customer exports to this Git repository. Do not paste raw user records into chat. If record-level inspection becomes necessary, use a separately approved secure process with a minimal, redacted sample.

## 12. Current status

- Source-code dependency and schema inventory: completed for the inspected repository revision; see `docs/REPOSITORY_AUDIT.md`.
- Live Firebase Auth / Firestore contents: **not accessed; no export required under the current owner decision**.
- Local device/browser storage: **not yet accessed**.
- Real record counts, data quality, orphan records, conflicts and currency distribution: **not being inventoried; legacy beta data is out of scope**.
- Firebase dependencies and data: unchanged by this runbook.
- Next engineering gate: proceed with the clean Ariovelle backend. Do not begin Firebase export/import unless the owner separately changes this decision.
