import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Named bucket constants — all bucket references in the codebase should use these,
// not inline strings, so bucket names are visible from one place.
export const STORAGE_BUCKETS = {
  // Staff portal single-file uploads (WWCC, NDISWSC)
  staffPortalSingleUploads: "onboarding-docs",
  // Staff portal multi-file uploads (Qualifications, First Aid & CPR)
  staffPortalMultiUploads: "documents",
  // Officer-initiated compliance uploads from the admin record view
  officerCompliance: "onboarding-documents",
  // Signed Annature PDFs downloaded by the webhook
  signedDocuments: "documents",
  // Static reference files (Staff Handbook, SIL Voyager Manual)
  staffDocs: "staff-docs",
} as const;

type Db = SupabaseClient<Database>;

interface StorageClient {
  createSignedUploadUrl(
    path: string
  ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
  createSignedUrl(
    path: string,
    expiresIn: number
  ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
}

export class StorageService {
  constructor(
    private readonly db: Db,
    private readonly storage: StorageClient
  ) {}

  async getSingleUploadUrl(
    recordId: string,
    documentType: string,
    filename: string
  ): Promise<{ uploadUrl: string; path: string }> {
    const path = `onboarding/${recordId}/${documentType}/${filename}`;
    const { data, error } = await this.storage.createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { uploadUrl: data!.signedUrl, path };
  }

  async recordSingleUpload(
    recordId: string,
    documentType: string,
    path: string
  ): Promise<void> {
    const column = `${documentType}_storage_path`;
    const { error } = await this.db
      .from("onboarding_records")
      .update({ [column]: path } as never)
      .eq("id", recordId);
    if (error) throw new Error(error.message);
  }

  async recordMultiUpload(
    recordId: string,
    documentType: string,
    path: string,
    filename: string
  ): Promise<void> {
    const { error } = await this.db.from("onboarding_documents").insert({
      record_id: recordId,
      document_type: documentType,
      storage_path: path,
      filename,
    } as never);
    if (error) throw new Error(error.message);
  }

  async getSignedUrl(path: string, expiresIn: number): Promise<string> {
    const { data, error } = await this.storage.createSignedUrl(path, expiresIn);
    if (error) throw new Error(error.message);
    return data!.signedUrl;
  }
}
