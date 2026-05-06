-- Bootstrap: promote josh@lifeheart.com.au to admin.
-- Run this after the auth user has been created in Supabase Auth UI.
update profiles
set role = 'admin', full_name = 'Josh'
where id = (
  select id from auth.users where email = 'josh@lifeheart.com.au'
);
