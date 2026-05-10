"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { validateToken } from "@/lib/token-service";
import { StorageService } from "@/lib/storage-service";
import { recordMultiUploadAndUpdateStatus } from "./multi-upload-logic";
import { revalidatePath } from "next/cache";

const DOCUMENTS_BUCKET = "documents";

async function resolveRecord(token: string) {
  const supabase = createServiceClient();
  return validateToken(token, {
    lookupToken: (t: string) =>
      supabase
        .from("onboarding_tokens")
        .select("*")
        .eq("id", t)
        .maybeSingle()
        .then((res) => ({ data: res.data as never, error: res.error })),
    getRecord: (recordId: string) =>
      supabase
        .from("onboarding_records")
        .select("*")
        .eq("id", recordId)
        .maybeSingle()
        .then((res) => ({ data: res.data as never, error: res.error })),
  });
}

export async function getStaffUploadUrl(
  token: string,
  documentType: string,
  filename: string
): Promise<{ uploadUrl: string; storagePath: string } | { error: string }> {
  const record = await resolveRecord(token);
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
  const record = await resolveRecord(token);
  if (!record) return { error: "Invalid or expired link" };

  const supabase = createServiceClient();
  const storage = supabase.storage.from(DOCUMENTS_BUCKET);

  const result = await recordMultiUploadAndUpdateStatus(
    record.id,
    documentType,
    storagePath,
    filename,
    {
      recordDocument: (rid, dtype, path, fname) =>
        new StorageService(supabase, storage).recordMultiUpload(rid, dtype, path, fname),
      setStatus: async (rid, statusField, status) => {
        const { error } = await supabase
          .from("onboarding_records")
          .update({ [statusField]: status } as never)
          .eq("id", rid);
        if (error) throw new Error((error as { message: string }).message);
      },
    }
  );

  if ("success" in result) {
    revalidatePath(`/onboard/${token}`);
  }
  return result;
}
