const ANNATURE_BASE = "https://api.annature.com.au";

// ── executeSendAllDocuments ───────────────────────────────────────────────────
// Sends the Employment Bundle envelope (single Annature template that contains
// all core signing documents). Optionally sends a separate FWA envelope when
// flexibleWorkingOptedIn is true.

export interface SendAllDocumentsDeps {
  fetch: typeof globalThis.fetch;
  annatureId: string;
  annatureKey: string;
  accountId: string;
  roleId: string;
  // FWA template ID (env var) — only used when flexibleWorkingOptedIn = true
  flexibleWorkingTemplateId: string;
  // Look up the Annature template ID for the selected Employment Bundle
  getEmploymentBundleAnnatureTemplateId: (bundleId: string) => Promise<string | null>;
  // Persist both envelopes and signing URLs
  persistEnvelopeData: (
    recordId: string,
    envelopeId: string,
    signingUrl: string | null,
    employmentBundleId: string,
    flexibleWorkingOptedIn: boolean,
    fwaEnvelopeId: string | null,
    fwaSigningUrl: string | null
  ) => Promise<{ error: string | null }>;
}

export type SendAllDocumentsResult =
  | { envelopeId: string; signingUrl: string | null; fwaEnvelopeId: string | null; fwaSigningUrl: string | null }
  | { error: string };

export async function executeSendAllDocuments(
  recordId: string,
  staffEmail: string,
  employmentBundleId: string,
  flexibleWorkingOptedIn: boolean,
  deps: SendAllDocumentsDeps
): Promise<SendAllDocumentsResult> {
  const {
    fetch,
    annatureId,
    annatureKey,
    accountId,
    roleId,
    flexibleWorkingTemplateId,
    getEmploymentBundleAnnatureTemplateId,
    persistEnvelopeData,
  } = deps;

  const bundleAnnatureTemplateId = await getEmploymentBundleAnnatureTemplateId(employmentBundleId);
  if (!bundleAnnatureTemplateId) return { error: "Employment Bundle template not found" };

  // POST Employment Bundle envelope
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
        template_ids: [bundleAnnatureTemplateId],
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

  // Fetch the signing URL for the staff member from the envelope details (non-fatal).
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
      // Live test (2026-05-13) confirmed the API returns "recipients", not "signers".
      // "signing_link" is not currently present in GET /v1/envelopes/{id} — signingUrl will
      // remain null until Annature adds a signing-session endpoint or embeds the link here.
      signingUrl = getData?.recipients?.[0]?.signing_link ?? null;
    }
  } catch {
    // Non-fatal — staff can still sign via email link; portal button will show "Awaiting link"
  }

  // Optionally send a separate FWA envelope (non-fatal on failure).
  let fwaEnvelopeId: string | null = null;
  let fwaSigningUrl: string | null = null;
  if (flexibleWorkingOptedIn) {
    try {
      const fwaPostResponse = await fetch(`${ANNATURE_BASE}/v1/envelopes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Annature-Id": annatureId,
          "X-Annature-Key": annatureKey,
        },
        body: JSON.stringify({
          account_id: accountId,
          recipients: [{ role_id: roleId, email: staffEmail }],
          template_ids: [flexibleWorkingTemplateId],
        }),
      });
      if (fwaPostResponse.ok) {
        const fwaPostData = await fwaPostResponse.json();
        fwaEnvelopeId = fwaPostData.id;

        // Fetch FWA signing URL (non-fatal).
        try {
          const fwaGetResponse = await fetch(`${ANNATURE_BASE}/v1/envelopes/${fwaEnvelopeId}`, {
            headers: {
              "X-Annature-Id": annatureId,
              "X-Annature-Key": annatureKey,
            },
          });
          if (fwaGetResponse.ok) {
            const fwaGetData = await fwaGetResponse.json();
            fwaSigningUrl = fwaGetData?.recipients?.[0]?.signing_link ?? null;
          }
        } catch {
          // Non-fatal
        }
      }
    } catch {
      // Non-fatal — bundle already sent
    }
  }

  const { error } = await persistEnvelopeData(
    recordId,
    envelopeId,
    signingUrl,
    employmentBundleId,
    flexibleWorkingOptedIn,
    fwaEnvelopeId,
    fwaSigningUrl
  );
  if (error) return { error };

  return { envelopeId, signingUrl, fwaEnvelopeId, fwaSigningUrl };
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
