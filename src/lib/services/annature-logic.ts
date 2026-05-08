const ANNATURE_BASE = "https://api.annature.com.au";

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
