import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { OnboardingRecord, OnboardingToken } from "@/lib/types";

export interface ValidateTokenDeps {
  lookupToken: (token: string) => PromiseLike<{ data: OnboardingToken | null; error: unknown }>;
  getRecord: (recordId: string) => PromiseLike<{ data: OnboardingRecord | null; error: unknown }>;
}

export async function validateToken(
  token: string,
  deps: ValidateTokenDeps
): Promise<OnboardingRecord | null> {
  const { data: tokenRow } = await deps.lookupToken(token);
  if (!tokenRow || tokenRow.revoked_at !== null) return null;
  const { data: record } = await deps.getRecord(tokenRow.record_id);
  return record ?? null;
}

// Resolves a staff-portal token using the service client (bypasses RLS — staff
// members have no session). Use TokenService.validate for admin-side resolution.
export async function resolveStaffToken(token: string): Promise<OnboardingRecord | null> {
  const supabase = createServiceClient();
  return validateToken(token, {
    lookupToken: (t) =>
      supabase
        .from("onboarding_tokens")
        .select("*")
        .eq("id", t)
        .maybeSingle()
        .then((r) => ({ data: r.data as OnboardingToken | null, error: r.error })),
    getRecord: (id) =>
      supabase
        .from("onboarding_records")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then((r) => ({ data: r.data as OnboardingRecord | null, error: r.error })),
  });
}

export const TokenService = {
  async generate(recordId: string): Promise<string> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("onboarding_tokens")
      .insert({ record_id: recordId })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to generate token");
    return (data as { id: string }).id;
  },

  async validate(token: string): Promise<OnboardingRecord | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("onboarding_tokens")
      .select("onboarding_records(*)")
      .eq("id", token)
      .is("revoked_at", null)
      .single();
    if (!data) return null;
    const row = data as unknown as { onboarding_records: OnboardingRecord | null };
    return row.onboarding_records ?? null;
  },

  async revoke(token: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("onboarding_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", token);
    if (error) throw new Error(error.message);
  },
};
