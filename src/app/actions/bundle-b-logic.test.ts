import { describe, it, expect, vi } from "vitest";
import { executeSendContractBundle, type SendContractBundleDeps } from "./bundle-b-logic";

function makeDeps(overrides: Partial<SendContractBundleDeps> = {}): SendContractBundleDeps {
  return {
    saveContractTemplateId: vi.fn().mockResolvedValue({ error: null }),
    sendBundleB: vi.fn().mockResolvedValue({ envelopeId: "env-b-001" }),
    ...overrides,
  };
}

describe("executeSendContractBundle", () => {
  it("saves the contract template ID and sends Bundle B, returning envelopeId", async () => {
    const deps = makeDeps();

    const result = await executeSendContractBundle(
      "LF-HDC-00010",
      "db-tmpl-uuid",
      "staff@example.com",
      deps
    );

    expect(deps.saveContractTemplateId).toHaveBeenCalledWith("LF-HDC-00010", "db-tmpl-uuid");
    expect(deps.sendBundleB).toHaveBeenCalledWith("LF-HDC-00010", "db-tmpl-uuid", "staff@example.com");
    expect(result).toEqual({ envelopeId: "env-b-001" });
  });

  it("returns an error when saving the contract template ID fails", async () => {
    const saveContractTemplateId: SendContractBundleDeps["saveContractTemplateId"] = vi
      .fn()
      .mockResolvedValue({ error: "DB write failed" });
    const sendBundleB: SendContractBundleDeps["sendBundleB"] = vi.fn();
    const deps = makeDeps({ saveContractTemplateId, sendBundleB });

    const result = await executeSendContractBundle(
      "LF-HDC-00010",
      "db-tmpl-uuid",
      "staff@example.com",
      deps
    );

    expect(result).toEqual({ error: "DB write failed" });
    expect(sendBundleB).not.toHaveBeenCalled();
  });

  it("returns an error when Bundle B sending fails", async () => {
    const sendBundleB: SendContractBundleDeps["sendBundleB"] = vi
      .fn()
      .mockResolvedValue({ error: "Annature API error: 500" });
    const deps = makeDeps({ sendBundleB });

    const result = await executeSendContractBundle(
      "LF-HDC-00010",
      "db-tmpl-uuid",
      "staff@example.com",
      deps
    );

    expect(result).toEqual({ error: "Annature API error: 500" });
  });
});
