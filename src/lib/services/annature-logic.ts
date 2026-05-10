const ANNATURE_BASE = "https://api.annature.com.au";

export interface SendBundleBDeps {
  fetch: typeof globalThis.fetch;
  annatureId: string;
  annatureKey: string;
  accountId: string;
  roleId: string;
  flexibleWorkingTemplateId: string;
  corePolicyTemplateId: string;
  highIntensityTemplateId: string;
  behaviourSupportTemplateId: string;
  getContractAnnatureTemplateId: (contractTemplateId: string) => Promise<string | null>;
  persistEnvelopeId: (
    recordId: string,
    envelopeId: string
  ) => Promise<{ error: string | null }>;
}

export type SendBundleBResult =
  | { envelopeId: string }
  | { error: string };

export async function executeSendBundleB(
  recordId: string,
  contractTemplateId: string,
  staffEmail: string,
  deps: SendBundleBDeps
): Promise<SendBundleBResult> {
  const {
    fetch,
    annatureId,
    annatureKey,
    accountId,
    roleId,
    flexibleWorkingTemplateId,
    corePolicyTemplateId,
    highIntensityTemplateId,
    behaviourSupportTemplateId,
    getContractAnnatureTemplateId,
    persistEnvelopeId,
  } = deps;

  const contractAnnatureTemplateId = await getContractAnnatureTemplateId(contractTemplateId);
  if (!contractAnnatureTemplateId) return { error: "Contract template not found" };

  let response: Response;
  try {
    response = await fetch(`${ANNATURE_BASE}/v1/envelopes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Annature-Id": annatureId,
        "X-Annature-Key": annatureKey,
      },
      body: JSON.stringify({
        account_id: accountId,
        recipients: [{ role_id: roleId, email: staffEmail }],
        template_ids: [
          contractAnnatureTemplateId,
          flexibleWorkingTemplateId,
          corePolicyTemplateId,
          highIntensityTemplateId,
          behaviourSupportTemplateId,
        ],
      }),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }

  if (!response.ok) {
    return { error: `Annature API error: ${response.status}` };
  }

  const data = await response.json();
  const envelopeId: string = data.id;

  const { error } = await persistEnvelopeId(recordId, envelopeId);
  if (error) return { error };

  return { envelopeId };
}

export interface SendBundleADeps {
  fetch: typeof globalThis.fetch;
  annatureId: string;
  annatureKey: string;
  accountId: string;
  templateId: string;
  roleId: string;
  persistEnvelopeId: (
    recordId: string,
    envelopeId: string
  ) => Promise<{ error: string | null }>;
}

export type SendBundleAResult =
  | { envelopeId: string }
  | { error: string };

export async function executeSendBundleA(
  recordId: string,
  staffEmail: string,
  deps: SendBundleADeps
): Promise<SendBundleAResult> {
  const { fetch, annatureId, annatureKey, accountId, templateId, roleId, persistEnvelopeId } = deps;

  let response: Response;
  try {
    response = await fetch(
      `${ANNATURE_BASE}/v1/templates/${templateId}/use`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Annature-Id": annatureId,
          "X-Annature-Key": annatureKey,
        },
        body: JSON.stringify({
          account_id: accountId,
          recipients: [{ role_id: roleId, email: staffEmail }],
        }),
      }
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }

  if (!response.ok) {
    return { error: `Annature API error: ${response.status}` };
  }

  const data = await response.json();
  const envelopeId: string = data.id;

  const { error } = await persistEnvelopeId(recordId, envelopeId);
  if (error) return { error };

  return { envelopeId };
}
