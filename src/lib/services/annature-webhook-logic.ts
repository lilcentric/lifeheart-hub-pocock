import type { OnboardingRecord, OnboardingStatus } from "@/lib/types";

export type EnvelopeType = "bundle_a" | "tna" | "fwa";

// Field updates written to an Onboarding Record when an envelope is signed.
// Typed so only real OnboardingRecord status columns can appear here.
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
  | { status: 400; error: string };

// Field updates applied when each envelope type is fully signed.
// bundle_a: Employment Bundle — all six signing documents in one envelope.
// fwa: Flexible Working Agreement — optional envelope sent alongside bundle_a.
// tna: Training Needs Analysis — handled inline (sequential staff + admin signing).
const ENVELOPE_FIELD_UPDATES: Partial<Record<EnvelopeType, EnvelopeFieldUpdate>> = {
  bundle_a: {
    position_description_status: "completed",
    code_of_conduct_status: "completed",
    employment_contract_status: "completed",
    policies_status: "completed",
    conflict_of_interest_status: "completed",
  },
  fwa: {
    flexible_working_status: "completed",
  },
};

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
    await deps.updateRecordFields(recordId, ENVELOPE_FIELD_UPDATES.bundle_a as Record<string, string>);
    await deps.fetchAndStorePdf(recordId, envelopeId, "bundle_a");
  },

  fwa: async ({ recordId, deps }) => {
    await deps.updateRecordFields(recordId, ENVELOPE_FIELD_UPDATES.fwa as Record<string, string>);
  },

  tna: async ({ recordId, signingEvent, deps }) => {
    if (signingEvent === "staff") {
      await deps.updateRecordFields(recordId, {
        tna_staff_signed_at: new Date().toISOString(),
      });
    } else if (signingEvent === "admin") {
      await deps.updateRecordFields(recordId, { tna_status: "completed" });
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
  await handler({
    recordId: found.recordId,
    envelopeId: envelope_id,
    signingEvent: signing_event,
    deps,
  });

  return { status: 200 };
}
