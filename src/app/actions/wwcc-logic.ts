import type { OnboardingStatus } from "@/lib/types";

type UpdateStatus = (
  recordId: string,
  status: OnboardingStatus
) => Promise<{ error: { message: string } | null }>;

type Result = { success: true } | { error: string };

// Sets wwcc_status to in_progress when a staff member indicates they are
// applying for their WWCC via Service NSW (before they have a document to upload).
// File upload (which also sets in_progress) is handled by recordUpload.
export async function executeWwccApplying(
  recordId: string,
  updateStatus: UpdateStatus
): Promise<Result> {
  const { error } = await updateStatus(recordId, "in_progress");
  if (error) return { error: error.message };
  return { success: true };
}
