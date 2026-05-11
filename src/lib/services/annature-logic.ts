const ANNATURE_BASE = "https://api.annature.com.au";

// ── executeSendAllDocuments ───────────────────────────────────────────────────
// Sends all onboarding signing documents in a single Annature envelope.
// Replaces the separate Bundle A + Bundle B flows.

export interface SendAllDocumentsDeps {
  fetch: typeof globalThis.fetch;
  annatureId: string;
  annatureKey: string;
  accountId: string;
  roleId: string;
  // Fixed template IDs (from env vars)
  conflictOfInterestTemplateId: string;
  corePolicyTemplateId: string;
  highIntensityTemplateId: string;
  behaviourSupportTemplateId: string;
  flexibleWorkingTemplateId: string;
  // DB lookups
  getPdCocAnnatureTemplateId: (pdCocTemplateId: string) => Promise<string | null>;
  getContractAnnatureTemplateId: (contractTemplateId: string) => Promise<string | null>;
  // Persistence
  persistEnvelopeData: (
    recordId: string,
    envelopeId: string,
    signingUrl: string | null,
    pdCocTemplateId: string,
    flexibleWorkingOptedIn: boolean
  ) => Promise<{ error: string | null }>;
}

export type SendAllDocumentsResult =
  | { envelopeId: string; signingUrl: string | null }
  | { error: string };

export async function executeSendAllDocuments(
  recordId: string,
  staffEmail: string,
  pdCocTemplateId: string,
  contractTemplateId: string,
  flexibleWorkingOptedIn: boolean,
  deps: SendAllDocumentsDeps
): Promise<SendAllDocumentsResult> {
  const {
    fetch,
    annatureId,
    annatureKey,
    accountId,
    roleId,
    conflictOfInterestTemplateId,
    corePolicyTemplateId,
    highIntensityTemplateId,
    behaviourSupportTemplateId,
    flexibleWorkingTemplateId,
    getPdCocAnnatureTemplateId,
    getContractAnnatureTemplateId,
    persistEnvelopeData,
  } = deps;

  const pdCocAnnId = await getPdCocAnnatureTemplateId(pdCocTemplateId);
  if (!pdCocAnnId) return { error: "PD & CoC template not found" };

  const contractAnnId = await getContractAnnatureTemplateId(contractTemplateId);
  if (!contractAnnId) return { error: "Contract template not found" };

  const templateIds = [
    pdCocAnnId,
    contractAnnId,
    conflictOfInterestTemplateId,
    corePolicyTemplateId,
    highIntensityTemplateId,
    behaviourSupportTemplateId,
    ...(flexibleWorkingOptedIn ? [flexibleWorkingTemplateId] : []),
  ];

  let postResponse: Response;
  try {
    postResponse = await fetch(`${ANNATURE_BASE}/v1/envelopes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Annature-Id": annatureId,
        "X-Annature-Key": annatureKey,
      },
      body: JSON.stringify({
        account_id: accountId,
        recipients: [{ role_id: roleId, email: staffEmail }],
        template_ids: templateIds,
      }),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }

  if (!postResponse.ok) {
    return { error: `Annature API error: ${postResponse.status}` };
  }

  const postData = await postResponse.json();
  const envelopeId: string = postData.id;

  // Fetch the signing URL for the staff member from the envelope details.
  // Field name (signers[0].signing_link) must be verified against Annature API docs.
  let signingUrl: string | null = null;
  try {
    const getResponse = await fetch(`${ANNATURE_BASE}/v1/envelopes/${envelopeId}`, {
      headers: {
        "X-Annature-Id": annatureId,
        "X-Annature-Key": annatureKey,
      },
    });
    if (getResponse.ok) {
      const getData = await getResponse.json();
      signingUrl = getData?.signers?.[0]?.signing_link ?? null;
    }
  } catch {
    // Non-fatal — staff can still sign via email link; portal button will show "Awaiting link"
  }

  const { error } = await persistEnvelopeData(
    recordId,
    envelopeId,
    signingUrl,
    pdCocTemplateId,
    flexibleWorkingOptedIn
  );
  if (error) return { error };

  return { envelopeId, signingUrl };
}


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
