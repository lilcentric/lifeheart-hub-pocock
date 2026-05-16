"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { StorageService, STORAGE_BUCKETS } from "@/lib/storage-service";
import { revalidatePath } from "next/cache";
import { recordUpload, makeUploadDeps } from "@/lib/record-upload";

type ActionResult = { success: true } | { error: string };

export async function getWwccUploadUrl(
  recordId: string,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  const supabase = createServiceClient();
  const storage = new StorageService(
    supabase,
    supabase.storage.from(STORAGE_BUCKETS.staffPortalSingleUploads)
  );

  try {
    return await storage.getSingleUploadUrl(recordId, "wwcc", filename);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload URL failed" };
  }
}

export async function markWwccUploaded(
  recordId: string,
  storagePath: string
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const result = await recordUpload(recordId, "wwcc", storagePath, "", makeUploadDeps(supabase));

  if ("success" in result) {
    revalidatePath(`/onboard`);
  }
  return result;
}

export async function markWwccApplying(recordId: string): Promise<ActionResult> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("onboarding_records")
    .update({ wwcc_status: "in_progress" })
    .eq("id", recordId);
  if (error) return { error: error.message };
  revalidatePath(`/onboard`);
  return { success: true };
}
