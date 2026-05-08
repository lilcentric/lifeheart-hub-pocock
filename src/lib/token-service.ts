import type { OnboardingToken, OnboardingRecord } from "./types";

interface TokenDeps {
  lookupToken: (token: string) => PromiseLike<{ data: OnboardingToken | null; error: unknown }>;
  getRecord: (recordId: string) => PromiseLike<{ data: OnboardingRecord | null; error: unknown }>;
}

export async function validateToken(
  token: string,
  deps: TokenDeps
): Promise<OnboardingRecord | null> {
  const { data: tokenRow } = await deps.lookupToken(token);
  if (!tokenRow || tokenRow.revoked_at !== null) return null;

  const { data: record } = await deps.getRecord(tokenRow.record_id);
  if (!record || record.archived) return null;

  return record;
}
