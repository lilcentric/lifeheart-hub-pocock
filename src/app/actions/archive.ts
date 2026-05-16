"use server";

import { createClient } from "@/lib/supabase/server";
import { withRole } from "@/lib/auth-guard";

type ActionResult = { success: true } | { error: string };

export async function archiveAction(recordId: string): Promise<ActionResult> {
  return withRole("admin", async (ctx) => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("onboarding_records")
      .update({ archived_at: new Date().toISOString(), archived_by: ctx.userId })
      .eq("id", recordId);
    if (error) return { error: error.message };
    return { success: true };
  });
}

export async function unarchiveAction(recordId: string): Promise<ActionResult> {
  return withRole("admin", async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("onboarding_records")
      .update({ archived_at: null, archived_by: null })
      .eq("id", recordId);
    if (error) return { error: error.message };
    return { success: true };
  });
}
