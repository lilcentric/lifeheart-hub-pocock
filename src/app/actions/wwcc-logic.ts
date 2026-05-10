import type { OnboardingStatus } from "@/lib/types";

type UpdateStatus = (
  recordId: string,
  status: OnboardingStatus
) => Promise<{ error: { message: string } | null }>;

type RecordUpload = (
  recordId: string,
  documentType: string,
  path: string
) => Promise<{ error: { message: string } | null }>;

type Result = { success: true } | { error: string };

export async function executeWwccApplying(
  recordId: string,
  updateStatus: UpdateStatus
): Promise<Result> {
  const { error } = await updateStatus(recordId, "in_progress");
  if (error) return { error: error.message };
  return { success: true };
}

export async function executeWwccUploadComplete(
  recordId: string,
  path: string,
  updateStatus: UpdateStatus,
  recordUpload: RecordUpload
): Promise<Result> {
  const uploadResult = await recordUpload(recordId, "wwcc", path);
  if (uploadResult.error) return { error: uploadResult.error.message };

  const statusResult = await updateStatus(recordId, "in_progress");
  if (statusResult.error) return { error: statusResult.error.message };

  return { success: true };
}
