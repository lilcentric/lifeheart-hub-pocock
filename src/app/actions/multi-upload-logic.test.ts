import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordMultiUploadAndUpdateStatus } from "./multi-upload-logic";

function makeDeps() {
  return {
    recordDocument: vi.fn().mockResolvedValue(undefined),
    setStatus: vi.fn().mockResolvedValue(undefined),
  };
}

describe("recordMultiUploadAndUpdateStatus", () => {
  it("records the document and sets status to completed", async () => {
    const deps = makeDeps();

    const result = await recordMultiUploadAndUpdateStatus(
      "LF-HDC-00001",
      "qualifications",
      "onboarding/LF-HDC-00001/qualifications/cert.pdf",
      "cert.pdf",
      deps
    );

    expect(deps.recordDocument).toHaveBeenCalledWith(
      "LF-HDC-00001",
      "qualifications",
      "onboarding/LF-HDC-00001/qualifications/cert.pdf",
      "cert.pdf"
    );
    expect(deps.setStatus).toHaveBeenCalledWith(
      "LF-HDC-00001",
      "qualifications_status",
      "completed"
    );
    expect(result).toEqual({ success: true });
  });

  it("works for first_aid_cpr document type", async () => {
    const deps = makeDeps();

    const result = await recordMultiUploadAndUpdateStatus(
      "LF-HDC-00002",
      "first_aid_cpr",
      "onboarding/LF-HDC-00002/first_aid_cpr/cpr.pdf",
      "cpr.pdf",
      deps
    );

    expect(deps.setStatus).toHaveBeenCalledWith(
      "LF-HDC-00002",
      "first_aid_cpr_status",
      "completed"
    );
    expect(result).toEqual({ success: true });
  });

  it("returns error when document recording fails", async () => {
    const deps = makeDeps();
    deps.recordDocument.mockRejectedValue(new Error("Insert failed"));

    const result = await recordMultiUploadAndUpdateStatus(
      "LF-HDC-00001",
      "qualifications",
      "onboarding/LF-HDC-00001/qualifications/cert.pdf",
      "cert.pdf",
      deps
    );

    expect(result).toEqual({ error: "Insert failed" });
    expect(deps.setStatus).not.toHaveBeenCalled();
  });

  it("returns error when status update fails", async () => {
    const deps = makeDeps();
    deps.setStatus.mockRejectedValue(new Error("RLS violation"));

    const result = await recordMultiUploadAndUpdateStatus(
      "LF-HDC-00001",
      "qualifications",
      "onboarding/LF-HDC-00001/qualifications/cert.pdf",
      "cert.pdf",
      deps
    );

    expect(result).toEqual({ error: "RLS violation" });
  });

  it("sets status to completed even when item was already completed (idempotent)", async () => {
    const deps = makeDeps();

    await recordMultiUploadAndUpdateStatus(
      "LF-HDC-00001",
      "qualifications",
      "onboarding/LF-HDC-00001/qualifications/extra.pdf",
      "extra.pdf",
      deps
    );

    expect(deps.setStatus).toHaveBeenCalledWith(
      "LF-HDC-00001",
      "qualifications_status",
      "completed"
    );
  });
});
