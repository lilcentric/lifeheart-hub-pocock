"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { StorageService, STORAGE_BUCKETS } from "@/lib/storage-service";
import { revalidatePath } from "next/cache";
import { recordUpload } from "@/lib/record-upload";

type ActionResult = { success: true } | { error: string };

export async function getNdisWscUploadUrl(
  recordId: string,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  const supabase = createServiceClient();
  const storage = new StorageService(
    supabase,
    supabase.storage.from(STORAGE_BUCKETS.staffPortalSingleUploads)
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

  const result = await recordUpload(recordId, "ndiswsc", storagePath, "", {
    updateRecord: async (id, updates) => {
      const { error } = await supabase
        .from("onboarding_records")
        .update(updates as never)
        .eq("id", id);
      return { error: error?.message ?? null };
    },
    insertDocument: async () => {
      throw new Error("insertDocument called for single-file upload kind");
    },
  });

  if ("success" in result) {
    revalidatePath(`/onboard`);
  }
  return result;
}

export async function markNdisWscApplying(recordId: string): Promise<ActionResult> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("onboarding_records")
    .update({ ndiswsc_status: "in_progress" })
    .eq("id", recordId);
  if (error) return { error: error.message };
  revalidatePath(`/onboard`);
  return { success: true };
}
