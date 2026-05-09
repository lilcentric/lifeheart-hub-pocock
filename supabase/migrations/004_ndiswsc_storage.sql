-- Add storage path column for NDIS Worker Screening Check uploaded clearance.
-- Null means no file has been uploaded yet.
ALTER TABLE onboarding_records
  ADD COLUMN IF NOT EXISTS ndiswsc_storage_path text;
