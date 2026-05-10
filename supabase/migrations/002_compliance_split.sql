-- ============================================================
-- Migration 002: Compliance fields split + Phase 2 tables
-- ============================================================

-- Add pending_verification to the status enum
alter type onboarding_status add value if not exists 'pending_verification';

-- ============================================================
-- Add new specific compliance fields to onboarding_records
-- ============================================================
alter table onboarding_records
  add column if not exists identity_right_to_work_status onboarding_status not null default 'not_completed',
  add column if not exists wwcc_status                   onboarding_status not null default 'not_completed',
  add column if not exists ndiswsc_status                onboarding_status not null default 'not_completed',
  add column if not exists ndis_orientation_status       onboarding_status not null default 'not_completed',
  add column if not exists qualifications_status         onboarding_status not null default 'not_completed',
  add column if not exists first_aid_cpr_status          onboarding_status not null default 'not_completed',
  add column if not exists car_insurance_status          onboarding_status not null default 'not_completed';

-- Remove the broad catch-all fields replaced by the above
alter table onboarding_records
  drop column if exists screening_checks_status,
  drop column if exists id_verification_status,
  drop column if exists relevant_insurance_status;

-- Add soft archive support
alter table onboarding_records
  add column if not exists archived_at  timestamptz,
  add column if not exists archived_by  uuid references profiles(id);

-- Add contract template reference
alter table onboarding_records
  add column if not exists contract_template_id uuid;

-- Xero employee ID — set when employee is created in Xero at link-send time
alter table onboarding_records
  add column if not exists xero_employee_id text;

-- ============================================================
-- Onboarding tokens (staff self-service access)
-- ============================================================
create table if not exists onboarding_tokens (
  id                  uuid primary key default gen_random_uuid(),
  onboarding_record_id text not null references onboarding_records(id) on delete cascade,
  token               uuid not null unique default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  revoked_at          timestamptz
);

alter table onboarding_tokens enable row level security;

-- Only the service role (used by server actions) can manage tokens
-- Staff access is validated by token lookup in application code, not RLS
create policy "Tokens: admin read"
  on onboarding_tokens for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Tokens: officer/admin insert"
  on onboarding_tokens for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'officer'))
  );

create policy "Tokens: admin revoke"
  on onboarding_tokens for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- Onboarding documents (multi-upload fields)
-- ============================================================
create type document_type as enum (
  'qualifications',
  'first_aid_cpr'
);

create table if not exists onboarding_documents (
  id                   uuid primary key default gen_random_uuid(),
  onboarding_record_id text not null references onboarding_records(id) on delete cascade,
  document_type        document_type not null,
  storage_path         text not null,
  file_name            text not null,
  uploaded_at          timestamptz not null default now()
);

alter table onboarding_documents enable row level security;

-- Authenticated users can read documents for records they can access
create policy "Documents: authenticated read"
  on onboarding_documents for select
  using (auth.role() = 'authenticated');

-- Officers and admins can insert
create policy "Documents: officer/admin insert"
  on onboarding_documents for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'officer'))
  );

-- Admins can delete
create policy "Documents: admin delete"
  on onboarding_documents for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- Staff details (minimal — payroll details captured by Xero)
-- ============================================================
create table if not exists staff_details (
  id                     uuid primary key default gen_random_uuid(),
  onboarding_record_id   text not null unique references onboarding_records(id) on delete cascade,

  -- Contact
  full_name              text not null,
  preferred_name         text,
  personal_email         text,
  phone                  text,

  -- Emergency contact
  emergency_name         text,
  emergency_relationship text,
  emergency_phone        text,

  -- Right to work (NDIS compliance)
  citizenship_status     text,
  visa_type              text,
  visa_expiry            date,

  submitted_at           timestamptz not null default now()
);

alter table staff_details enable row level security;

create policy "Staff details: authenticated read"
  on staff_details for select
  using (auth.role() = 'authenticated');

create policy "Staff details: officer/admin insert"
  on staff_details for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'officer'))
  );

create policy "Staff details: officer/admin update"
  on staff_details for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'officer'))
  );

-- ============================================================
-- Contract templates
-- ============================================================
create table if not exists contract_templates (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,              -- e.g. "Permanent 2.3"
  employment_type       text not null               -- 'permanent' | 'casual'
    check (employment_type in ('permanent', 'casual')),
  version               text not null,              -- e.g. "2.3"
  annature_template_id  text not null,
  archived              boolean not null default false,
  created_at            timestamptz not null default now()
);

alter table contract_templates enable row level security;

create policy "Contract templates: authenticated read"
  on contract_templates for select
  using (auth.role() = 'authenticated');

create policy "Contract templates: admin write"
  on contract_templates for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed the six active contract versions (Annature template IDs to be filled in)
insert into contract_templates (name, employment_type, version, annature_template_id) values
  ('Permanent 2.1', 'permanent', '2.1', 'ANNATURE_TEMPLATE_ID_PERM_2_1'),
  ('Permanent 2.2', 'permanent', '2.2', 'ANNATURE_TEMPLATE_ID_PERM_2_2'),
  ('Permanent 2.3', 'permanent', '2.3', 'ANNATURE_TEMPLATE_ID_PERM_2_3'),
  ('Casual 2.1',    'casual',    '2.1', 'ANNATURE_TEMPLATE_ID_CAS_2_1'),
  ('Casual 2.2',    'casual',    '2.2', 'ANNATURE_TEMPLATE_ID_CAS_2_2'),
  ('Casual 2.3',    'casual',    '2.3', 'ANNATURE_TEMPLATE_ID_CAS_2_3')
on conflict do nothing;
