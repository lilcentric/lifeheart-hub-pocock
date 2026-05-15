"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { resolveStaffToken } from "@/lib/token-service";
import { EmailService } from "@/lib/email-service";
import { getPortalItems } from "@/utils/portal-items";
import type { OnboardingStatus } from "@/lib/types";

type ActionResult = { success: true } | { error: string };

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  completed: "Completed",
  not_completed: "Not Completed",
  not_received: "Not Received",
  not_signed: "Not Signed",
  in_progress: "In Progress",
  pending_verification: "Pending Verification",
  na: "N/A",
};

export async function submitPortalCompletion(token: string): Promise<ActionResult> {
  const supabase = createServiceClient();

  const record = await resolveStaffToken(token);
  if (!record) return { error: "Invalid or expired link" };

  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
    record.onboarding_officer
  );
  if (userError || !user?.email) return { error: "Could not find onboarding officer" };

  const snapshot = getPortalItems(record, token).map(({ label, status }) => ({
    label,
    status: STATUS_LABELS[status] ?? status,
  }));

  try {
    await EmailService.sendSubmissionNotification(user.email, record.staff_name, record.id, snapshot);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
