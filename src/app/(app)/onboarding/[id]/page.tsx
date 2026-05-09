import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import NdisWscPanel from "@/components/onboarding/NdisWscPanel";
import OnboardingLinkPanel from "@/components/onboarding/OnboardingLinkPanel";
import StaffDetailsPanel from "@/components/onboarding/StaffDetailsPanel";
import type { OnboardingRecord, Profile, StaffDetail } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditOnboardingPage({ params }: Props) {
  const { id } = await params;
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

  if (profile?.role === "viewer") redirect("/onboarding");

  const { data: rawRecord } = await supabase
    .from("onboarding_records")
    .select("*")
    .eq("id", id)
    .single();

  if (!rawRecord) notFound();
  const record = rawRecord as OnboardingRecord;

  // Officers can only edit their own records (RLS enforces on write; redirect on read)
  if (
    profile?.role === "officer" &&
    record.onboarding_officer !== user.id
  ) {
    redirect("/onboarding");
  }

  const { data: rawOfficers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["admin", "officer"])
    .order("full_name");
  const officers = (rawOfficers ?? []) as Pick<Profile, "id" | "full_name">[];

  const isAdmin = profile?.role === "admin";
  const isOfficer = profile?.role === "officer";

  // Fetch submitted staff details (if any)
  const { data: rawStaffDetail } = await supabase
    .from("staff_details")
    .select("*")
    .eq("record_id", id)
    .maybeSingle();
  const staffDetail = rawStaffDetail as StaffDetail | null;

  // Fetch the latest active (non-revoked) token for this record
  const { data: rawToken } = await supabase
    .from("onboarding_tokens")
    .select("id")
    .eq("record_id", id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const activeToken = rawToken as { id: string } | null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Edit Record{" "}
            <span className="font-mono text-base text-gray-500">{id}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{record.staff_name}</p>
          {record.archived_at && (
            <p className="text-xs text-amber-600 mt-1">
              Archived {new Date(record.archived_at).toLocaleDateString("en-AU")}
            </p>
          )}
        </div>
        {isAdmin && (
          <ArchiveButton
            recordId={record.id}
            isArchived={record.archived_at !== null}
          />
        )}
      </div>

      <div className="space-y-6 max-w-3xl">
        <OnboardingLinkPanel
          recordId={id}
          isAdmin={isAdmin}
          isOfficer={isOfficer}
          activeToken={activeToken}
        />

        <StaffDetailsPanel detail={staffDetail} />

        <NdisWscPanel
          recordId={id}
          initialStatus={record.ndiswsc_status}
          isAdmin={isAdmin}
        />

        <OnboardingForm
          record={record}
          officers={officers}
          currentUserRole={profile?.role ?? "viewer"}
        />
      </div>
    </div>
  );
}
