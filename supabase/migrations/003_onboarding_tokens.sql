create table onboarding_tokens (
  id          uuid primary key default gen_random_uuid(),
  record_id   text not null references onboarding_records(id) on delete cascade,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

-- Only authenticated users with admin/officer role can insert tokens (enforced via RLS)
alter table onboarding_tokens enable row level security;

create policy "Officers and admins can insert tokens"
  on onboarding_tokens for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'officer')
    )
  );

create policy "Officers and admins can read tokens"
  on onboarding_tokens for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'officer')
    )
  );

create policy "Admins can update tokens"
  on onboarding_tokens for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
