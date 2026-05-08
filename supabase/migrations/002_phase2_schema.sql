-- ============================================================
-- Migration 002: Phase 2 schema additions
-- ============================================================

-- Add pending_verification to the status enum
alter type onboarding_status add value 'pending_verification';

-- ============================================================
-- contract_templates (must exist before onboarding_records FK)
-- ============================================================
create table contract_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  employment_type text not null,
  version     text not null,
  annature_template_id text not null,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Seed placeholder templates (replace annature IDs before go-live)
insert into contract_templates (name, employment_type, version, annature_template_id) values
  ('Permanent Contract 2.1', 'permanent', '2.1', 'ANNATURE_TEMPLATE_ID_PERM_2_1'),
  ('Permanent Contract 2.2', 'permanent', '2.2', 'ANNATURE_TEMPLATE_ID_PERM_2_2'),
  ('Permanent Contract 2.3', 'permanent', '2.3', 'ANNATURE_TEMPLATE_ID_PERM_2_3'),
  ('Casual Contract 2.1',    'casual',    '2.1', 'ANNATURE_TEMPLATE_ID_CAS_2_1'),
  ('Casual Contract 2.2',    'casual',    '2.2', 'ANNATURE_TEMPLATE_ID_CAS_2_2'),
  ('Casual Contract 2.3',    'casual',    '2.3', 'ANNATURE_TEMPLATE_ID_CAS_2_3');

-- ============================================================
-- onboarding_records — new columns
-- ============================================================

-- Phase 2 compliance & identity status fields
alter table onboarding_records
  add column identity_right_to_work_status onboarding_status not null default 'not_completed',
  add column wwcc_status                   onboarding_status not null default 'not_completed',
  add column ndiswsc_status                onboarding_status not null default 'not_completed',
  add column ndis_orientation_status       onboarding_status not null default 'not_completed',
  add column qualifications_status         onboarding_status not null default 'not_completed',
  add column first_aid_cpr_status          onboarding_status not null default 'not_completed',
  add column car_insurance_status          onboarding_status not null default 'not_completed';

-- Archive support
alter table onboarding_records
  add column archived_at  timestamptz,
  add column archived_by  uuid references profiles(id);

-- Phase 2 metadata
alter table onboarding_records
  add column contract_template_id uuid references contract_templates(id),
  add column xero_employee_id     text;

-- Drop columns replaced by Phase 2 fields
alter table onboarding_records
  drop column screening_checks_status,
  drop column id_verification_status,
  drop column relevant_insurance_status;

-- ============================================================
-- onboarding_tokens
-- ============================================================
create table onboarding_tokens (
  id           uuid primary key default gen_random_uuid(),
  record_id    text not null references onboarding_records(id) on delete cascade,
  staff_email  text not null,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- onboarding_documents (multi-upload fields)
-- ============================================================
create table onboarding_documents (
  id            uuid primary key default gen_random_uuid(),
  record_id     text not null references onboarding_records(id) on delete cascade,
  document_type text not null,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- staff_details (personal info collected via self-service portal)
-- ============================================================
create table staff_details (
  id                      uuid primary key default gen_random_uuid(),
  record_id               text not null unique references onboarding_records(id) on delete cascade,
  first_name              text not null,
  last_name               text not null,
  phone                   text,
  address                 text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  right_to_work           text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger staff_details_updated_at
  before update on staff_details
  for each row execute procedure set_updated_at();

-- ============================================================
-- RLS for new tables
-- ============================================================
alter table contract_templates enable row level security;
alter table onboarding_tokens   enable row level security;
alter table onboarding_documents enable row level security;
alter table staff_details        enable row level security;

-- contract_templates: all authenticated users can read; only admins write
create policy "ContractTemplates: authenticated read"
  on contract_templates for select
  using (auth.role() = 'authenticated');

create policy "ContractTemplates: admin write"
  on contract_templates for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- onboarding_tokens: officers/admins manage; service role used for staff portal
create policy "Tokens: officer/admin all"
  on onboarding_tokens for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'officer'))
  );

-- onboarding_documents: same access pattern as records
create policy "Documents: authenticated read"
  on onboarding_documents for select
  using (auth.role() = 'authenticated');

create policy "Documents: officer/admin write"
  on onboarding_documents for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'officer'))
  );

-- staff_details: authenticated users read; service role writes (staff portal uses service key)
create policy "StaffDetails: authenticated read"
  on staff_details for select
  using (auth.role() = 'authenticated');
