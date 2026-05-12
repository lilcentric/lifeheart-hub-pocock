-- ============================================================
-- Migration 005: Onboarding portal overhaul
-- ============================================================

-- New table for Position Description & Code of Conduct templates.
-- Mirrors contract_templates structure exactly.
create table pd_coc_templates (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  employment_type text not null
    check (employment_type in ('permanent', 'casual')),
  version         text not null,
  template_id     text not null,
  archived        boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table pd_coc_templates enable row level security;

create policy "PdCocTemplates: authenticated read"
  on pd_coc_templates for select
  using (auth.role() = 'authenticated');

create policy "PdCocTemplates: admin insert"
  on pd_coc_templates for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "PdCocTemplates: admin update"
  on pd_coc_templates for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed placeholder templates — replace template_id values with real
-- Annature template IDs before going live.
insert into pd_coc_templates (name, employment_type, version, template_id) values
  ('PD & Code of Conduct — Permanent', 'permanent', '1.0', 'ANNATURE_PD_COC_PERM_PLACEHOLDER'),
  ('PD & Code of Conduct — Casual',    'casual',    '1.0', 'ANNATURE_PD_COC_CAS_PLACEHOLDER');

-- ============================================================
-- New columns on onboarding_records
-- ============================================================

alter table onboarding_records
  -- Which PD & CoC template was selected at link-send time
  add column if not exists pd_coc_template_id            uuid references pd_coc_templates(id),
  -- Whether Flexible Working Arrangements was included in the combined envelope
  add column if not exists flexible_working_opted_in     boolean not null default false,
  -- Annature hosted signing URL (from GET /v1/envelopes/{id}) for the staff portal button
  add column if not exists signing_url                   text,
  -- Combined status for Core Policy + High Intensity + Implementing Behaviour Support
  add column if not exists policies_status               onboarding_status not null default 'not_completed',
  -- Additional Training Certificates (new staff upload item)
  add column if not exists additional_training_status    onboarding_status not null default 'not_completed',
  add column if not exists additional_training_storage_path text;

-- Note: bundle_a_envelope_id is reused to store the combined envelope ID.
-- The webhook continues to look it up by this column name.
-- bundle_b_envelope_id is kept in place; it will no longer be written for
-- new records but existing data is preserved.
