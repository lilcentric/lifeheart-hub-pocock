"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth-guard";
import type { OnboardingStatus } from "@/lib/types";
import { executeNdisWscTransition } from "./ndiswsc-logic";

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
    const supabase = await createClient();

    const result = await executeNdisWscTransition({
      recordId,
      currentStatus,
      targetStatus,
      userRole: ctx.role,
      updateRecord: async (id, status) => {
        const { error } = await supabase
          .from("onboarding_records")
          .update({ ndiswsc_status: status })
          .eq("id", id);
        return { error: error ? { message: error.message } : null };
      },
    });

    if ("success" in result) {
      revalidatePath(`/onboarding/${recordId}`);
    }
    return result;
  });
}
