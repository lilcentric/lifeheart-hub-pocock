"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { StorageService } from "@/lib/storage-service";
import { revalidatePath } from "next/cache";
import { recordUpload, type UploadKind } from "@/lib/record-upload";
import type { ComplianceDocumentType } from "./compliance-upload-logic";

export async function getPortalComplianceUploadUrl(
  recordId: string,
  documentType: ComplianceDocumentType,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> {
  const supabase = createServiceClient();
  const storage = new StorageService(
    supabase,
    supabase.storage.from("onboarding-docs")
  );
  try {
    return await storage.getSingleUploadUrl(recordId, documentType, filename);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload URL failed" };
  }
}

export async function recordPortalComplianceUpload(
  recordId: string,
  documentType: ComplianceDocumentType,
  path: string
): Promise<{ success: true } | { error: string }> {
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
    revalidatePath("/onboard");
  }
  return result;
}
