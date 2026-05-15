-- Add storage path columns to onboarding_records that were missing from prod.
-- Uses IF NOT EXISTS so this is safe to run regardless of which prior migrations
-- were applied (004 adds ndiswsc_storage_path; 005 adds additional_training_storage_path;
-- neither ran on prod).
ALTER TABLE onboarding_records
  ADD COLUMN IF NOT EXISTS identity_right_to_work_storage_path text,
  ADD COLUMN IF NOT EXISTS wwcc_storage_path                   text,
  ADD COLUMN IF NOT EXISTS ndiswsc_storage_path                text,
  ADD COLUMN IF NOT EXISTS ndis_orientation_storage_path       text,
  ADD COLUMN IF NOT EXISTS car_insurance_storage_path          text,
  ADD COLUMN IF NOT EXISTS additional_training_storage_path    text;
