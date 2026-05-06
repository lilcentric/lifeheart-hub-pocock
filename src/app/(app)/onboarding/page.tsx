import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingTable from "@/components/onboarding/OnboardingTable";
import Link from "next/link";
import type { OnboardingRecord, Profile } from "@/lib/types";

export default async function OnboardingPage() {
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

  const { data: rawRecords, error } = await supabase
    .from("onboarding_records")
    .select("*, officer_profile:profiles!onboarding_officer(id, full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch onboarding records:", error);
  }

  type RecordRow = OnboardingRecord & {
    officer_profile: { id: string; full_name: string } | null;
  };
  const records = (rawRecords ?? []) as RecordRow[];

  const canWrite =
    profile?.role === "admin" || profile?.role === "officer";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Staff Onboarding
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {records?.length ?? 0} records
          </p>
        </div>
        {canWrite && (
          <Link
            href="/onboarding/new"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            New record
          </Link>
        )}
      </div>

      <OnboardingTable
        records={records}
        canWrite={canWrite}
        currentUserId={user.id}
        currentUserRole={profile?.role ?? "viewer"}
      />
    </div>
  );
}
