-- Add pending_verification to the onboarding_status enum.
-- Postgres requires ALTER TYPE ... ADD VALUE to run outside a transaction block.
ALTER TYPE onboarding_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- Add NDIS Worker Screening Check column to onboarding_records.
-- Defaults to not_completed so existing rows are unaffected.
ALTER TABLE onboarding_records
  ADD COLUMN IF NOT EXISTS ndiswsc_status onboarding_status NOT NULL DEFAULT 'not_completed';
