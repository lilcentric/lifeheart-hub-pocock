import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTemplates } from "@/lib/contract-templates";
import ContractTemplatesClient from "./ContractTemplatesClient";
import type { Profile } from "@/lib/types";

export default async function ContractTemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profile = rawProfile as Pick<Profile, "role"> | null;

  if (profile?.role !== "admin") redirect("/dashboard");

  const templates = await getActiveTemplates();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Contract Templates
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage Annature template versions
        </p>
      </div>
      <ContractTemplatesClient templates={templates} />
    </div>
  );
}
