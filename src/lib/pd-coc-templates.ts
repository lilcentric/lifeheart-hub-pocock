import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { PdCocTemplate, UserRole } from "./types";

export const newPdCocTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employment_type: z.enum(["permanent", "casual"]),
  version: z.string().min(1, "Version is required"),
  template_id: z.string().min(1, "Template ID is required"),
});

export async function getActivePdCocTemplates(): Promise<PdCocTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pd_coc_templates")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as PdCocTemplate[];
}

export async function addPdCocTemplate(data: unknown): Promise<PdCocTemplate> {
  const parsed = newPdCocTemplateSchema.parse(data);
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("pd_coc_templates")
    .insert(parsed)
    .select()
    .single();
  if (error) throw error;
  return row as PdCocTemplate;
}

export async function archivePdCocTemplate(
  id: string,
  callerRole: UserRole
): Promise<void> {
  if (callerRole !== "admin") throw new Error("Forbidden");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pd_coc_templates")
    .update({ archived: true })
    .eq("id", id);
  if (error) throw error;
}
