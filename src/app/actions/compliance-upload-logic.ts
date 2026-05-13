import { SINGLE_UPLOAD_CONFIG } from "@/lib/upload-kind-registry";

export type ComplianceDocumentType =
  | "identity_right_to_work"
  | "ndis_orientation"
  | "car_insurance"
  | "additional_training";

const VALID_TYPES = new Set<string>(["identity_right_to_work", "ndis_orientation", "car_insurance", "additional_training"]);

export interface ComplianceUploadDeps {
  recordPath: (
    recordId: string,
    pathField: string,
    path: string
  ) => Promise<{ error: { message: string } | null }>;
  updateStatus: (
    recordId: string,
    statusField: string,
    status: "completed"
  ) => Promise<{ error: { message: string } | null }>;
}

type UploadResult = { success: true } | { error: string };

export async function executeComplianceUpload(
  recordId: string,
  documentType: ComplianceDocumentType,
  path: string,
  deps: ComplianceUploadDeps
): Promise<UploadResult> {
  if (!VALID_TYPES.has(documentType)) {
    return { error: "Invalid document type" };
  }

  const config = SINGLE_UPLOAD_CONFIG[documentType];

  const pathResult = await deps.recordPath(recordId, config.pathField, path);
  if (pathResult.error) return { error: pathResult.error.message };

  const statusResult = await deps.updateStatus(recordId, config.statusField, "completed");
  if (statusResult.error) return { error: statusResult.error.message };

  return { success: true };
}
