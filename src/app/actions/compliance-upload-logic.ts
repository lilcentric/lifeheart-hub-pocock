import type { OnboardingStatus } from "@/lib/types";

export type ComplianceDocumentType =
  | "identity_right_to_work"
  | "ndis_orientation"
  | "car_insurance";

const DOCUMENT_STATUS_FIELDS: Record<ComplianceDocumentType, string> = {
  identity_right_to_work: "identity_right_to_work_status",
  ndis_orientation: "ndis_orientation_status",
  car_insurance: "car_insurance_status",
};

const VALID_TYPES = new Set<string>(Object.keys(DOCUMENT_STATUS_FIELDS));

export interface ComplianceUploadDeps {
  recordPath: (
    recordId: string,
    documentType: string,
    path: string
  ) => Promise<{ error: { message: string } | null }>;
  updateStatus: (
    recordId: string,
    statusField: string,
    status: OnboardingStatus
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

  const pathResult = await deps.recordPath(recordId, documentType, path);
  if (pathResult.error) return { error: pathResult.error.message };

  const statusField = DOCUMENT_STATUS_FIELDS[documentType];
  const statusResult = await deps.updateStatus(recordId, statusField, "completed");
  if (statusResult.error) return { error: statusResult.error.message };

  return { success: true };
}
