import type { SupabaseClient } from "@supabase/supabase-js";
import type { XeroTokenStore, XeroTokens } from "./xero-service";

type XeroTokenRow = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export class SupabaseXeroTokenStore implements XeroTokenStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async getTokens(): Promise<XeroTokens> {
    const { data, error } = await this.supabase
      .from("xero_tokens")
      .select("access_token, refresh_token, expires_at")
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error(
        error?.message ?? "No Xero tokens found — run the Xero OAuth flow first"
      );
    }

    const row = data as XeroTokenRow;
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
    };
  }

  async saveTokens(tokens: XeroTokens): Promise<void> {
    const { error } = await this.supabase.from("xero_tokens").upsert(
      {
        id: "00000000-0000-0000-0000-000000000001",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      throw new Error(`Failed to save Xero tokens: ${error.message}`);
    }
  }
}
