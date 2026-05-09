-- ============================================================
-- Migration 004: TNA (Training Needs Analysis) fields
-- ============================================================

alter table onboarding_records
  add column if not exists tna_envelope_id    text,
  add column if not exists tna_staff_signed_at timestamptz,
  add column if not exists tna_status         onboarding_status not null default 'not_completed';
