-- ============================================================
-- Contract templates
-- ============================================================
create table contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employment_type text not null
    check (employment_type in ('permanent', 'casual')),
  version text not null,
  template_id text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contract_templates enable row level security;

-- All authenticated users can read active templates
create policy "Templates: authenticated read"
  on contract_templates for select
  using (auth.role() = 'authenticated');

-- Only admins can insert
create policy "Templates: admin insert"
  on contract_templates for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update (soft-archive)
create policy "Templates: admin update"
  on contract_templates for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Seed: six initial templates
-- ============================================================
insert into contract_templates (name, employment_type, version, template_id) values
  ('Permanent Full-Time Contract v1',   'permanent', '1.0', 'ann_perm_ft_v1'),
  ('Permanent Part-Time Contract v1',   'permanent', '1.0', 'ann_perm_pt_v1'),
  ('Permanent Full-Time Contract v2',   'permanent', '2.0', 'ann_perm_ft_v2'),
  ('Casual Standard Contract v1',       'casual',    '1.0', 'ann_cas_std_v1'),
  ('Casual Standard Contract v2',       'casual',    '2.0', 'ann_cas_std_v2'),
  ('Casual Variable Hours Contract v1', 'casual',    '1.0', 'ann_cas_var_v1');
