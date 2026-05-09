import { describe, it, expect, vi } from "vitest";
import { executeSendOnboardingLink } from "./onboarding-link-logic";

function makeDeps() {
  return {
    generateToken: vi.fn().mockResolvedValue({ token: "tok-001", error: null }),
    sendEmail: vi.fn().mockResolvedValue({ error: null }),
    sendBundleA: vi.fn().mockResolvedValue({ envelopeId: "env-001" }),
  };
}

describe("executeSendOnboardingLink", () => {
  it("succeeds when all steps complete", async () => {
    const deps = makeDeps();
    const result = await executeSendOnboardingLink("LF-HDC-00001", "staff@example.com", deps);

    expect(deps.generateToken).toHaveBeenCalledWith("LF-HDC-00001");
    expect(deps.sendEmail).toHaveBeenCalledWith("staff@example.com", "tok-001");
    expect(deps.sendBundleA).toHaveBeenCalledWith("LF-HDC-00001", "staff@example.com");
    expect(result).toEqual({ success: true });
  });

  it("Annature failure surfaces as a warning but token and email still dispatch", async () => {
    const deps = makeDeps();
    deps.sendBundleA.mockResolvedValue({ error: "Annature API error: 500" });

    const result = await executeSendOnboardingLink("LF-HDC-00002", "staff@example.com", deps);

    expect(deps.generateToken).toHaveBeenCalled();
    expect(deps.sendEmail).toHaveBeenCalled();
    expect(result).toEqual({ success: true, annatureWarning: "Annature API error: 500" });
  });
});
