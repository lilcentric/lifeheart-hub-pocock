import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import NdisWscPanel from "@/components/onboarding/NdisWscPanel";
import type { OnboardingRecord, Profile } from "@/lib/types";

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Edit Record{" "}
          <span className="font-mono text-base text-gray-500">{id}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{record.staff_name}</p>
      </div>

      <div className="space-y-6 max-w-3xl">
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
