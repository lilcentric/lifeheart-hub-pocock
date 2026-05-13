"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { StorageService } from "@/lib/storage-service";
import { SINGLE_UPLOAD_CONFIG } from "@/lib/upload-kind-registry";
import { revalidatePath } from "next/cache";
import { executeWwccApplying, executeWwccUploadComplete } from "./wwcc-logic";

const CONFIG = SINGLE_UPLOAD_CONFIG.wwcc;

type ActionResult = { success: true } | { error: string };

export async function getWwccUploadUrl(
  recordId: string,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  const supabase = createServiceClient();
  const storage = new StorageService(
    supabase,
    supabase.storage.from("onboarding-docs")
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

  const result = await executeWwccUploadComplete(
    recordId,
    storagePath,
    async (id, status) => {
      const { error } = await supabase
        .from("onboarding_records")
        .update({ [CONFIG.statusField]: status })
        .eq("id", id);
      return { error: error ? { message: error.message } : null };
    },
    async (id, _docType, path) => {
      const { error } = await supabase
        .from("onboarding_records")
        .update({ [CONFIG.pathField]: path })
        .eq("id", id);
      return { error: error ? { message: error.message } : null };
    }
  );

  if ("success" in result) {
    revalidatePath(`/onboard`);
  }
  return result;
}

export async function markWwccApplying(recordId: string): Promise<ActionResult> {
  const supabase = createServiceClient();

  const result = await executeWwccApplying(recordId, async (id, status) => {
    const { error } = await supabase
      .from("onboarding_records")
      .update({ [CONFIG.statusField]: status })
      .eq("id", id);
    return { error: error ? { message: error.message } : null };
  });

  if ("success" in result) {
    revalidatePath(`/onboard`);
  }
  return result;
}
