import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ContractTemplate, UserRole } from "./types";

export const newTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employment_type: z.enum(["permanent", "casual"]),
  version: z.string().min(1, "Version is required"),
  annature_template_id: z.string().min(1, "Annature template ID is required"),
});

export async function getActiveTemplates(): Promise<ContractTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ContractTemplate[];
}

export async function addTemplate(data: unknown): Promise<ContractTemplate> {
  const parsed = newTemplateSchema.parse(data);
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("contract_templates")
    .insert(parsed)
    .select()
    .single();
  if (error) throw error;
  return row as ContractTemplate;
}

export async function archiveTemplate(
  id: string,
  callerRole: UserRole
): Promise<void> {
  if (callerRole !== "admin") throw new Error("Forbidden");
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_templates")
    .update({ archived: true })
    .eq("id", id);
  if (error) throw error;
}
