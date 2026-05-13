-- ============================================================
-- Migration 007: Add bundle_a_envelope_id to onboarding_records
-- ============================================================
-- The application writes to onboarding_records.bundle_a_envelope_id at
-- link-send time (see src/app/actions/onboarding-link.ts), but no prior
-- migration created the column. Production was patched manually on
-- 2026-05-13; this migration brings supabase/migrations/ in line so a
-- fresh DB build matches prod. `if not exists` keeps it idempotent.

alter table onboarding_records
  add column if not exists bundle_a_envelope_id text;
