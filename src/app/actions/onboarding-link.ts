"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile } from "@/lib/types";
import { TokenService } from "@/lib/token-service";
import { EmailService } from "@/lib/email-service";

type ActionResult = { success: true } | { error: string };

async function getAuthorisedRole(
  minRole: "officer" | "admin"
): Promise<{ role: Profile["role"] } | { error: string }> {
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

  if (minRole === "admin" && profile.role !== "admin") return { error: "Admin only" };
  if (minRole === "officer" && !["admin", "officer"].includes(profile.role))
    return { error: "Unauthorised" };

  return { role: profile.role };
}

async function getStaffName(recordId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_records")
    .select("staff_name")
    .eq("id", recordId)
    .single();
  return (data as { staff_name: string } | null)?.staff_name ?? "Staff Member";
}

export async function sendOnboardingLink(
  recordId: string,
  email: string
): Promise<ActionResult> {
  const auth = await getAuthorisedRole("officer");
  if ("error" in auth) return auth;

  let token: string;
  try {
    token = await TokenService.generate(recordId);
  } catch (e) {
    return { error: `Failed to generate token: ${(e as Error).message}` };
  }

  const staffName = await getStaffName(recordId);

  try {
    await EmailService.sendOnboardingLink(email, staffName, token);
  } catch (e) {
    return { error: `Token generated but email failed: ${(e as Error).message}` };
  }

  revalidatePath(`/onboarding/${recordId}`);
  return { success: true };
}

export async function revokeToken(
  token: string,
  recordId: string
): Promise<ActionResult> {
  const auth = await getAuthorisedRole("admin");
  if ("error" in auth) return auth;

  try {
    await TokenService.revoke(token);
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath(`/onboarding/${recordId}`);
  return { success: true };
}

export async function resendOnboardingLink(
  recordId: string,
  email: string
): Promise<ActionResult> {
  const auth = await getAuthorisedRole("admin");
  if ("error" in auth) return auth;

  let token: string;
  try {
    token = await TokenService.generate(recordId);
  } catch (e) {
    return { error: `Failed to generate token: ${(e as Error).message}` };
  }

  const staffName = await getStaffName(recordId);

  try {
    await EmailService.sendOnboardingLink(email, staffName, token);
  } catch (e) {
    return { error: `Token generated but email failed: ${(e as Error).message}` };
  }

  revalidatePath(`/onboarding/${recordId}`);
  return { success: true };
}
