-- ============================================================
-- Profiles: extends Supabase auth.users
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'viewer'
    check (role in ('admin', 'officer', 'viewer'))
);

-- Auto-create a profile row when a new auth user is created.
-- New users default to 'viewer'; an admin must promote them.
create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Onboarding status enum
-- ============================================================
create type onboarding_status as enum (
  'completed',
  'not_completed',
  'not_received',
  'not_signed',
  'in_progress',
  'na'
);

-- ============================================================
-- Sequence for LF-HDC-XXXXX IDs
-- ============================================================
create sequence onboarding_id_seq start 1;

-- Helper: generate next ID in LF-HDC-XXXXX format
create function next_onboarding_id()
returns text as $$
  select 'LF-HDC-' || lpad(nextval('onboarding_id_seq')::text, 5, '0');
$$ language sql;

-- ============================================================
-- Onboarding records
-- ============================================================
create table onboarding_records (
  id text primary key default next_onboarding_id(),
  created_by uuid references profiles(id),
  staff_name text not null,
  onboarding_officer uuid not null references profiles(id),
  date_onboarding_began date,
  date_shift_began date,

  -- Recruitment
  job_application_status  onboarding_status not null default 'not_completed',
  interview_status        onboarding_status not null default 'not_completed',
  reference_checks_status onboarding_status not null default 'not_completed',

  -- Recruitment — legacy (dimmed in UI, pending lean workflow removal)
  cv_status               onboarding_status not null default 'not_completed',

  -- Documentation (supports not_received / not_signed)
  position_description_status  onboarding_status not null default 'not_completed',
  employment_contract_status   onboarding_status not null default 'not_completed',
  code_of_conduct_status       onboarding_status not null default 'not_completed',
  employee_details_form_status onboarding_status not null default 'not_completed',
  id_verification_status       onboarding_status not null default 'not_completed',
  relevant_insurance_status    onboarding_status not null default 'not_completed',
  conflict_of_interest_status  onboarding_status not null default 'not_completed',

  -- Compliance
  screening_checks_status onboarding_status not null default 'not_completed',

  -- Training & Induction
  training_status              onboarding_status not null default 'not_completed',
  orientation_induction_status onboarding_status not null default 'not_completed',

  -- Training — legacy (dimmed in UI, pending lean workflow removal)
  training_needs_status   onboarding_status not null default 'not_completed',

  -- Admin — legacy (dimmed in UI, pending lean workflow removal)
  uniforms_status         onboarding_status not null default 'not_completed',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every update
create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger onboarding_records_updated_at
  before update on onboarding_records
  for each row execute procedure set_updated_at();

-- ============================================================
-- Row-level security
-- ============================================================
alter table profiles enable row level security;
alter table onboarding_records enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "Profiles: authenticated read"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Profiles: self update"
  on profiles for update
  using (id = auth.uid());

-- Onboarding records: all authenticated users can read
create policy "Records: authenticated read"
  on onboarding_records for select
  using (auth.role() = 'authenticated');

-- Officers and admins can insert
create policy "Records: officer/admin insert"
  on onboarding_records for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'officer')
    )
  );

-- Officers can update only their assigned records; admins can update any
create policy "Records: officer/admin update"
  on onboarding_records for update
  using (
    onboarding_officer = auth.uid()
    or exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can delete
create policy "Records: admin delete"
  on onboarding_records for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
