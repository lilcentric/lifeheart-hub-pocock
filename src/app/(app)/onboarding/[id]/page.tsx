import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import NdisWscPanel from "@/components/onboarding/NdisWscPanel";
import OnboardingLinkPanel from "@/components/onboarding/OnboardingLinkPanel";
import ArchiveButton from "@/components/onboarding/ArchiveButton";
import type { Profile } from "@/lib/types";
import UploadedDocumentsPanel from "@/components/onboarding/UploadedDocumentsPanel";
import { loadAdminRecordContext } from "@/lib/admin-record-loader";

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

  const isAdmin = profile?.role === "admin";
  const isOfficer = profile?.role === "officer";

  const ctx = await loadAdminRecordContext(supabase as never, id, isAdmin);
  if (!ctx) notFound();

  const { record, officers, activeToken, employmentBundles, ndiswscDownloadUrl, documentGroups } = ctx;

  // Officers can only edit records assigned to them (RLS enforces on write; redirect on read)
  if (isOfficer && record.onboarding_officer !== user.id) {
    redirect("/onboarding");
  }

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
          activeToken={activeToken ? { id: activeToken.id } : null}
          employmentBundles={employmentBundles}
        />

        <NdisWscPanel
          recordId={id}
          initialStatus={record.ndiswsc_status}
          isAdmin={isAdmin}
          clearanceDownloadUrl={ndiswscDownloadUrl}
        />

        <UploadedDocumentsPanel groups={documentGroups} />

        <OnboardingForm
          record={record}
          officers={officers}
          currentUserRole={profile?.role ?? "viewer"}
        />
      </div>
    </div>
  );
}
