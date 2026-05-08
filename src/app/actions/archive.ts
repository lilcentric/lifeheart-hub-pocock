"use server";

import { createClient } from "@/lib/supabase/server";
import { archiveRecord, unarchiveRecord } from "@/lib/archive-service";
import type { Profile } from "@/lib/types";

type ActionResult = { success: true } | { error: string };

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, role: null };

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (data as Pick<Profile, "role"> | null)?.role ?? null;
  return { supabase, user, role };
}

export async function archiveAction(recordId: string): Promise<ActionResult> {
  const { supabase, user, role } = await getAdminUser();
  if (!supabase || !user || role !== "admin") return { error: "Unauthorized" };

  const { error } = await archiveRecord(supabase, recordId, user.id);
  if (error) return { error: (error as { message: string }).message };
  return { success: true };
}

export async function unarchiveAction(recordId: string): Promise<ActionResult> {
  const { supabase, user, role } = await getAdminUser();
  if (!supabase || !user || role !== "admin") return { error: "Unauthorized" };

  const { error } = await unarchiveRecord(supabase, recordId);
  if (error) return { error: (error as { message: string }).message };
  return { success: true };
}
