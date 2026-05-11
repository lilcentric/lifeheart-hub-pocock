import { describe, it, expect, vi } from "vitest";
import { executeAnnatureWebhook } from "./annature-webhook-logic";
import type { AnnatureWebhookDeps } from "./annature-webhook-logic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDeps(overrides: Partial<AnnatureWebhookDeps> = {}): AnnatureWebhookDeps {
  return {
    webhookSecret: "test-secret",
    validateHmac: vi.fn().mockReturnValue(true),
    findRecordByEnvelopeId: vi.fn().mockResolvedValue(null),
    updateRecordFields: vi.fn().mockResolvedValue({ error: null }),
    fetchAndStorePdf: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

function makePayload(envelopeId = "env-001", signingEvent?: string) {
  return JSON.stringify({
    event: "envelope.completed",
    envelope_id: envelopeId,
    ...(signingEvent ? { signing_event: signingEvent } : {}),
  });
}

// ---------------------------------------------------------------------------
// HMAC validation
// ---------------------------------------------------------------------------

describe("executeAnnatureWebhook — HMAC validation", () => {
  it("rejects requests with an invalid HMAC signature with status 400", async () => {
    const deps = makeDeps({ validateHmac: vi.fn().mockReturnValue(false) });

    const result = await executeAnnatureWebhook(
      makePayload(),
      "bad-signature",
      deps
    );

    expect(result).toEqual({ status: 400, error: "Invalid signature" });
    expect(deps.findRecordByEnvelopeId).not.toHaveBeenCalled();
    expect(deps.updateRecordFields).not.toHaveBeenCalled();
  });

  it("passes rawBody, signature, and secret to validateHmac", async () => {
    const mockValidate = vi.fn().mockReturnValue(true);
    const deps = makeDeps({
      webhookSecret: "my-secret",
      validateHmac: mockValidate,
      findRecordByEnvelopeId: vi.fn().mockResolvedValue(null),
    });
    const rawBody = makePayload("env-002");

    await executeAnnatureWebhook(rawBody, "sig-abc", deps);

    expect(mockValidate).toHaveBeenCalledWith(rawBody, "sig-abc", "my-secret");
  });
});

// ---------------------------------------------------------------------------
// Combined envelope (stored as bundle_a_envelope_id)
// ---------------------------------------------------------------------------

describe("executeAnnatureWebhook — combined envelope (bundle_a)", () => {
  it("updates all 5 signing statuses to completed", async () => {
    const deps = makeDeps({
      findRecordByEnvelopeId: vi.fn().mockResolvedValue({
        recordId: "LF-HDC-00001",
        envelopeType: "bundle_a",
      }),
    });

    const result = await executeAnnatureWebhook(
      makePayload("env-combined"),
      "valid-sig",
      deps
    );

    expect(result).toEqual({ status: 200 });
    expect(deps.updateRecordFields).toHaveBeenCalledWith("LF-HDC-00001", {
      position_description_status: "completed",
      code_of_conduct_status: "completed",
      employment_contract_status: "completed",
      policies_status: "completed",
      conflict_of_interest_status: "completed",
    });
  });

  it("fetches and stores the signed PDF", async () => {
    const deps = makeDeps({
      findRecordByEnvelopeId: vi.fn().mockResolvedValue({
        recordId: "LF-HDC-00001",
        envelopeType: "bundle_a",
      }),
    });

    await executeAnnatureWebhook(makePayload("env-combined"), "valid-sig", deps);

    expect(deps.fetchAndStorePdf).toHaveBeenCalledWith(
      "LF-HDC-00001",
      "env-combined",
      "bundle_a"
    );
  });
});

// ---------------------------------------------------------------------------
// Bundle B (legacy path — no longer sent for new records)
// ---------------------------------------------------------------------------

describe("executeAnnatureWebhook — Bundle B (legacy)", () => {
  it("updates employment_contract_status to completed for in-flight legacy envelopes", async () => {
    const deps = makeDeps({
      findRecordByEnvelopeId: vi.fn().mockResolvedValue({
        recordId: "LF-HDC-00002",
        envelopeType: "bundle_b",
      }),
    });

    const result = await executeAnnatureWebhook(
      makePayload("env-bundle-b"),
      "valid-sig",
      deps
    );

    expect(result).toEqual({ status: 200 });
    expect(deps.updateRecordFields).toHaveBeenCalledWith("LF-HDC-00002", {
      employment_contract_status: "completed",
    });
  });
});

// ---------------------------------------------------------------------------
// TNA
// ---------------------------------------------------------------------------

describe("executeAnnatureWebhook — TNA staff signing", () => {
  it("sets tna_staff_signed_at when signing_event is 'staff'", async () => {
    const deps = makeDeps({
      findRecordByEnvelopeId: vi.fn().mockResolvedValue({
        recordId: "LF-HDC-00003",
        envelopeType: "tna",
      }),
    });

    const result = await executeAnnatureWebhook(
      makePayload("env-tna", "staff"),
      "valid-sig",
      deps
    );

    expect(result).toEqual({ status: 200 });
    const call = (deps.updateRecordFields as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe("LF-HDC-00003");
    expect(call[1]).toHaveProperty("tna_staff_signed_at");
    expect(typeof call[1].tna_staff_signed_at).toBe("string");
  });
});

describe("executeAnnatureWebhook — TNA admin countersign", () => {
  it("sets tna_status to completed when signing_event is 'admin'", async () => {
    const deps = makeDeps({
      findRecordByEnvelopeId: vi.fn().mockResolvedValue({
        recordId: "LF-HDC-00003",
        envelopeType: "tna",
      }),
    });

    const result = await executeAnnatureWebhook(
      makePayload("env-tna", "admin"),
      "valid-sig",
      deps
    );

    expect(result).toEqual({ status: 200 });
    expect(deps.updateRecordFields).toHaveBeenCalledWith("LF-HDC-00003", {
      tna_status: "completed",
    });
  });
});

// ---------------------------------------------------------------------------
// Unknown envelope
// ---------------------------------------------------------------------------

describe("executeAnnatureWebhook — unknown envelope", () => {
  it("returns 200 without updating fields when envelope is not found", async () => {
    const deps = makeDeps({
      findRecordByEnvelopeId: vi.fn().mockResolvedValue(null),
    });

    const result = await executeAnnatureWebhook(
      makePayload("env-unknown"),
      "valid-sig",
      deps
    );

    expect(result).toEqual({ status: 200 });
    expect(deps.updateRecordFields).not.toHaveBeenCalled();
  });
});
