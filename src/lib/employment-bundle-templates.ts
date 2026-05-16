import { createClient } from "@/lib/supabase/server";
import type { EmploymentBundleTemplate, UserRole } from "./types";
import { newEmploymentBundleSchema } from "./employment-bundle-schema";

export async function getActiveEmploymentBundles(): Promise<EmploymentBundleTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employment_bundle_templates")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as EmploymentBundleTemplate[];
}

export async function addEmploymentBundle(data: unknown): Promise<EmploymentBundleTemplate> {
  const parsed = newEmploymentBundleSchema.parse(data);
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("employment_bundle_templates")
    .insert(parsed)
    .select()
    .single();
  if (error) throw error;
  return row as EmploymentBundleTemplate;
}

export async function archiveEmploymentBundle(
  id: string,
  callerRole: UserRole
): Promise<void> {
  if (callerRole !== "admin") throw new Error("Forbidden");
  const supabase = await createClient();
  const { error } = await supabase
    .from("employment_bundle_templates")
    .update({ archived: true })
    .eq("id", id);
  if (error) throw error;
}
