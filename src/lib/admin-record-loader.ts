import type { SupabaseClient } from "@supabase/supabase-js";
import type { OnboardingRecord, Profile, EmploymentBundleTemplate, OnboardingDocument } from "./types";
import { getActiveEmploymentBundles } from "./employment-bundle-templates";
import { STORAGE_BUCKETS } from "./storage-service";

export interface DocumentGroup {
  type: string;
  label: string;
  documents: {
    filename: string | null;
    storagePath: string;
    signedUrl: string | null;
    uploadedAt: string;
  }[];
}

export interface AdminRecordContext {
  record: OnboardingRecord;
  officers: Pick<Profile, "id" | "full_name">[];
  activeToken: { id: string } | null;
  employmentBundles: EmploymentBundleTemplate[];
  ndiswscDownloadUrl: string | null;
  documentGroups: DocumentGroup[];
}

const MULTI_UPLOAD_DOCUMENT_TYPES = [
  { type: "qualifications", label: "Qualifications" },
  { type: "first_aid_cpr", label: "First Aid & CPR" },
] as const;

export async function loadAdminRecordContext(
  supabase: SupabaseClient,
  id: string,
  isAdmin: boolean
): Promise<AdminRecordContext | null> {
  const { data: rawRecord } = await supabase
    .from("onboarding_records")
    .select("*")
    .eq("id", id)
    .single();
  if (!rawRecord) return null;
  const record = rawRecord as OnboardingRecord;

  const [rawOfficers, rawToken, rawDocs] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "officer"])
      .order("full_name"),
    supabase
      .from("onboarding_tokens")
      .select("id")
      .eq("record_id", id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("onboarding_documents")
      .select("*")
      .eq("record_id", id)
      .in("document_type", ["qualifications", "first_aid_cpr"])
      .order("created_at", { ascending: true }),
  ]);

  const officers = (rawOfficers.data ?? []) as Pick<Profile, "id" | "full_name">[];
  const activeToken = (rawToken.data as { id: string } | null) ?? null;
  const uploadedDocs = (rawDocs.data ?? []) as OnboardingDocument[];

  const [employmentBundles, ndiswscDownloadUrl, documentGroups] = await Promise.all([
    isAdmin
      ? getActiveEmploymentBundles().catch((err) => {
          console.error("[admin-record-loader] Failed to load employment bundles:", err);
          return [] as EmploymentBundleTemplate[];
        })
      : Promise.resolve([] as EmploymentBundleTemplate[]),

    record.ndiswsc_storage_path
      ? supabase.storage
          .from(STORAGE_BUCKETS.staffPortalSingleUploads)
          .createSignedUrl(record.ndiswsc_storage_path, 3600)
          .then(({ data }) => data?.signedUrl ?? null)
      : Promise.resolve(null),

    Promise.all(
      MULTI_UPLOAD_DOCUMENT_TYPES.map(async ({ type, label }) => {
        const docs = uploadedDocs.filter((d) => d.document_type === type);
        const documents = await Promise.all(
          docs.map(async (doc) => {
            const { data } = await supabase.storage
              .from(STORAGE_BUCKETS.staffPortalMultiUploads)
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
    ),
  ]);

  return { record, officers, activeToken, employmentBundles, ndiswscDownloadUrl, documentGroups };
}
