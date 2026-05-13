"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth-guard";
import { StorageService } from "@/lib/storage-service";
import {
  executeComplianceUpload,
  type ComplianceDocumentType,
} from "./compliance-upload-logic";

type ActionResult = { success: true } | { error: string };

export async function getComplianceUploadUrl(
  recordId: string,
  documentType: ComplianceDocumentType,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  return withRole("officer", async () => {
    const supabase = await createClient();
    try {
      const storage = supabase.storage.from("onboarding-documents");
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

    const result = await executeComplianceUpload(recordId, documentType, path, {
      recordPath: async (id, pathField, storagePath) => {
        const { error } = await supabase
          .from("onboarding_records")
          .update({ [pathField]: storagePath } as never)
          .eq("id", id);
        return { error: error ? { message: error.message } : null };
      },
      updateStatus: async (id, statusField, status) => {
        const { error } = await supabase
          .from("onboarding_records")
          .update({ [statusField]: status })
          .eq("id", id);
        return { error: error ? { message: error.message } : null };
      },
    });

    if ("success" in result) {
      revalidatePath(`/onboarding/${recordId}`);
    }
    return result;
  });
}
