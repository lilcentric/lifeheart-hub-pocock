-- Stores the single Xero OAuth2 token set for the Lifeheart Payroll AU organisation.
-- Single-row table: the sentinel row is upserted on each token refresh.
-- Run the Xero OAuth flow (scripts/xero-auth) to populate the initial tokens.
CREATE TABLE IF NOT EXISTS xero_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token  TEXT        NOT NULL DEFAULT '',
  refresh_token TEXT        NOT NULL DEFAULT '',
  expires_at    BIGINT      NOT NULL DEFAULT 0,  -- Unix ms timestamp
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fixed sentinel row — SupabaseXeroTokenStore upserts against this ID.
INSERT INTO xero_tokens (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Service-role access only.
ALTER TABLE xero_tokens ENABLE ROW LEVEL SECURITY;
