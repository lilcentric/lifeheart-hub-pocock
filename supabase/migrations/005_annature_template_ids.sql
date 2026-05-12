-- Migration 005: Replace placeholder contract template IDs with real Annature template IDs.
-- Prerequisites: complete Issue #41 (Annature platform setup) and obtain real template IDs.
-- Fill in each placeholder value before running against production.

update contract_templates set annature_template_id = '<ANNATURE_TEMPLATE_ID_PERM_2_1>' where name = 'Permanent Contract 2.1';
update contract_templates set annature_template_id = '<ANNATURE_TEMPLATE_ID_PERM_2_2>' where name = 'Permanent Contract 2.2';
update contract_templates set annature_template_id = '<ANNATURE_TEMPLATE_ID_PERM_2_3>' where name = 'Permanent Contract 2.3';
update contract_templates set annature_template_id = '<ANNATURE_TEMPLATE_ID_CAS_2_1>'  where name = 'Casual Contract 2.1';
update contract_templates set annature_template_id = '<ANNATURE_TEMPLATE_ID_CAS_2_2>'  where name = 'Casual Contract 2.2';
update contract_templates set annature_template_id = '<ANNATURE_TEMPLATE_ID_CAS_2_3>'  where name = 'Casual Contract 2.3';
