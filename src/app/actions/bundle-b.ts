"use server";

import { createClient } from "@/lib/supabase/server";
import { executeSendBundleB } from "@/lib/services/annature-logic";
import { validateAnnatureEnv } from "@/lib/services/annature-env";
import { executeSendContractBundle } from "./bundle-b-logic";
import type { SendContractBundleResult } from "./bundle-b-logic";

export async function sendContractBundle(
  recordId: string,
  contractTemplateId: string,
  staffEmail: string
): Promise<SendContractBundleResult> {
  const supabase = await createClient();

  return executeSendContractBundle(recordId, contractTemplateId, staffEmail, {
    async saveContractTemplateId(rId, tmplId) {
      const { error } = await supabase
        .from("onboarding_records")
        .update({ contract_template_id: tmplId })
        .eq("id", rId);
      return { error: error?.message ?? null };
    },

    async sendBundleB(rId, tmplId, email) {
      const envResult = validateAnnatureEnv(process.env);
      if (!envResult.ok) {
        return { error: `Annature env vars not configured: ${envResult.missing.join(", ")}` };
      }
      const { annatureId, annatureKey, accountId, roleId, flexibleWorkingTemplateId, corePolicyTemplateId, highIntensityTemplateId, behaviourSupportTemplateId } = envResult.env;

      return executeSendBundleB(rId, tmplId, email, {
        fetch: globalThis.fetch,
        annatureId,
        annatureKey,
        accountId,
        roleId,
        flexibleWorkingTemplateId,
        corePolicyTemplateId,
        highIntensityTemplateId,
        behaviourSupportTemplateId,
        async getContractAnnatureTemplateId(contractTemplateId) {
          const { data } = await supabase
            .from("contract_templates")
            .select("template_id")
            .eq("id", contractTemplateId)
            .single();
          return (data as { template_id: string } | null)?.template_id ?? null;
        },
        async persistEnvelopeId() {
          // Envelope ID storage not required for Bundle B in current schema
          return { error: null };
        },
      });
    },
  });
}
