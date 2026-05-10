"use server";

import { createClient } from "@/lib/supabase/server";
import { executeSendBundleB } from "@/lib/services/annature-logic";
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
      const annatureId = process.env.ANNATURE_ID;
      const annatureKey = process.env.ANNATURE_KEY;
      const accountId = process.env.ANNATURE_ACCOUNT_ID;
      const roleId = process.env.ANNATURE_BUNDLE_B_ROLE_ID;
      const flexibleWorkingTemplateId = process.env.ANNATURE_BUNDLE_B_FLEXIBLE_WORKING_TEMPLATE_ID;
      const corePolicyTemplateId = process.env.ANNATURE_BUNDLE_B_CORE_POLICY_TEMPLATE_ID;
      const highIntensityTemplateId = process.env.ANNATURE_BUNDLE_B_HIGH_INTENSITY_TEMPLATE_ID;
      const behaviourSupportTemplateId = process.env.ANNATURE_BUNDLE_B_BEHAVIOUR_SUPPORT_TEMPLATE_ID;

      if (
        !annatureId ||
        !annatureKey ||
        !accountId ||
        !roleId ||
        !flexibleWorkingTemplateId ||
        !corePolicyTemplateId ||
        !highIntensityTemplateId ||
        !behaviourSupportTemplateId
      ) {
        return { error: "Annature Bundle B environment variables not configured" };
      }

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
