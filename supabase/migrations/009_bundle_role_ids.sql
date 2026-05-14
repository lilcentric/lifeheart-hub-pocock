-- Migration 009: Store Annature role IDs per employment bundle template
-- Role IDs are template-scoped in Annature — using global env vars caused every
-- template except Casual 2.1 to fail with "Role does not exist" (400).

alter table employment_bundle_templates
  add column staff_role_id    text not null default '',
  add column director_role_id text not null default '';

-- Populate from Annature GET /v1/templates/{id} responses (fetched 2026-05-15)
update employment_bundle_templates set staff_role_id = '7ac2ee0dc3ab4306b6b289613ccfd0aa', director_role_id = '3c85a3dafa614aefa5016915d57afb55' where annature_template_id = 'f7cba589dbed427fa413b0515f6d2146'; -- Permanent 2.1
update employment_bundle_templates set staff_role_id = 'ee464f146c0341acbf37077d56d0c224', director_role_id = '7483d9e379234ad3a2ca0d4f634e623b' where annature_template_id = '5a20c7e1bbc84e2dbb37578b96070dd6'; -- Permanent 2.2
update employment_bundle_templates set staff_role_id = 'f14954cb599546fca7b073fceebd769e', director_role_id = 'f5a69f13b2aa4383ad8f2884d95f01cf' where annature_template_id = 'ccbbf549bfca451ba2942719f6a506e4'; -- Permanent 2.3
update employment_bundle_templates set staff_role_id = '4539c8b54699444d89c7f1bb38ed35eb', director_role_id = 'd7c4ac1e07eb4488bc8f078090470e36' where annature_template_id = '084a6d93e309434b82ad9782555a0d3d'; -- Permanent 3.1
update employment_bundle_templates set staff_role_id = '6a331d0b6c764731b9da09ee93fa7032', director_role_id = '0deb3162728e4da6921a129b82b69855' where annature_template_id = '12629e054d9c4d3d80b5beae041d5d04'; -- Casual 2.1
update employment_bundle_templates set staff_role_id = 'e6979e2276414647bf06a183eade8885', director_role_id = 'a88093ce3bed45c69a13c3ca3dc314d0' where annature_template_id = '55cc925587d44deb927ec7e1d909f764'; -- Casual 2.2
update employment_bundle_templates set staff_role_id = '642f0a770a18412783c78d2091b90383', director_role_id = '0cfee3abf6974cd98118270410329eb2' where annature_template_id = 'ee06ffad38554c66a1ad1b4e1be3e01b'; -- Casual 2.3

-- Remove defaults now that all rows are populated
alter table employment_bundle_templates
  alter column staff_role_id    drop default,
  alter column director_role_id drop default;
