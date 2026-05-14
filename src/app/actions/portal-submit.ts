"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { resolveStaffToken } from "@/lib/token-service";
import { EmailService } from "@/lib/email-service";

type ActionResult = { success: true } | { error: string };

export async function submitPortalCompletion(token: string): Promise<ActionResult> {
  const supabase = createServiceClient();

  const record = await resolveStaffToken(token);
  if (!record) return { error: "Invalid or expired link" };

  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
    record.onboarding_officer
  );
  if (userError || !user?.email) return { error: "Could not find onboarding officer" };

  try {
    await EmailService.sendSubmissionNotification(user.email, record.staff_name, record.id);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
