import type { OnboardingRecord, OnboardingStatus } from "@/lib/types";
import { getEnvelopeFieldUpdates } from "@/lib/onboarding-status-fields";

export type EnvelopeType = "bundle_a" | "tna" | "fwa";

type EnvelopeFieldUpdate = Partial<Record<keyof OnboardingRecord, OnboardingStatus>>;

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
  | { status: 400; error: string }
  | { status: 500; error: string };

// Field updates derived from the registry at module load — adding a field to an
// envelope in the registry automatically appears here without editing this file.
// TNA is excluded: its sequential staff/admin signing is handled inline below.
const BUNDLE_A_UPDATES = getEnvelopeFieldUpdates("bundle_a") as Record<string, string>;
const FWA_UPDATES = getEnvelopeFieldUpdates("fwa") as Record<string, string>;

type EnvelopeHandler = (params: {
  recordId: string;
  envelopeId: string;
  signingEvent: string | undefined;
  deps: Pick<AnnatureWebhookDeps, "updateRecordFields" | "fetchAndStorePdf">;
}) => Promise<void>;

// Exhaustiveness-checked dispatch table: adding a new EnvelopeType without
// adding a handler here is a compile error.
const ENVELOPE_HANDLERS: Record<EnvelopeType, EnvelopeHandler> = {
  bundle_a: async ({ recordId, envelopeId, deps }) => {
    const { error: updateError } = await deps.updateRecordFields(recordId, BUNDLE_A_UPDATES);
    if (updateError) throw new Error(updateError);
    const { error: pdfError } = await deps.fetchAndStorePdf(recordId, envelopeId, "bundle_a");
    if (pdfError) throw new Error(pdfError);
  },

  fwa: async ({ recordId, deps }) => {
    const { error } = await deps.updateRecordFields(recordId, FWA_UPDATES);
    if (error) throw new Error(error);
  },

  tna: async ({ recordId, signingEvent, deps }) => {
    if (signingEvent === "staff") {
      const { error } = await deps.updateRecordFields(recordId, {
        tna_staff_signed_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);
    } else if (signingEvent === "admin") {
      const { error } = await deps.updateRecordFields(recordId, { tna_status: "completed" });
      if (error) throw new Error(error);
    }
  },
};

export async function executeAnnatureWebhook(
  rawBody: string,
  signature: string,
  deps: AnnatureWebhookDeps
): Promise<WebhookResult> {
  const { webhookSecret, validateHmac, findRecordByEnvelopeId } = deps;

  if (!validateHmac(rawBody, signature, webhookSecret)) {
    return { status: 400, error: "Invalid signature" };
  }

  const payload: AnnatureWebhookPayload = JSON.parse(rawBody);
  const { envelope_id, signing_event } = payload;

  const found = await findRecordByEnvelopeId(envelope_id);
  if (!found) return { status: 200 };

  const handler = ENVELOPE_HANDLERS[found.envelopeType];
  try {
    await handler({
      recordId: found.recordId,
      envelopeId: envelope_id,
      signingEvent: signing_event,
      deps,
    });
  } catch (err) {
    return { status: 500, error: err instanceof Error ? err.message : "Internal error" };
  }

  return { status: 200 };
}

// Exported for tests that need to inspect the derived field maps.
export { BUNDLE_A_UPDATES, FWA_UPDATES };
export type { EnvelopeFieldUpdate };
