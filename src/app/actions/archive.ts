"use server";

import { createClient } from "@/lib/supabase/server";
import { withRole } from "@/lib/auth-guard";
import { archiveRecord, unarchiveRecord } from "@/lib/archive-service";

type ActionResult = { success: true } | { error: string };

export async function archiveAction(recordId: string): Promise<ActionResult> {
  return withRole("admin", async (ctx) => {
    const supabase = await createClient();
    const { error } = await archiveRecord(supabase, recordId, ctx.userId);
    if (error) return { error: (error as { message: string }).message };
    return { success: true };
  });
}

export async function unarchiveAction(recordId: string): Promise<ActionResult> {
  return withRole("admin", async () => {
    const supabase = await createClient();
    const { error } = await unarchiveRecord(supabase, recordId);
    if (error) return { error: (error as { message: string }).message };
    return { success: true };
  });
}
