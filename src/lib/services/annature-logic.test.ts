import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeSendBundleA, executeSendTNA } from "./annature-logic";

const TEMPLATE_ID = "dc0397cc150f43b5965e5602fd2dadd5";
const ROLE_ID = "78de86cc17824615818c1e6ebb790160";
const ACCOUNT_ID = "f0f2835d888140289720bf3180709296";

const TNA_TEMPLATE_ID = "aa1122bb3344cc5566dd7788ee9900ff";
const TNA_STAFF_ROLE_ID = "staff-role-aabbccdd";
const TNA_ADMIN_ROLE_ID = "admin-role-eeff0011";

function makeTNADeps(fetchImpl: typeof fetch) {
  return {
    fetch: fetchImpl,
    annatureId: "test-public-key",
    annatureKey: "test-private-key",
    accountId: ACCOUNT_ID,
    templateId: TNA_TEMPLATE_ID,
    staffRoleId: TNA_STAFF_ROLE_ID,
    adminRoleId: TNA_ADMIN_ROLE_ID,
    persistEnvelopeId: vi.fn().mockResolvedValue({ error: null }),
  };
}

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

describe("executeSendTNA", () => {
  it("configures sequential signing with staff as first signer and admin as second signer", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "tna-env-001" }),
    });

    await executeSendTNA("LF-HDC-00001", "staff@example.com", "admin@example.com", makeTNADeps(mockFetch));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(`https://api.annature.com.au/v1/templates/${TNA_TEMPLATE_ID}/use`);

    const body = JSON.parse(init.body as string);
    expect(body.account_id).toBe(ACCOUNT_ID);
    expect(body.signing_order).toBe("sequential");
    expect(body.recipients).toEqual([
      { role_id: TNA_STAFF_ROLE_ID, email: "staff@example.com", signing_order: 1 },
      { role_id: TNA_ADMIN_ROLE_ID, email: "admin@example.com", signing_order: 2 },
    ]);
  });

  it("persists the envelope ID and returns it on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "tna-env-abc" }),
    });
    const mockPersist = vi.fn().mockResolvedValue({ error: null });
    const deps = { ...makeTNADeps(mockFetch), persistEnvelopeId: mockPersist };

    const result = await executeSendTNA("LF-HDC-00002", "staff@example.com", "admin@example.com", deps);

    expect(mockPersist).toHaveBeenCalledWith("LF-HDC-00002", "tna-env-abc");
    expect(result).toEqual({ envelopeId: "tna-env-abc" });
  });

  it("returns an error and does not persist when the API responds with a non-ok status", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({}),
    });
    const mockPersist = vi.fn();
    const deps = { ...makeTNADeps(mockFetch), persistEnvelopeId: mockPersist };

    const result = await executeSendTNA("LF-HDC-00003", "staff@example.com", "admin@example.com", deps);

    expect(result).toEqual({ error: "Annature API error: 422" });
    expect(mockPersist).not.toHaveBeenCalled();
  });
});
