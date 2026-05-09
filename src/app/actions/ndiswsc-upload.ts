"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { StorageService } from "@/lib/storage-service";
import { revalidatePath } from "next/cache";
import { executeNdisWscApplying, executeNdisWscUploadComplete } from "./ndiswsc-upload-logic";

type ActionResult = { success: true } | { error: string };

export async function getNdisWscUploadUrl(
  recordId: string,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  const supabase = createServiceClient();
  const storage = new StorageService(
    supabase,
    supabase.storage.from("onboarding-docs")
  );

  try {
    return await storage.getSingleUploadUrl(recordId, "ndiswsc", filename);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload URL failed" };
  }
}

export async function markNdisWscUploaded(
  recordId: string,
  storagePath: string
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const result = await executeNdisWscUploadComplete(
    recordId,
    storagePath,
    async (id, status) => {
      const { error } = await supabase
        .from("onboarding_records")
        .update({ ndiswsc_status: status })
        .eq("id", id);
      return { error: error ? { message: error.message } : null };
    },
    async (id, _docType, path) => {
      const { error } = await supabase
        .from("onboarding_records")
        .update({ ndiswsc_storage_path: path })
        .eq("id", id);
      return { error: error ? { message: error.message } : null };
    }
  );

  if ("success" in result) {
    revalidatePath(`/onboard`);
  }
  return result;
}

export async function markNdisWscApplying(recordId: string): Promise<ActionResult> {
  const supabase = createServiceClient();

  const result = await executeNdisWscApplying(recordId, async (id, status) => {
    const { error } = await supabase
      .from("onboarding_records")
      .update({ ndiswsc_status: status })
      .eq("id", id);
    return { error: error ? { message: error.message } : null };
  });

  if ("success" in result) {
    revalidatePath(`/onboard`);
  }
  return result;
}
