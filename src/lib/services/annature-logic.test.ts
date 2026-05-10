import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeSendBundleA, executeSendBundleB } from "./annature-logic";

const TEMPLATE_ID = "dc0397cc150f43b5965e5602fd2dadd5";
const ROLE_ID = "78de86cc17824615818c1e6ebb790160";
const ACCOUNT_ID = "f0f2835d888140289720bf3180709296";

function makeDeps(fetchImpl: typeof fetch) {
  return {
    fetch: fetchImpl,
    annatureId: "test-public-key",
    annatureKey: "test-private-key",
    accountId: ACCOUNT_ID,
    templateId: TEMPLATE_ID,
    roleId: ROLE_ID,
    persistEnvelopeId: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe("executeSendBundleA", () => {
  it("sends POST to the correct template URL with auth headers and recipient", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "env-001" }),
    });

    await executeSendBundleA("LF-HDC-00001", "staff@example.com", makeDeps(mockFetch));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(`https://api.annature.com.au/v1/templates/${TEMPLATE_ID}/use`);
    expect((init.headers as Record<string, string>)["X-Annature-Id"]).toBe("test-public-key");
    expect((init.headers as Record<string, string>)["X-Annature-Key"]).toBe("test-private-key");

    const body = JSON.parse(init.body as string);
    expect(body.account_id).toBe(ACCOUNT_ID);
    expect(body.recipients).toEqual([
      { role_id: ROLE_ID, email: "staff@example.com" },
    ]);
  });

  it("returns an error and does not persist when the API responds with a non-ok status", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({}),
    });
    const mockPersist = vi.fn();
    const deps = { ...makeDeps(mockFetch), persistEnvelopeId: mockPersist };

    const result = await executeSendBundleA("LF-HDC-00003", "staff@example.com", deps);

    expect(result).toEqual({ error: "Annature API error: 422" });
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it("persists the envelope ID and returns it on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "env-abc-123" }),
    });
    const mockPersist = vi.fn().mockResolvedValue({ error: null });
    const deps = { ...makeDeps(mockFetch), persistEnvelopeId: mockPersist };

    const result = await executeSendBundleA("LF-HDC-00002", "staff@example.com", deps);

    expect(mockPersist).toHaveBeenCalledWith("LF-HDC-00002", "env-abc-123");
    expect(result).toEqual({ envelopeId: "env-abc-123" });
  });
});

// ── executeSendBundleB ────────────────────────────────────────────────────────

const BUNDLE_B_ROLE_ID = "role-bundle-b";
const FLEXIBLE_WORKING_ID = "tmpl-flex-001";
const CORE_POLICY_ID = "tmpl-core-001";
const HIGH_INTENSITY_ID = "tmpl-hi-001";
const BEHAVIOUR_SUPPORT_ID = "tmpl-bs-001";

function makeBundleBDeps(
  fetchImpl: typeof fetch,
  contractAnnatureTemplateId: string | null = "ann-contract-001"
) {
  return {
    fetch: fetchImpl,
    annatureId: "test-public-key",
    annatureKey: "test-private-key",
    accountId: ACCOUNT_ID,
    roleId: BUNDLE_B_ROLE_ID,
    flexibleWorkingTemplateId: FLEXIBLE_WORKING_ID,
    corePolicyTemplateId: CORE_POLICY_ID,
    highIntensityTemplateId: HIGH_INTENSITY_ID,
    behaviourSupportTemplateId: BEHAVIOUR_SUPPORT_ID,
    getContractAnnatureTemplateId: vi.fn().mockResolvedValue(contractAnnatureTemplateId),
    persistEnvelopeId: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe("executeSendBundleB", () => {
  it("returns an error when the contract template is not found", async () => {
    const mockFetch = vi.fn();
    const deps = makeBundleBDeps(mockFetch, null);

    const result = await executeSendBundleB("LF-HDC-00010", "db-tmpl-uuid", "staff@example.com", deps);

    expect(result).toEqual({ error: "Contract template not found" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("looks up the contract template using the provided contractTemplateId", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "env-b-001" }),
    });
    const deps = makeBundleBDeps(mockFetch, "ann-contract-001");

    await executeSendBundleB("LF-HDC-00010", "db-tmpl-uuid", "staff@example.com", deps);

    expect(deps.getContractAnnatureTemplateId).toHaveBeenCalledWith("db-tmpl-uuid");
  });

  it("sends POST to /v1/envelopes with all 5 template IDs and auth headers", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "env-b-001" }),
    });
    const deps = makeBundleBDeps(mockFetch, "ann-contract-001");

    await executeSendBundleB("LF-HDC-00010", "db-tmpl-uuid", "staff@example.com", deps);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://api.annature.com.au/v1/envelopes");
    expect((init.headers as Record<string, string>)["X-Annature-Id"]).toBe("test-public-key");
    expect((init.headers as Record<string, string>)["X-Annature-Key"]).toBe("test-private-key");

    const body = JSON.parse(init.body as string);
    expect(body.account_id).toBe(ACCOUNT_ID);
    expect(body.recipients).toEqual([{ role_id: BUNDLE_B_ROLE_ID, email: "staff@example.com" }]);
    expect(body.template_ids).toEqual([
      "ann-contract-001",
      FLEXIBLE_WORKING_ID,
      CORE_POLICY_ID,
      HIGH_INTENSITY_ID,
      BEHAVIOUR_SUPPORT_ID,
    ]);
  });

  it("returns an error and does not persist when the Annature API fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });
    const deps = makeBundleBDeps(mockFetch);

    const result = await executeSendBundleB("LF-HDC-00010", "db-tmpl-uuid", "staff@example.com", deps);

    expect(result).toEqual({ error: "Annature API error: 400" });
    expect(deps.persistEnvelopeId).not.toHaveBeenCalled();
  });

  it("persists the envelope ID and returns it on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "env-b-xyz" }),
    });
    const mockPersist = vi.fn().mockResolvedValue({ error: null });
    const deps = { ...makeBundleBDeps(mockFetch), persistEnvelopeId: mockPersist };

    const result = await executeSendBundleB("LF-HDC-00010", "db-tmpl-uuid", "staff@example.com", deps);

    expect(mockPersist).toHaveBeenCalledWith("LF-HDC-00010", "env-b-xyz");
    expect(result).toEqual({ envelopeId: "env-b-xyz" });
  });
});
