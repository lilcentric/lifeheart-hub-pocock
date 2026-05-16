import type { SupabaseClient } from "@supabase/supabase-js";
import type { StatusFieldKey } from "./onboarding-status-fields";
import { getUploadConfig } from "./onboarding-status-fields";
import { StorageService } from "./storage-service";

// Upload kinds derive directly from registry entries that have `upload` config.
// Each kind maps to `${kind}_status` in the registry.
export type UploadKind =
  | "identity_right_to_work"
  | "ndis_orientation"
  | "car_insurance"
  | "additional_training"
  | "ndiswsc"
  | "wwcc"
  | "qualifications"
  | "first_aid_cpr";

export interface RecordUploadDeps {
  // Writes one or more columns on the onboarding_records row atomically.
  // Used for single-file items (path + status in one update).
  updateRecord: (
    recordId: string,
    updates: Record<string, string>
  ) => Promise<{ error: string | null }>;
  // Inserts a row into onboarding_documents. Required for multi-file upload kinds;
  // omit for single-file kinds (recordUpload will never call it for those).
  insertDocument?: (
    recordId: string,
    documentType: string,
    storagePath: string,
    filename: string
  ) => Promise<void>;
}

// Constructs standard RecordUploadDeps from a Supabase client.
// Pass multiUploadStorage for upload kinds that insert into onboarding_documents.
export function makeUploadDeps(
  supabase: SupabaseClient,
  multiUploadStorage?: StorageService
): RecordUploadDeps {
  return {
    updateRecord: async (id, updates) => {
      const { error } = await supabase
        .from("onboarding_records")
        .update(updates as never)
        .eq("id", id);
      return { error: error?.message ?? null };
    },
    ...(multiUploadStorage
      ? {
          insertDocument: (rid, dtype, path, fname) =>
            multiUploadStorage.recordMultiUpload(rid, dtype, path, fname),
        }
      : {}),
  };
}

export type RecordUploadResult = { success: true } | { error: string };

// Unified upload handler for all staff upload kinds. Callers pass the upload
// kind and storage path; column names, status values, and storage strategy are
// read from the registry — not hardcoded per-caller.
//
// Single-file items write both the path column and status column in one DB
// call, eliminating the partial-update window that existed when they were
// separate updates.
export async function recordUpload(
  recordId: string,
  uploadKind: UploadKind,
  storagePath: string,
  filename: string,
  deps: RecordUploadDeps
): Promise<RecordUploadResult> {
  const statusField = `${uploadKind}_status` as StatusFieldKey;
  const config = getUploadConfig(statusField);

  if (!config) {
    return { error: `No upload config registered for "${uploadKind}"` };
  }

  if (config.kind === "single") {
    const result = await deps.updateRecord(recordId, {
      [config.pathField]: storagePath,
      [statusField]: config.uploadedStatus,
    });
    if (result.error) return { error: result.error };
    return { success: true };
  }

  // multi: insert document row, then update status
  if (!deps.insertDocument) {
    return { error: `insertDocument dep required for multi-upload kind "${uploadKind}"` };
  }
  try {
    await deps.insertDocument(recordId, uploadKind, storagePath, filename);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to record document" };
  }

  const statusResult = await deps.updateRecord(recordId, {
    [statusField]: config.uploadedStatus,
  });
  if (statusResult.error) return { error: statusResult.error };

  return { success: true };
}
