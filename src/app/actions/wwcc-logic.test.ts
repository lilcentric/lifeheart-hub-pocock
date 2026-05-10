import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWwccApplying, executeWwccUploadComplete } from "./wwcc-logic";

// ---------------------------------------------------------------------------
// executeWwccApplying — "No, I'm applying via Service NSW" path
// ---------------------------------------------------------------------------

describe("executeWwccApplying", () => {
  const mockUpdateStatus = vi.fn();

  beforeEach(() => {
    mockUpdateStatus.mockClear();
    mockUpdateStatus.mockResolvedValue({ error: null });
  });

  it("sets wwcc_status to in_progress", async () => {
    const result = await executeWwccApplying("LF-HDC-00001", mockUpdateStatus);

    expect(result).toEqual({ success: true });
    expect(mockUpdateStatus).toHaveBeenCalledWith("LF-HDC-00001", "in_progress");
  });

  it("surfaces database errors", async () => {
    mockUpdateStatus.mockResolvedValue({ error: { message: "DB error" } });

    const result = await executeWwccApplying("LF-HDC-00001", mockUpdateStatus);

    expect(result).toEqual({ error: "DB error" });
    expect(mockUpdateStatus).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// executeWwccUploadComplete — "Yes, I have it" path (after direct upload)
// ---------------------------------------------------------------------------

describe("executeWwccUploadComplete", () => {
  const mockUpdateStatus = vi.fn();
  const mockRecordUpload = vi.fn();

  beforeEach(() => {
    mockUpdateStatus.mockClear();
    mockRecordUpload.mockClear();
    mockUpdateStatus.mockResolvedValue({ error: null });
    mockRecordUpload.mockResolvedValue({ error: null });
  });

  it("records the upload path and sets wwcc_status to in_progress", async () => {
    const path = "onboarding/LF-HDC-00001/wwcc/certificate.pdf";

    const result = await executeWwccUploadComplete(
      "LF-HDC-00001",
      path,
      mockUpdateStatus,
      mockRecordUpload
    );

    expect(result).toEqual({ success: true });
    expect(mockRecordUpload).toHaveBeenCalledWith("LF-HDC-00001", "wwcc", path);
    expect(mockUpdateStatus).toHaveBeenCalledWith("LF-HDC-00001", "in_progress");
  });

  it("surfaces recordUpload errors without calling updateStatus", async () => {
    mockRecordUpload.mockResolvedValue({ error: { message: "Upload record failed" } });

    const result = await executeWwccUploadComplete(
      "LF-HDC-00001",
      "onboarding/LF-HDC-00001/wwcc/certificate.pdf",
      mockUpdateStatus,
      mockRecordUpload
    );

    expect(result).toEqual({ error: "Upload record failed" });
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it("surfaces updateStatus errors after recordUpload succeeds", async () => {
    mockUpdateStatus.mockResolvedValue({ error: { message: "Status update failed" } });

    const result = await executeWwccUploadComplete(
      "LF-HDC-00001",
      "onboarding/LF-HDC-00001/wwcc/certificate.pdf",
      mockUpdateStatus,
      mockRecordUpload
    );

    expect(result).toEqual({ error: "Status update failed" });
    expect(mockRecordUpload).toHaveBeenCalledOnce();
  });
});
