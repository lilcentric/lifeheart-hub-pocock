import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import NdisWscPanel from "@/components/onboarding/NdisWscPanel";
import OnboardingLinkPanel from "@/components/onboarding/OnboardingLinkPanel";
import ArchiveButton from "@/components/onboarding/ArchiveButton";
import BundleBPanel from "@/components/onboarding/BundleBPanel";
import { getActiveTemplates } from "@/lib/contract-templates";
import type { OnboardingRecord, Profile, ContractTemplate } from "@/lib/types";

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

  // Fetch the latest active (non-revoked) token for this record (includes email for Bundle B)
  const { data: rawToken } = await supabase
    .from("onboarding_tokens")
    .select("id, staff_email")
    .eq("record_id", id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const activeToken = rawToken as { id: string; staff_email: string } | null;

  const activeTemplates = isAdmin
    ? await getActiveTemplates().catch(() => [] as ContractTemplate[])
    : [];

  const { data: rawDocs } = await supabase
    .from("onboarding_documents")
    .select("*")
    .eq("record_id", id)
    .in("document_type", ["qualifications", "first_aid_cpr"])
    .order("created_at", { ascending: true });
  const uploadedDocs = (rawDocs ?? []) as OnboardingDocument[];

  const DOCUMENT_TYPES = [
    { type: "qualifications", label: "Qualifications" },
    { type: "first_aid_cpr", label: "First Aid & CPR" },
  ] as const;

  const documentGroups = await Promise.all(
    DOCUMENT_TYPES.map(async ({ type, label }) => {
      const docs = uploadedDocs.filter((d) => d.document_type === type);
      const documents = await Promise.all(
        docs.map(async (doc) => {
          const { data } = await supabase.storage
            .from("documents")
            .createSignedUrl(doc.storage_path, 3600);
          return {
            filename: doc.filename,
            storagePath: doc.storage_path,
            signedUrl: data?.signedUrl ?? null,
            uploadedAt: doc.created_at,
          };
        })
      );
      return { type, label, documents };
    })
  );

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
        />

        {isAdmin && activeToken && activeTemplates.length > 0 && (
          <BundleBPanel
            recordId={id}
            staffEmail={activeToken.staff_email}
            templates={activeTemplates}
          />
        )}

        <NdisWscPanel
          recordId={id}
          initialStatus={record.ndiswsc_status}
          isAdmin={isAdmin}
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
