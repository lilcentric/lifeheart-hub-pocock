import { describe, it, expect, vi } from "vitest";
import { executeSendOnboardingLink } from "./onboarding-link-logic";

function makeDeps() {
  return {
    generateToken: vi.fn().mockResolvedValue({ token: "tok-001", error: null }),
    revokeToken: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue({ error: null }),
    sendAllDocuments: vi.fn().mockResolvedValue({
      envelopeId: "env-001",
      signingUrl: "https://sign.example.com/abc",
      fwaEnvelopeId: null,
      fwaSigningUrl: null,
    }),
  };
}

const DEFAULT_ARGS = ["LF-HDC-00001", "staff@example.com", "bundle-uuid", false] as const;

describe("executeSendOnboardingLink", () => {
  it("succeeds when all steps complete", async () => {
    const deps = makeDeps();
    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(deps.generateToken).toHaveBeenCalledWith("LF-HDC-00001");
    expect(deps.sendEmail).toHaveBeenCalledWith("staff@example.com", "tok-001");
    expect(deps.sendAllDocuments).toHaveBeenCalledWith(
      "LF-HDC-00001", "staff@example.com", "bundle-uuid", false
    );
    expect(result).toEqual({ success: true });
  });

  it("passes flexibleWorkingOptedIn=true through to sendAllDocuments", async () => {
    const deps = makeDeps();
    await executeSendOnboardingLink(
      "LF-HDC-00001", "staff@example.com", "bundle-uuid", true, deps
    );

    expect(deps.sendAllDocuments).toHaveBeenCalledWith(
      "LF-HDC-00001", "staff@example.com", "bundle-uuid", true
    );
  });

  it("Annature failure surfaces as a warning but token and email still dispatch", async () => {
    const deps = makeDeps();
    deps.sendAllDocuments.mockResolvedValue({ error: "Annature API error: 500" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(deps.generateToken).toHaveBeenCalled();
    expect(deps.sendEmail).toHaveBeenCalled();
    expect(result).toEqual({ success: true, annatureWarning: "Annature API error: 500" });
  });

  it("returns error when token generation fails", async () => {
    const deps = makeDeps();
    deps.generateToken.mockResolvedValue({ token: null, error: "DB error" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(result).toEqual({ error: "DB error" });
    expect(deps.sendEmail).not.toHaveBeenCalled();
    expect(deps.sendAllDocuments).not.toHaveBeenCalled();
  });

  it("returns error when email send fails", async () => {
    const deps = makeDeps();
    deps.sendEmail.mockResolvedValue({ error: "Resend rate limit" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(result).toEqual({ error: "Resend rate limit" });
    expect(deps.revokeToken).toHaveBeenCalledWith("tok-001");
    expect(deps.sendAllDocuments).not.toHaveBeenCalled();
  });
});
