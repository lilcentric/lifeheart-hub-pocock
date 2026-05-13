import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveEmploymentBundles } from "@/lib/employment-bundle-templates";
import EmploymentBundlesClient from "./EmploymentBundlesClient";
import type { Profile } from "@/lib/types";

export default async function EmploymentBundlesPage() {
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

  const bundles = await getActiveEmploymentBundles();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Employment Bundles
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage Annature employment bundle template versions
        </p>
      </div>
      <EmploymentBundlesClient bundles={bundles} />
    </div>
  );
}
