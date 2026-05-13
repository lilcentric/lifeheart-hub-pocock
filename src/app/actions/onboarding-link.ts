"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth-guard";
import { TokenService } from "@/lib/token-service";
import { EmailService } from "@/lib/email-service";
import { executeSendAllDocuments } from "@/lib/services/annature-logic";

type ActionResult = { success: true; annatureWarning?: string } | { error: string };

async function getStaffName(recordId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_records")
    .select("staff_name")
    .eq("id", recordId)
    .single();
  return (data as { staff_name: string } | null)?.staff_name ?? "Staff Member";
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

export async function sendOnboardingLink(
  recordId: string,
  email: string,
  employmentBundleId: string,
  flexibleWorkingOptedIn: boolean
): Promise<ActionResult> {
  return withRole("officer", async () => {
    const supabase = await createClient();

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
      await TokenService.revoke(token).catch(() => {});
      return { error: `Email failed: ${(e as Error).message}` };
    }

    // Send all signing documents via Annature. Failure is a warning — token and
    // email are already dispatched and staff can still access their portal.
    let annatureWarning: string | undefined;
    try {
      const annatureResult = await executeSendAllDocuments(
        recordId,
        email,
        employmentBundleId,
        flexibleWorkingOptedIn,
        {
          fetch: globalThis.fetch,
          annatureId: requireEnv("ANNATURE_ID"),
          annatureKey: requireEnv("ANNATURE_KEY"),
          accountId: requireEnv("ANNATURE_ACCOUNT_ID"),
          roleId: requireEnv("ANNATURE_FWA_ROLE_ID"),
          flexibleWorkingTemplateId: requireEnv("ANNATURE_FLEXIBLE_WORKING_TEMPLATE_ID"),
          getEmploymentBundleAnnatureTemplateId: async (id) => {
            const { data } = await supabase
              .from("employment_bundle_templates")
              .select("annature_template_id")
              .eq("id", id)
              .single();
            return (data as { annature_template_id: string } | null)?.annature_template_id ?? null;
          },
          persistEnvelopeData: async (
            recId,
            envelopeId,
            signingUrl,
            bundleId,
            fwOptedIn,
            fwaEnvelopeId,
            fwaSigningUrl
          ) => {
            const { error } = await supabase
              .from("onboarding_records")
              .update({
                bundle_a_envelope_id: envelopeId,
                signing_url: signingUrl,
                employment_bundle_id: bundleId,
                flexible_working_opted_in: fwOptedIn,
                fwa_envelope_id: fwaEnvelopeId,
                fwa_signing_url: fwaSigningUrl,
                flexible_working_status: fwOptedIn ? "not_completed" : "na",
              })
              .eq("id", recId);
            return { error: error?.message ?? null };
          },
        }
      );
      if ("error" in annatureResult) {
        annatureWarning = annatureResult.error;
      }
    } catch (e) {
      annatureWarning = (e as Error).message;
    }

    revalidatePath(`/onboarding/${recordId}`);
    return annatureWarning ? { success: true, annatureWarning } : { success: true };
  });
}

export async function revokeToken(
  token: string,
  recordId: string
): Promise<ActionResult> {
  return withRole("admin", async () => {
    try {
      await TokenService.revoke(token);
    } catch (e) {
      return { error: (e as Error).message };
    }

    revalidatePath(`/onboarding/${recordId}`);
    return { success: true };
  });
}

export async function resendOnboardingLink(
  recordId: string,
  email: string
): Promise<ActionResult> {
  return withRole("admin", async () => {
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
      await TokenService.revoke(token).catch(() => {});
      return { error: `Email failed: ${(e as Error).message}` };
    }

    revalidatePath(`/onboarding/${recordId}`);
    return { success: true };
  });
}
