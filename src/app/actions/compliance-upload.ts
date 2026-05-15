"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth-guard";
import { StorageService, STORAGE_BUCKETS } from "@/lib/storage-service";
import { recordUpload, type UploadKind } from "@/lib/record-upload";
import type { ComplianceDocumentType } from "@/lib/types";

export type { ComplianceDocumentType };

type ActionResult = { success: true } | { error: string };

export async function getComplianceUploadUrl(
  recordId: string,
  documentType: ComplianceDocumentType,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  return withRole("officer", async () => {
    const supabase = await createClient();
    try {
      const storage = supabase.storage.from(STORAGE_BUCKETS.officerCompliance);
      const storageService = new StorageService(supabase as never, storage);
      return await storageService.getSingleUploadUrl(recordId, documentType, filename);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Upload URL failed" };
    }
  });
}

export async function recordComplianceUpload(
  recordId: string,
  documentType: ComplianceDocumentType,
  path: string
): Promise<ActionResult> {
  return withRole("officer", async () => {
    const supabase = await createClient();

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
      revalidatePath(`/onboarding/${recordId}`);
    }
    return result;
  });
}
