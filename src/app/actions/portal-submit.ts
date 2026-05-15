"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { resolveStaffToken } from "@/lib/token-service";
import { EmailService } from "@/lib/email-service";
import { getPortalItems } from "@/utils/portal-items";

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  not_completed: "Not Completed",
  not_received: "Not Received",
  not_signed: "Not Signed",
  in_progress: "In Progress",
  pending_verification: "Pending Verification",
  na: "N/A",
};

type ActionResult = { success: true } | { error: string };

export async function submitPortalCompletion(token: string): Promise<ActionResult> {
  const supabase = createServiceClient();

  const record = await resolveStaffToken(token);
  if (!record) return { error: "Invalid or expired link" };

  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
    record.onboarding_officer
  );
  if (userError || !user?.email) return { error: "Could not find onboarding officer" };

  const snapshot = getPortalItems(record, token).map((item) => ({
    label: item.label,
    status: STATUS_LABELS[item.status] ?? item.status,
  }));

  try {
    await EmailService.sendSubmissionNotification(user.email, record.staff_name, record.id, snapshot);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
