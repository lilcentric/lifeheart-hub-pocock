import { createClient } from "@/lib/supabase/server";
import type { OnboardingRecord } from "@/lib/types";

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
    await supabase
      .from("onboarding_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", token);
  },
};
