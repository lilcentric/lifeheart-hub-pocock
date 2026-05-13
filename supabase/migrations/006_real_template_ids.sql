-- Migration 006: Seed real Annature template IDs
-- Replaces the placeholder values inserted by migration 005.
-- Permanent 2.4 is renamed to Permanent 3.1 to match the Annature platform.

update employment_bundle_templates
  set annature_template_id = 'f7cba589dbed427fa413b0515f6d2146'
  where name = 'Employment Bundle - Permanent 2.1';

update employment_bundle_templates
  set annature_template_id = '5a20c7e1bbc84e2dbb37578b96070dd6'
  where name = 'Employment Bundle - Permanent 2.2';

update employment_bundle_templates
  set annature_template_id = 'ccbbf549bfca451ba2942719f6a506e4'
  where name = 'Employment Bundle - Permanent 2.3';

update employment_bundle_templates
  set name                 = 'Employment Bundle - Permanent 3.1',
      version              = '3.1',
      annature_template_id = '084a6d93e309434b82ad9782555a0d3d'
  where name = 'Employment Bundle - Permanent 2.4';

update employment_bundle_templates
  set annature_template_id = '12629e054d9c4d3d80b5beae041d5d04'
  where name = 'Employment Bundle - Casual 2.1';

update employment_bundle_templates
  set annature_template_id = '55cc925587d44deb927ec7e1d909f764'
  where name = 'Employment Bundle - Casual 2.2';

update employment_bundle_templates
  set annature_template_id = 'ee06ffad38554c66a1ad1b4e1be3e01b'
  where name = 'Employment Bundle - Casual 2.3';
