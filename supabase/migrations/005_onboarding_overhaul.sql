-- ============================================================
-- Migration 005: Onboarding portal overhaul
-- ============================================================

-- Rename contract_templates → employment_bundle_templates
alter table contract_templates rename to employment_bundle_templates;

-- Seed the 7 Employment Bundle templates (replace IDs before go-live)
insert into employment_bundle_templates (name, employment_type, version, annature_template_id) values
  ('Employment Bundle - Permanent 2.1', 'permanent', '2.1', 'PLACEHOLDER_PERM_2_1'),
  ('Employment Bundle - Permanent 2.2', 'permanent', '2.2', 'PLACEHOLDER_PERM_2_2'),
  ('Employment Bundle - Permanent 2.3', 'permanent', '2.3', 'PLACEHOLDER_PERM_2_3'),
  ('Employment Bundle - Permanent 2.4', 'permanent', '2.4', 'PLACEHOLDER_PERM_2_4'),
  ('Employment Bundle - Casual 2.1',    'casual',    '2.1', 'PLACEHOLDER_CAS_2_1'),
  ('Employment Bundle - Casual 2.2',    'casual',    '2.2', 'PLACEHOLDER_CAS_2_2'),
  ('Employment Bundle - Casual 2.3',    'casual',    '2.3', 'PLACEHOLDER_CAS_2_3');

-- ============================================================
-- onboarding_records changes
-- ============================================================

-- Rename contract_template_id → employment_bundle_id
alter table onboarding_records rename column contract_template_id to employment_bundle_id;

-- Drop the now-unused Bundle B envelope column
alter table onboarding_records drop column if exists bundle_b_envelope_id;

-- New columns
alter table onboarding_records
  add column if not exists signing_url                   text,
  add column if not exists flexible_working_opted_in     boolean not null default false,
  add column if not exists fwa_envelope_id               text,
  add column if not exists fwa_signing_url               text,
  add column if not exists flexible_working_status       onboarding_status not null default 'na',
  add column if not exists policies_status               onboarding_status not null default 'not_completed',
  add column if not exists additional_training_status    onboarding_status not null default 'not_completed',
  add column if not exists additional_training_storage_path text;

-- Note: bundle_a_envelope_id stores the Employment Bundle envelope ID.
-- bundle_b_envelope_id is dropped. No pd_coc_templates table is created.
