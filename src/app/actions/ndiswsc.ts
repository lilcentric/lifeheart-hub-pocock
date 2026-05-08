"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OnboardingStatus, Profile } from "@/lib/types";
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorised" };

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profile = rawProfile as Pick<Profile, "role"> | null;
  if (!profile) return { error: "Unauthorised" };

  const result = await executeNdisWscTransition({
    recordId,
    currentStatus,
    targetStatus,
    userRole: profile.role,
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
}
