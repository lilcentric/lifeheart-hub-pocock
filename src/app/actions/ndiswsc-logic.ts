import type { OnboardingStatus, UserRole } from "@/lib/types";
import { canTransitionNdisWsc } from "@/utils/ndiswsc-transitions";

interface TransitionInput {
  recordId: string;
  currentStatus: OnboardingStatus;
  targetStatus: OnboardingStatus;
  userRole: UserRole;
  updateRecord: (
    id: string,
    status: OnboardingStatus
  ) => Promise<{ error: { message: string } | null }>;
}

type TransitionResult = { success: true } | { error: string };

export async function executeNdisWscTransition({
  recordId,
  currentStatus,
  targetStatus,
  userRole,
  updateRecord,
}: TransitionInput): Promise<TransitionResult> {
  if (userRole !== "admin") return { error: "Unauthorised" };
  if (!canTransitionNdisWsc(currentStatus, targetStatus, userRole)) {
    return { error: "Invalid transition" };
  }
  const { error } = await updateRecord(recordId, targetStatus);
  if (error) return { error: error.message };
  return { success: true };
}
