import type { SupabaseClient } from "@supabase/supabase-js";

interface ArchiveResult {
  error: unknown;
}

export async function archiveRecord(
  supabase: SupabaseClient,
  recordId: string,
  userId: string
): Promise<ArchiveResult> {
  const { error } = await supabase
    .from("onboarding_records")
    .update({ archived_at: new Date().toISOString(), archived_by: userId })
    .eq("id", recordId);
  return { error };
}

export async function unarchiveRecord(
  supabase: SupabaseClient,
  recordId: string
): Promise<ArchiveResult> {
  const { error } = await supabase
    .from("onboarding_records")
    .update({ archived_at: null, archived_by: null })
    .eq("id", recordId);
  return { error };
}
