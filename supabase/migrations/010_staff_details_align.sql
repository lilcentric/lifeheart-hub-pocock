-- ============================================================
-- Migration 010: Align staff_details schema with application code
--
-- Production was seeded from 002_compliance_split.sql which used
-- different column names than what the app now expects. Migration
-- 003_staff_details_extra_fields.sql may also have added some of the
-- target columns already, so every step guards against re-running.
--
-- Column mapping:
--   onboarding_record_id        → record_id
--   full_name                   → first_name + last_name (split on first space)
--   emergency_name              → emergency_contact_name
--   emergency_relationship      → emergency_contact_relationship (merged with 003 column)
--   emergency_phone             → emergency_contact_phone
--   citizenship_status          → right_to_work
--   visa_expiry (date)          → visa_expiry_date (text, merged with 003 column)
--   submitted_at                → created_at
--   (new)                       → updated_at
-- ============================================================

DO $$
BEGIN

  -- 1. onboarding_record_id → record_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'onboarding_record_id'
  ) THEN
    ALTER TABLE staff_details RENAME COLUMN onboarding_record_id TO record_id;
  END IF;

  -- 2. full_name → first_name + last_name
  --    Add columns if they don't exist, populate from full_name, then drop full_name.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE staff_details
      ADD COLUMN first_name text,
      ADD COLUMN last_name  text NOT NULL DEFAULT '';

    UPDATE staff_details
    SET
      first_name = split_part(trim(full_name), ' ', 1),
      last_name  = trim(substring(trim(full_name) FROM position(' ' IN trim(full_name)) + 1));

    ALTER TABLE staff_details ALTER COLUMN first_name SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE staff_details DROP COLUMN full_name;
  END IF;

  -- 3. emergency_name → emergency_contact_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'emergency_name'
  ) THEN
    ALTER TABLE staff_details RENAME COLUMN emergency_name TO emergency_contact_name;
  END IF;

  -- 4. emergency_relationship → emergency_contact_relationship
  --    Migration 003 may have already added emergency_contact_relationship.
  --    If both exist, merge data from the old column then drop it.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'emergency_relationship'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'emergency_contact_relationship'
    ) THEN
      ALTER TABLE staff_details RENAME COLUMN emergency_relationship TO emergency_contact_relationship;
    ELSE
      UPDATE staff_details
      SET emergency_contact_relationship = emergency_relationship
      WHERE emergency_relationship IS NOT NULL AND emergency_contact_relationship IS NULL;
      ALTER TABLE staff_details DROP COLUMN emergency_relationship;
    END IF;
  END IF;

  -- 5. emergency_phone → emergency_contact_phone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'emergency_phone'
  ) THEN
    ALTER TABLE staff_details RENAME COLUMN emergency_phone TO emergency_contact_phone;
  END IF;

  -- 6. citizenship_status → right_to_work
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'citizenship_status'
  ) THEN
    ALTER TABLE staff_details RENAME COLUMN citizenship_status TO right_to_work;
  END IF;

  -- 7. visa_expiry (date) → visa_expiry_date (text)
  --    Migration 003 may have added visa_expiry_date as date type.
  --    If visa_expiry still exists, migrate its data and drop it;
  --    then change visa_expiry_date to text if it is still a date type.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'visa_expiry'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'visa_expiry_date'
    ) THEN
      ALTER TABLE staff_details ADD COLUMN visa_expiry_date text;
    END IF;

    UPDATE staff_details
    SET visa_expiry_date = visa_expiry::text
    WHERE visa_expiry IS NOT NULL AND visa_expiry_date IS NULL;

    ALTER TABLE staff_details DROP COLUMN visa_expiry;
  END IF;

  -- Ensure visa_expiry_date is text (003 added it as date; change type if needed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details'
      AND column_name = 'visa_expiry_date'
      AND data_type = 'date'
  ) THEN
    ALTER TABLE staff_details
      ALTER COLUMN visa_expiry_date TYPE text USING visa_expiry_date::text;
  END IF;

  -- 8. submitted_at → created_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE staff_details RENAME COLUMN submitted_at TO created_at;
  END IF;

  -- 9. Add updated_at if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_details' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE staff_details
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;

END $$;
