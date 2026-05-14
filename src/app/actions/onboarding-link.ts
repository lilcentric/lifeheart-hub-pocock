"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth-guard";
import { TokenService } from "@/lib/token-service";
import { EmailService } from "@/lib/email-service";
import { executeSendAllDocuments } from "@/lib/services/annature-logic";
import { executeSendOnboardingLink } from "./onboarding-link-logic";
import { XeroService } from "@/lib/xero/xero-service";
import { SupabaseXeroTokenStore } from "@/lib/xero/xero-token-store";

type ActionResult = { success: true; annatureWarning?: string; xeroWarning?: string } | { error: string };

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

function createXeroService() {
  const supabase = createServiceClient();
  const tokenStore = new SupabaseXeroTokenStore(supabase);
  const http = {
    post: async (url: string, body: unknown, headers: Record<string, string>) => {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    },
  };
  return new XeroService(
    tokenStore,
    http,
    requireEnv("XERO_TENANT_ID"),
    requireEnv("XERO_CLIENT_ID"),
    requireEnv("XERO_CLIENT_SECRET")
  );
}

export async function sendOnboardingLink(
  recordId: string,
  email: string,
  employmentBundleId: string,
  flexibleWorkingOptedIn: boolean
): Promise<ActionResult> {
  return withRole("officer", async () => {
    const supabase = await createClient();

    const result = await executeSendOnboardingLink(
      recordId,
      email,
      employmentBundleId,
      flexibleWorkingOptedIn,
      {
        generateToken: async (id) => {
          try {
            const token = await TokenService.generate(id);
            return { token, error: null };
          } catch (e) {
            return { token: null, error: (e as Error).message };
          }
        },

        getStaffName: async (id) => {
          const { data } = await supabase
            .from("onboarding_records")
            .select("staff_name")
            .eq("id", id)
            .single();
          return (data as { staff_name: string } | null)?.staff_name ?? "Staff Member";
        },

        sendEmail: async (staffEmail, staffName, token) => {
          try {
            await EmailService.sendOnboardingLink(staffEmail, staffName, token);
          } catch (e) {
            return { error: (e as Error).message };
          }

          // Non-fatal: send reference documents in a separate email
          try {
            const serviceClient = createServiceClient();
            const [handbookResult, silResult] = await Promise.all([
              serviceClient.storage
                .from("staff-docs")
                .createSignedUrl("reference-docs/staff-handbook.pdf", 60 * 60 * 24 * 30),
              serviceClient.storage
                .from("staff-docs")
                .createSignedUrl("reference-docs/sil-voyager-staff-manual.pdf", 60 * 60 * 24 * 30),
            ]);
            if (handbookResult.data?.signedUrl && silResult.data?.signedUrl) {
              await EmailService.sendReferenceDocuments(
                staffEmail,
                staffName,
                handbookResult.data.signedUrl,
                silResult.data.signedUrl
              );
            }
          } catch {
            // Reference docs email is best-effort; do not block onboarding send
          }

          return { error: null };
        },

        sendAllDocuments: async (recId, staffEmail, staffName, bundleId, fwOptedIn) => {
          return executeSendAllDocuments(recId, staffEmail, staffName, bundleId, fwOptedIn, {
            fetch: globalThis.fetch,
            annatureId: requireEnv("ANNATURE_ID"),
            annatureKey: requireEnv("ANNATURE_KEY"),
            accountId: requireEnv("ANNATURE_ACCOUNT_ID"),
            staffRoleId: requireEnv("ANNATURE_STAFF_ROLE_ID"),
            directorRoleId: requireEnv("ANNATURE_DIRECTOR_ROLE_ID"),
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
              recId2,
              envelopeId,
              signingUrl,
              bundleId2,
              fwOptedIn2,
              fwaEnvelopeId,
              fwaSigningUrl
            ) => {
              const { error } = await supabase
                .from("onboarding_records")
                .update({
                  bundle_a_envelope_id: envelopeId,
                  signing_url: signingUrl,
                  employment_bundle_id: bundleId2,
                  flexible_working_opted_in: fwOptedIn2,
                  fwa_envelope_id: fwaEnvelopeId,
                  fwa_signing_url: fwaSigningUrl,
                  flexible_working_status: fwOptedIn2 ? "not_completed" : "na",
                })
                .eq("id", recId2);
              return { error: error?.message ?? null };
            },
          });
        },

        createXeroEmployee: async (name, staffEmail) => {
          try {
            const xero = createXeroService();
            const xeroEmployeeId = await xero.createEmployee(name, staffEmail);
            await supabase
              .from("onboarding_records")
              .update({ xero_employee_id: xeroEmployeeId })
              .eq("id", recordId);
            return { xeroEmployeeId };
          } catch (e) {
            return { error: (e as Error).message };
          }
        },

        // Xero's self-setup invitation is sent 1 hour after the onboarding email to
        // prevent both emails arriving simultaneously. A proper scheduler (pg_cron or
        // Vercel cron) should replace this direct call.
        scheduleXeroInvite: async (xeroEmployeeId) => {
          try {
            const xero = createXeroService();
            await xero.sendSelfSetupInvitation(xeroEmployeeId);
            return { error: null };
          } catch (e) {
            return { error: (e as Error).message };
          }
        },
      }
    );

    revalidatePath(`/onboarding/${recordId}`);
    return result;
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
    const supabase = await createClient();

    let token: string;
    try {
      token = await TokenService.generate(recordId);
    } catch (e) {
      return { error: `Failed to generate token: ${(e as Error).message}` };
    }

    const { data } = await supabase
      .from("onboarding_records")
      .select("staff_name")
      .eq("id", recordId)
      .single();
    const staffName = (data as { staff_name: string } | null)?.staff_name ?? "Staff Member";

    try {
      await EmailService.sendOnboardingLink(email, staffName, token);
    } catch (e) {
      return { error: `Token generated but email failed: ${(e as Error).message}` };
    }

    revalidatePath(`/onboarding/${recordId}`);
    return { success: true };
  });
}
