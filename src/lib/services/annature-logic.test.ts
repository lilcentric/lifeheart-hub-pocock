import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeSendBundleA, executeSendAllDocuments } from "./annature-logic";

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

// ── executeSendAllDocuments ───────────────────────────────────────────────────

const ALL_ROLE_ID = "role-all-docs";
const FLEXIBLE_WORKING_TMPL = "tmpl-fw-001";
const BUNDLE_ANNATURE_TMPL = "ann-bundle-001";

function makeAllDocsDeps(
  fetchImpl: typeof fetch,
  bundleAnnId: string | null = BUNDLE_ANNATURE_TMPL
) {
  return {
    fetch: fetchImpl,
    annatureId: "test-public-key",
    annatureKey: "test-private-key",
    accountId: ACCOUNT_ID,
    roleId: ALL_ROLE_ID,
    flexibleWorkingTemplateId: FLEXIBLE_WORKING_TMPL,
    getEmploymentBundleAnnatureTemplateId: vi.fn().mockResolvedValue(bundleAnnId),
    persistEnvelopeData: vi.fn().mockResolvedValue({ error: null }),
  };
}

function makeSuccessFetch(envelopeId = "env-all-001", signingLink = "https://sign.annature.com.au/abc") {
  return vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: envelopeId }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signers: [{ signing_link: signingLink }] }),
    });
}

describe("executeSendAllDocuments", () => {
  it("returns error when Employment Bundle template lookup returns null", async () => {
    const mockFetch = vi.fn();
    const deps = makeAllDocsDeps(mockFetch, null);

    const result = await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", false, deps
    );

    expect(result).toEqual({ error: "Employment Bundle template not found" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("POSTs to /v1/envelopes with single template array (just the bundle ID)", async () => {
    const mockFetch = makeSuccessFetch();
    const deps = makeAllDocsDeps(mockFetch);

    await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", false, deps
    );

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.annature.com.au/v1/envelopes");
    const body = JSON.parse(init.body as string);
    expect(body.template_ids).toEqual([BUNDLE_ANNATURE_TMPL]);
    expect(body.template_ids).toHaveLength(1);
  });

  it("returns error and does not persist when POST fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 422 });
    const deps = makeAllDocsDeps(mockFetch);

    const result = await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", false, deps
    );

    expect(result).toEqual({ error: "Annature API error: 422" });
    expect(deps.persistEnvelopeData).not.toHaveBeenCalled();
  });

  it("signingUrl is null when GET fails, does not return error, continues to persist", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "env-all-001" }) })
      .mockRejectedValueOnce(new Error("Network error"));
    const deps = makeAllDocsDeps(mockFetch);

    const result = await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", false, deps
    );

    expect(deps.persistEnvelopeData).toHaveBeenCalledWith(
      "LF-HDC-00020", "env-all-001", null, "bundle-uuid", false, null, null
    );
    expect(result).toEqual({ envelopeId: "env-all-001", signingUrl: null, fwaEnvelopeId: null, fwaSigningUrl: null });
  });

  it("when flexibleWorkingOptedIn=false: no FWA POST, fwaEnvelopeId=null, fwaSigningUrl=null", async () => {
    const mockFetch = makeSuccessFetch("env-all-001", "https://sign.annature.com.au/xyz");
    const deps = makeAllDocsDeps(mockFetch);

    const result = await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", false, deps
    );

    // Only 2 fetch calls: POST + GET for bundle (no FWA)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(deps.persistEnvelopeData).toHaveBeenCalledWith(
      "LF-HDC-00020", "env-all-001", "https://sign.annature.com.au/xyz", "bundle-uuid", false, null, null
    );
    expect(result).toEqual({
      envelopeId: "env-all-001",
      signingUrl: "https://sign.annature.com.au/xyz",
      fwaEnvelopeId: null,
      fwaSigningUrl: null,
    });
  });

  it("when flexibleWorkingOptedIn=true: sends second POST for FWA and persists fwaEnvelopeId + fwaSigningUrl", async () => {
    const mockFetch = vi.fn()
      // Bundle POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "env-bundle-001" }) })
      // Bundle GET (signing URL)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ signers: [{ signing_link: "https://sign.annature.com.au/bundle" }] }) })
      // FWA POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "env-fwa-001" }) })
      // FWA GET (signing URL)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ signers: [{ signing_link: "https://sign.annature.com.au/fwa" }] }) });

    const deps = makeAllDocsDeps(mockFetch);

    const result = await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", true, deps
    );

    // FWA POST should use fwa template ID
    const fwaPostCall = mockFetch.mock.calls[2] as [string, RequestInit];
    expect(fwaPostCall[0]).toBe("https://api.annature.com.au/v1/envelopes");
    const fwaBody = JSON.parse(fwaPostCall[1].body as string);
    expect(fwaBody.template_ids).toEqual([FLEXIBLE_WORKING_TMPL]);

    expect(deps.persistEnvelopeData).toHaveBeenCalledWith(
      "LF-HDC-00020", "env-bundle-001", "https://sign.annature.com.au/bundle",
      "bundle-uuid", true, "env-fwa-001", "https://sign.annature.com.au/fwa"
    );
    expect(result).toEqual({
      envelopeId: "env-bundle-001",
      signingUrl: "https://sign.annature.com.au/bundle",
      fwaEnvelopeId: "env-fwa-001",
      fwaSigningUrl: "https://sign.annature.com.au/fwa",
    });
  });

  it("FWA POST failure is non-fatal: persists with fwa fields as null, returns envelopeId", async () => {
    const mockFetch = vi.fn()
      // Bundle POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "env-bundle-001" }) })
      // Bundle GET (signing URL)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ signers: [{ signing_link: "https://sign.annature.com.au/bundle" }] }) })
      // FWA POST fails
      .mockRejectedValueOnce(new Error("FWA network error"));

    const deps = makeAllDocsDeps(mockFetch);

    const result = await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", true, deps
    );

    expect(deps.persistEnvelopeData).toHaveBeenCalledWith(
      "LF-HDC-00020", "env-bundle-001", "https://sign.annature.com.au/bundle",
      "bundle-uuid", true, null, null
    );
    expect(result).toEqual({
      envelopeId: "env-bundle-001",
      signingUrl: "https://sign.annature.com.au/bundle",
      fwaEnvelopeId: null,
      fwaSigningUrl: null,
    });
  });

  it("full success: persists all fields and returns full result", async () => {
    const mockFetch = makeSuccessFetch("env-all-001", "https://sign.annature.com.au/xyz");
    const deps = makeAllDocsDeps(mockFetch);

    const result = await executeSendAllDocuments(
      "LF-HDC-00020", "staff@example.com", "bundle-uuid", false, deps
    );

    expect(deps.persistEnvelopeData).toHaveBeenCalledWith(
      "LF-HDC-00020",
      "env-all-001",
      "https://sign.annature.com.au/xyz",
      "bundle-uuid",
      false,
      null,
      null
    );
    expect(result).toEqual({
      envelopeId: "env-all-001",
      signingUrl: "https://sign.annature.com.au/xyz",
      fwaEnvelopeId: null,
      fwaSigningUrl: null,
    });
  });
});
