"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { StorageService, STORAGE_BUCKETS } from "@/lib/storage-service";
import { recordUpload, type UploadKind } from "@/lib/record-upload";
import { revalidatePath } from "next/cache";
import type { ComplianceDocumentType } from "@/lib/types";

type ActionResult = { success: true } | { error: string };

export async function getPortalUploadUrl(
  recordId: string,
  documentType: ComplianceDocumentType,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  const supabase = createServiceClient();
  const storage = new StorageService(
    supabase,
    supabase.storage.from(STORAGE_BUCKETS.officerCompliance)
  );
  try {
    return await storage.getSingleUploadUrl(recordId, documentType, filename);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload URL failed" };
  }
}

export async function recordPortalUpload(
  recordId: string,
  documentType: ComplianceDocumentType,
  path: string
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const result = await recordUpload(recordId, documentType as UploadKind, path, "", {
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
