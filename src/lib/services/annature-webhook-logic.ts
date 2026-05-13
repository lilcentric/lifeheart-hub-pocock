export type EnvelopeType = "bundle_a" | "tna" | "fwa";

export interface FindRecordResult {
  recordId: string;
  envelopeType: EnvelopeType;
}

export interface AnnatureWebhookDeps {
  webhookSecret: string;
  validateHmac: (rawBody: string, signature: string, secret: string) => boolean;
  findRecordByEnvelopeId: (envelopeId: string) => Promise<FindRecordResult | null>;
  updateRecordFields: (
    recordId: string,
    fields: Record<string, string>
  ) => Promise<{ error: string | null }>;
  fetchAndStorePdf: (
    recordId: string,
    envelopeId: string,
    documentType: string
  ) => Promise<{ error: string | null }>;
}

export interface AnnatureWebhookPayload {
  event: string;
  envelope_id: string;
  signing_event?: string;
}

export type WebhookResult =
  | { status: 200 }
  | { status: 400; error: string };

// Combined envelope — set when all onboarding docs are signed at once.
// bundle_a_envelope_id stores the Employment Bundle envelope ID.
const COMBINED_ENVELOPE_FIELDS: Record<string, string> = {
  position_description_status: "completed",
  code_of_conduct_status: "completed",
  employment_contract_status: "completed",
  policies_status: "completed",
  conflict_of_interest_status: "completed",
};

const FWA_FIELDS: Record<string, string> = {
  flexible_working_status: "completed",
};

export async function executeAnnatureWebhook(
  rawBody: string,
  signature: string,
  deps: AnnatureWebhookDeps
): Promise<WebhookResult> {
  const { webhookSecret, validateHmac, findRecordByEnvelopeId, updateRecordFields, fetchAndStorePdf } = deps;

  if (!validateHmac(rawBody, signature, webhookSecret)) {
    return { status: 400, error: "Invalid signature" };
  }

  const payload: AnnatureWebhookPayload = JSON.parse(rawBody);
  const { envelope_id, signing_event } = payload;

  const found = await findRecordByEnvelopeId(envelope_id);
  if (!found) return { status: 200 };

  const { recordId, envelopeType } = found;

  if (envelopeType === "bundle_a") {
    await updateRecordFields(recordId, COMBINED_ENVELOPE_FIELDS);
    await fetchAndStorePdf(recordId, envelope_id, "bundle_a");
  } else if (envelopeType === "fwa") {
    await updateRecordFields(recordId, FWA_FIELDS);
  } else if (envelopeType === "tna") {
    if (signing_event === "staff") {
      await updateRecordFields(recordId, {
        tna_staff_signed_at: new Date().toISOString(),
      });
    } else if (signing_event === "admin") {
      await updateRecordFields(recordId, { tna_status: "completed" });
    }
  }

  return { status: 200 };
}
