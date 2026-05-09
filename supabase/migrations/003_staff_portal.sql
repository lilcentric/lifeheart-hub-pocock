-- Add archived flag to onboarding_records.
-- Archived records are excluded from the active view and their tokens are rejected.
ALTER TABLE onboarding_records
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Onboarding tokens: multi-session, revocable links sent to staff members.
-- No expiry — tokens are valid until explicitly revoked.
CREATE TABLE IF NOT EXISTS onboarding_tokens (
  token      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id  text NOT NULL REFERENCES onboarding_records(id) ON DELETE CASCADE,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Staff portal reads tokens via service role only — no RLS needed.
-- (Service role bypasses RLS; anon/authenticated roles cannot reach this table.)
ALTER TABLE onboarding_tokens ENABLE ROW LEVEL SECURITY;
