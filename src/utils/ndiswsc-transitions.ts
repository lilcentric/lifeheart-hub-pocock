import type { OnboardingStatus, UserRole } from "@/lib/types";

type NdisWscTarget = "pending_verification" | "completed";

const ALLOWED: Array<{ from: OnboardingStatus; to: NdisWscTarget }> = [
  { from: "in_progress", to: "pending_verification" },
  { from: "pending_verification", to: "completed" },
];

export function canTransitionNdisWsc(
  currentStatus: OnboardingStatus,
  targetStatus: OnboardingStatus,
  userRole: UserRole
): boolean {
  if (userRole !== "admin") return false;
  return ALLOWED.some(
    (t) => t.from === currentStatus && t.to === targetStatus
  );
}
