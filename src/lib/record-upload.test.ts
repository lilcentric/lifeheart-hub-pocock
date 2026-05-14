import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordUpload } from "./record-upload";

function makeDeps() {
  return {
    updateRecord: vi.fn().mockResolvedValue({ error: null }),
    insertDocument: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Single-file upload kinds (path + status in one atomic update)
// ---------------------------------------------------------------------------

describe("recordUpload — single-file kinds", () => {
  const SINGLE_CASES = [
    { kind: "identity_right_to_work" as const, pathField: "identity_right_to_work_storage_path", status: "completed" },
    { kind: "ndis_orientation" as const, pathField: "ndis_orientation_storage_path", status: "completed" },
    { kind: "car_insurance" as const, pathField: "car_insurance_storage_path", status: "completed" },
    { kind: "additional_training" as const, pathField: "additional_training_storage_path", status: "completed" },
    { kind: "ndiswsc" as const, pathField: "ndiswsc_storage_path", status: "in_progress" },
    { kind: "wwcc" as const, pathField: "wwcc_storage_path", status: "in_progress" },
  ];

  for (const { kind, pathField, status } of SINGLE_CASES) {
    it(`${kind}: writes path and status in one updateRecord call`, async () => {
      const deps = makeDeps();
      const path = `onboarding/LF-HDC-00001/${kind}/file.pdf`;

      const result = await recordUpload("LF-HDC-00001", kind, path, "file.pdf", deps);

      expect(result).toEqual({ success: true });
      expect(deps.updateRecord).toHaveBeenCalledOnce();
      expect(deps.updateRecord).toHaveBeenCalledWith("LF-HDC-00001", {
        [pathField]: path,
        [`${kind}_status`]: status,
      });
      expect(deps.insertDocument).not.toHaveBeenCalled();
    });
  }

  it("ndiswsc sets status to in_progress (not completed)", async () => {
    const deps = makeDeps();
    await recordUpload("LF-HDC-00001", "ndiswsc", "path/ndiswsc.pdf", "ndiswsc.pdf", deps);

    const updates = deps.updateRecord.mock.calls[0][1];
    expect(updates.ndiswsc_status).toBe("in_progress");
  });

  it("wwcc sets status to in_progress (not completed)", async () => {
    const deps = makeDeps();
    await recordUpload("LF-HDC-00001", "wwcc", "path/wwcc.pdf", "wwcc.pdf", deps);

    const updates = deps.updateRecord.mock.calls[0][1];
    expect(updates.wwcc_status).toBe("in_progress");
  });

  it("returns error and skips status if updateRecord fails", async () => {
    const deps = makeDeps();
    deps.updateRecord.mockResolvedValue({ error: "RLS violation" });

    const result = await recordUpload(
      "LF-HDC-00001",
      "identity_right_to_work",
      "path/passport.pdf",
      "passport.pdf",
      deps
    );

    expect(result).toEqual({ error: "RLS violation" });
    expect(deps.updateRecord).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Multi-file upload kinds (insert document row + status update)
// ---------------------------------------------------------------------------

describe("recordUpload — multi-file kinds", () => {
  const MULTI_CASES = [
    { kind: "qualifications" as const },
    { kind: "first_aid_cpr" as const },
  ];

  for (const { kind } of MULTI_CASES) {
    it(`${kind}: inserts document row then updates status`, async () => {
      const deps = makeDeps();
      const path = `onboarding/LF-HDC-00002/${kind}/cert.pdf`;

      const result = await recordUpload("LF-HDC-00002", kind, path, "cert.pdf", deps);

      expect(result).toEqual({ success: true });
      expect(deps.insertDocument).toHaveBeenCalledOnce();
      expect(deps.insertDocument).toHaveBeenCalledWith(
        "LF-HDC-00002", kind, path, "cert.pdf"
      );
      expect(deps.updateRecord).toHaveBeenCalledOnce();
      expect(deps.updateRecord).toHaveBeenCalledWith("LF-HDC-00002", {
        [`${kind}_status`]: "completed",
      });
    });
  }

  it("returns error and skips status update when insertDocument throws", async () => {
    const deps = makeDeps();
    deps.insertDocument.mockRejectedValue(new Error("Insert failed"));

    const result = await recordUpload(
      "LF-HDC-00001",
      "qualifications",
      "path/cert.pdf",
      "cert.pdf",
      deps
    );

    expect(result).toEqual({ error: "Insert failed" });
    expect(deps.updateRecord).not.toHaveBeenCalled();
  });

  it("returns error when status updateRecord fails after successful insert", async () => {
    const deps = makeDeps();
    deps.updateRecord.mockResolvedValue({ error: "Status update failed" });

    const result = await recordUpload(
      "LF-HDC-00001",
      "qualifications",
      "path/cert.pdf",
      "cert.pdf",
      deps
    );

    expect(result).toEqual({ error: "Status update failed" });
    expect(deps.insertDocument).toHaveBeenCalledOnce();
  });

  it("second upload to same multi-file item sets status to completed (idempotent)", async () => {
    const deps = makeDeps();

    await recordUpload("LF-HDC-00001", "qualifications", "path/cert2.pdf", "cert2.pdf", deps);

    expect(deps.updateRecord).toHaveBeenCalledWith("LF-HDC-00001", {
      qualifications_status: "completed",
    });
  });
});
