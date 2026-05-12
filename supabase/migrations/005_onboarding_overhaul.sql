-- ============================================================
-- pd_coc_templates (mirrors contract_templates structure)
-- Stores Annature template IDs for Position Description /
-- Code of Conduct signing bundles.
-- ============================================================
create table pd_coc_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employment_type text not null
    check (employment_type in ('permanent', 'casual')),
  version text not null,
  template_id text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table pd_coc_templates enable row level security;

create policy "PdCocTemplates: authenticated read"
  on pd_coc_templates for select
  using (auth.role() = 'authenticated');

create policy "PdCocTemplates: admin insert"
  on pd_coc_templates for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "PdCocTemplates: admin update"
  on pd_coc_templates for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Seed: placeholder PD/CoC templates
-- ============================================================
insert into pd_coc_templates (name, employment_type, version, template_id) values
  ('Permanent PD & Code of Conduct v1', 'permanent', '1.0', 'ann_pd_coc_perm_v1'),
  ('Casual PD & Code of Conduct v1',    'casual',    '1.0', 'ann_pd_coc_cas_v1');

-- ============================================================
-- onboarding_records — new columns (Phase 3 overhaul)
-- ============================================================
alter table onboarding_records
  add column pd_coc_template_id uuid references pd_coc_templates(id),
  add column flexible_working_opted_in boolean,
  add column signing_url text,
  add column policies_status onboarding_status not null default 'not_completed',
  add column additional_training_status onboarding_status not null default 'not_completed',
  add column additional_training_storage_path text;
