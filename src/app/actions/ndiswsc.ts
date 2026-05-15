"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth-guard";
import type { OnboardingStatus } from "@/lib/types";
import { canTransitionNdisWsc } from "@/utils/ndiswsc-transitions";

type ActionResult = { success: true } | { error: string };

export async function markNdisWscAsPendingVerification(
  recordId: string,
  currentStatus: OnboardingStatus
): Promise<ActionResult> {
  return _updateNdisWsc(recordId, currentStatus, "pending_verification");
}

export async function markNdisWscAsCleared(
  recordId: string,
  currentStatus: OnboardingStatus
): Promise<ActionResult> {
  return _updateNdisWsc(recordId, currentStatus, "completed");
}

async function _updateNdisWsc(
  recordId: string,
  currentStatus: OnboardingStatus,
  targetStatus: OnboardingStatus
): Promise<ActionResult> {
  return withRole("officer", async (ctx) => {
    if (ctx.role !== "admin") return { error: "Unauthorised" };
    if (!canTransitionNdisWsc(currentStatus, targetStatus, ctx.role)) {
      return { error: "Invalid transition" };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("onboarding_records")
      .update({ ndiswsc_status: targetStatus })
      .eq("id", recordId);
    if (error) return { error: error.message };

    revalidatePath(`/onboarding/${recordId}`);
    return { success: true };
  });
}
