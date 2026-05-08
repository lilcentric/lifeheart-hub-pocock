"use server";

import { createClient } from "@/lib/supabase/server";
import { executeSendBundleA } from "@/lib/services/annature-logic";
import { executeSendOnboardingLink } from "./onboarding-link-logic";

// TODO: wire up TokenService.generate when issue #7 is built
async function generateToken(
  recordId: string
): Promise<{ token: string; error: null } | { token: null; error: string }> {
  throw new Error(`TokenService not yet implemented (issue #7) — recordId: ${recordId}`);
}

// TODO: wire up EmailService.send when issue #7 is built
async function sendEmail(
  staffEmail: string,
  token: string
): Promise<{ error: string | null }> {
  throw new Error(`EmailService not yet implemented (issue #7) — email: ${staffEmail}, token: ${token}`);
}

function makeSendBundleA(supabase: Awaited<ReturnType<typeof createClient>>) {
  return (recordId: string, staffEmail: string) =>
    executeSendBundleA(recordId, staffEmail, {
      fetch: globalThis.fetch,
      annatureId: process.env.ANNATURE_ID!,
      annatureKey: process.env.ANNATURE_KEY!,
      accountId: process.env.ANNATURE_ACCOUNT_ID!,
      templateId: process.env.ANNATURE_BUNDLE_A_TEMPLATE_ID!,
      roleId: process.env.ANNATURE_BUNDLE_A_ROLE_ID!,
      persistEnvelopeId: async (id, envelopeId) => {
        const { error } = await supabase
          .from("onboarding_records")
          .update({ annature_envelope_id: envelopeId })
          .eq("id", id);
        return { error: error ? error.message : null };
      },
    });
}

export async function sendOnboardingLink(
  recordId: string,
  staffEmail: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorised" };

  return executeSendOnboardingLink(recordId, staffEmail, {
    generateToken,
    sendEmail,
    sendBundleA: makeSendBundleA(supabase),
  });
}
