import type { OnboardingStatus, UserRole } from "@/lib/types";

// Complete NDISWSC state machine. Every transition — staff and admin — is declared here.
// Staff-initiated transitions are triggered by token-based portal actions (no UserRole check).
// Admin-initiated transitions require UserRole === "admin".

type Actor = "staff" | "admin";

type Transition = {
  from: OnboardingStatus;
  to: OnboardingStatus;
  actor: Actor;
  label: string;
};

const TRANSITIONS: Transition[] = [
  // Staff-initiated: "I'm applying" button or document upload both produce this transition
  { from: "not_completed", to: "in_progress", actor: "staff", label: "I'm applying" },
  // Admin-initiated
  { from: "in_progress", to: "pending_verification", actor: "admin", label: "Mark as Pending Verification" },
  { from: "pending_verification", to: "completed", actor: "admin", label: "Mark as Cleared" },
];

export function canTransitionNdisWsc(
  currentStatus: OnboardingStatus,
  targetStatus: OnboardingStatus,
  userRole: UserRole
): boolean {
  if (userRole !== "admin") return false;
  return TRANSITIONS.some(
    (t) => t.actor === "admin" && t.from === currentStatus && t.to === targetStatus
  );
}

// Returns the admin action buttons available for a given NDISWSC status.
// The component derives its button set from this — no hardcoded status comparisons.
export function getAdminNdisWscActions(
  currentStatus: OnboardingStatus
): Array<{ targetStatus: OnboardingStatus; label: string }> {
  return TRANSITIONS
    .filter((t) => t.actor === "admin" && t.from === currentStatus)
    .map((t) => ({ targetStatus: t.to, label: t.label }));
}
