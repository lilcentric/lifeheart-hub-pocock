# ADR 0010 — Root Cause: Null Status Values Reaching the Frontend

## Status
Accepted

## Context
Issue #55 reported that `undefined` / `null` status values were reaching `StatusBadge`, causing a
crash. The immediate symptom was `Cannot destructure property 'label' of undefined` inside
`getStatusMeta`. A null guard was added as a hotfix but the upstream cause was unknown.

## Root Cause

**`screening_checks_status` was a ghost field in `types.ts`.**

Migration `002_compliance_split.sql` (documented in ADR 0008) dropped `screening_checks_status`
from the `onboarding_records` table and replaced it with seven specific compliance fields.
However, `types.ts` was not updated — the field remained as `screening_checks_status: OnboardingStatus`
(non-nullable). The registry in `onboarding-status-fields.ts` also kept an entry for it (with
`include: false`, group "Admin"), which placed it in `COLUMN_GROUPS`.

Runtime consequence:
1. `select("*")` returns a record with no `screening_checks_status` column (it doesn't exist in the DB).
2. TypeScript types claim the field is present and non-nullable — no compile-time warning.
3. `OnboardingTable` renders a `StatusBadge` for every column in `COLUMN_GROUPS`, including this one.
4. `<StatusBadge status={record.screening_checks_status} />` passes `undefined` to `getStatusMeta`.
5. `STATUS_META[undefined]` is `undefined` → destructuring crashes.

## Investigation: Were Any Production Rows Affected?

The crash path requires a column that **doesn't exist** in the DB response — it is always `undefined`,
not a stored `NULL`. No DB row ever held a `NULL` value for this field post-migration; the crash was
purely a type/registry mismatch, not a data integrity issue. No DB patching is needed.

## Migration Disorder

The migrations directory contains multiple files at the same numeric prefix
(`002_compliance_split.sql`, `002_contract_templates.sql`, `002_ndiswsc.sql`,
`002_phase2_schema.sql`; similarly for `003_xxx`). These appear to have been authored on separate
feature branches and merged without renaming. Supabase applies migrations in **alphabetical order**,
so the effective execution sequence is deterministic but non-obvious. Several of these files
duplicate DDL that an earlier sibling already applied (relying on `IF NOT EXISTS` guards or
idempotent `ALTER TYPE ... ADD VALUE IF NOT EXISTS`). While the migrations appear to be idempotent
enough to have produced a consistent schema, the disorder makes the history hard to audit.

`002_phase2_schema.sql` in particular drops `screening_checks_status`, `id_verification_status`,
and `relevant_insurance_status` **without** `IF NOT EXISTS` guards on its `ALTER TABLE ... DROP`
statements. If `002_compliance_split.sql` ran first (which alphabetical order guarantees), those
columns would already be gone — meaning `002_phase2_schema.sql`'s drops are no-ops in the current
environment but would error on a fresh DB if `002_compliance_split` were absent.

## Decision

1. **Remove `screening_checks_status` from `types.ts`** — the column no longer exists.
2. **Remove `screening_checks_status` from the registry** in `onboarding-status-fields.ts` — it
   must not appear in `COLUMN_GROUPS` and therefore must not be rendered by `OnboardingTable`.
3. **Harden `getStatusMeta`** to throw a descriptive `"getStatusMeta: unexpected status: ..."` error
   rather than silently returning `undefined` and crashing at the destructure site. This makes future
   type/schema drift produce a clear error message rather than a cryptic TypeError.
4. **Tests added** in `src/lib/onboarding-status-fields.test.ts` to assert `screening_checks_status`
   (and the other two dropped fields) are absent from `COLUMN_GROUPS`.

## Consequences

- No data migration needed — the root cause was a phantom TypeScript field, not stored NULLs.
- `getStatusMeta` now surfaces mismatches loudly rather than silently returning undefined.
- The migration file disorder is noted here for awareness. A future cleanup task should rename all
  `002_xxx` / `003_xxx` files to unique names and verify each migration is idempotent end-to-end.
- The project uses hand-written TypeScript types (`src/lib/types.ts`) rather than Supabase-generated
  types. This is the systemic gap that allowed the type/schema drift to go undetected. Adopting
  Supabase type generation (`supabase gen types typescript`) is recommended as a follow-up.
