"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { resolveStaffToken } from "@/lib/token-service";
import { StorageService } from "@/lib/storage-service";
import { recordUpload, type UploadKind } from "@/lib/record-upload";
import { revalidatePath } from "next/cache";

const DOCUMENTS_BUCKET = "documents";

export async function getStaffUploadUrl(
  token: string,
  documentType: string,
  filename: string
): Promise<{ uploadUrl: string; storagePath: string } | { error: string }> {
  const record = await resolveStaffToken(token);
  if (!record) return { error: "Invalid or expired link" };

  const supabase = createServiceClient();
  const storage = new StorageService(
    supabase,
    supabase.storage.from(DOCUMENTS_BUCKET)
  );

  try {
    const { uploadUrl, path } = await storage.getMultiUploadUrl(
      record.id,
      documentType,
      filename
    );
    return { uploadUrl, storagePath: path };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to get upload URL" };
  }
}

export async function recordStaffUpload(
  token: string,
  documentType: string,
  storagePath: string,
  filename: string
): Promise<{ success: true } | { error: string }> {
  const record = await resolveStaffToken(token);
  if (!record) return { error: "Invalid or expired link" };

  const supabase = createServiceClient();
  const bucket = supabase.storage.from(DOCUMENTS_BUCKET);

  const result = await recordUpload(record.id, documentType as UploadKind, storagePath, filename, {
    updateRecord: async (id, updates) => {
      const { error } = await supabase
        .from("onboarding_records")
        .update(updates as never)
        .eq("id", id);
      return { error: error?.message ?? null };
    },
    insertDocument: (rid, dtype, path, fname) =>
      new StorageService(supabase, bucket).recordMultiUpload(rid, dtype, path, fname),
  });

  if ("success" in result) {
    revalidatePath(`/onboard/${token}`);
  }
  return result;
}
