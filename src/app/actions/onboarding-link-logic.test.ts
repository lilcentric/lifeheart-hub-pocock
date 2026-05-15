import { describe, it, expect, vi } from "vitest";
import { executeSendOnboardingLink } from "./onboarding-link-logic";

function makeDeps() {
  return {
    generateToken: vi.fn().mockResolvedValue({ token: "tok-001", error: null }),
    getStaffName: vi.fn().mockResolvedValue("Jane Smith"),
    sendEmail: vi.fn().mockResolvedValue({ error: null }),
    sendAllDocuments: vi.fn().mockResolvedValue({
      envelopeId: "env-001",
      signingUrl: "https://sign.example.com/abc",
      fwaEnvelopeId: null,
      fwaSigningUrl: null,
    }),
    createXeroEmployee: vi.fn().mockResolvedValue({ xeroEmployeeId: "xero-emp-001" }),
    sendXeroInvite: vi.fn().mockResolvedValue({ error: null }),
  };
}

const DEFAULT_ARGS = ["LF-HDC-00001", "staff@example.com", "bundle-uuid", false] as const;

describe("executeSendOnboardingLink", () => {
  it("succeeds when all steps complete", async () => {
    const deps = makeDeps();
    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(deps.generateToken).toHaveBeenCalledWith("LF-HDC-00001");
    expect(deps.getStaffName).toHaveBeenCalledWith("LF-HDC-00001");
    expect(deps.sendEmail).toHaveBeenCalledWith("staff@example.com", "Jane Smith", "tok-001");
    expect(deps.sendAllDocuments).toHaveBeenCalledWith(
      "LF-HDC-00001", "staff@example.com", "Jane Smith", "bundle-uuid", false
    );
    expect(deps.createXeroEmployee).toHaveBeenCalledWith("Jane Smith", "staff@example.com");
    expect(deps.sendXeroInvite).toHaveBeenCalledWith("xero-emp-001");
    expect(result).toEqual({ success: true });
  });

  it("passes flexibleWorkingOptedIn=true through to sendAllDocuments", async () => {
    const deps = makeDeps();
    await executeSendOnboardingLink("LF-HDC-00001", "staff@example.com", "bundle-uuid", true, deps);

    expect(deps.sendAllDocuments).toHaveBeenCalledWith(
      "LF-HDC-00001", "staff@example.com", "Jane Smith", "bundle-uuid", true
    );
  });

  it("Annature failure surfaces as annatureWarning; token, email, and Xero still proceed", async () => {
    const deps = makeDeps();
    deps.sendAllDocuments.mockResolvedValue({ error: "Annature API error: 500" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(deps.generateToken).toHaveBeenCalled();
    expect(deps.sendEmail).toHaveBeenCalled();
    expect(deps.createXeroEmployee).toHaveBeenCalled();
    expect(result).toEqual({ success: true, annatureWarning: "Annature API error: 500" });
  });

  it("Xero failure surfaces as xeroWarning; token, email, and Annature still proceed", async () => {
    const deps = makeDeps();
    deps.createXeroEmployee.mockResolvedValue({ error: "Xero OAuth token expired" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(deps.generateToken).toHaveBeenCalled();
    expect(deps.sendEmail).toHaveBeenCalled();
    expect(deps.sendAllDocuments).toHaveBeenCalled();
    expect(deps.sendXeroInvite).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, xeroWarning: "Xero OAuth token expired" });
  });

  it("Xero invite failure surfaces as xeroWarning when createEmployee succeeds", async () => {
    const deps = makeDeps();
    deps.sendXeroInvite.mockResolvedValue({ error: "Xero invite failed" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(result).toEqual({ success: true, xeroWarning: "Xero invite failed" });
  });

  it("returns error when token generation fails, nothing else called", async () => {
    const deps = makeDeps();
    deps.generateToken.mockResolvedValue({ token: null, error: "DB error" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(result).toEqual({ error: "DB error" });
    expect(deps.getStaffName).not.toHaveBeenCalled();
    expect(deps.sendEmail).not.toHaveBeenCalled();
    expect(deps.sendAllDocuments).not.toHaveBeenCalled();
    expect(deps.createXeroEmployee).not.toHaveBeenCalled();
  });

  it("returns error when email send fails, Annature and Xero not called", async () => {
    const deps = makeDeps();
    deps.sendEmail.mockResolvedValue({ error: "Resend rate limit" });

    const result = await executeSendOnboardingLink(...DEFAULT_ARGS, deps);

    expect(result).toEqual({ error: "Resend rate limit" });
    expect(deps.sendAllDocuments).not.toHaveBeenCalled();
    expect(deps.createXeroEmployee).not.toHaveBeenCalled();
  });
});
