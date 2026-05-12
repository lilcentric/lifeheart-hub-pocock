import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeComplianceUpload } from "./compliance-upload-logic";

const mockRecordPath = vi.fn();
const mockUpdateStatus = vi.fn();

const deps = { recordPath: mockRecordPath, updateStatus: mockUpdateStatus };

beforeEach(() => {
  mockRecordPath.mockReset();
  mockUpdateStatus.mockReset();
  mockRecordPath.mockResolvedValue({ error: null });
  mockUpdateStatus.mockResolvedValue({ error: null });
});

describe("executeComplianceUpload", () => {
  it("records path and sets identity_right_to_work_status to completed", async () => {
    const result = await executeComplianceUpload(
      "LF-HDC-00001",
      "identity_right_to_work",
      "onboarding/LF-HDC-00001/identity_right_to_work/passport.pdf",
      deps
    );

    expect(result).toEqual({ success: true });
    expect(mockRecordPath).toHaveBeenCalledWith(
      "LF-HDC-00001",
      "identity_right_to_work",
      "onboarding/LF-HDC-00001/identity_right_to_work/passport.pdf"
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      "LF-HDC-00001",
      "identity_right_to_work_status",
      "completed"
    );
  });

  it("records path and sets ndis_orientation_status to completed", async () => {
    const result = await executeComplianceUpload(
      "LF-HDC-00002",
      "ndis_orientation",
      "onboarding/LF-HDC-00002/ndis_orientation/certificate.pdf",
      deps
    );

    expect(result).toEqual({ success: true });
    expect(mockRecordPath).toHaveBeenCalledWith(
      "LF-HDC-00002",
      "ndis_orientation",
      "onboarding/LF-HDC-00002/ndis_orientation/certificate.pdf"
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      "LF-HDC-00002",
      "ndis_orientation_status",
      "completed"
    );
  });

  it("records path and sets car_insurance_status to completed", async () => {
    const result = await executeComplianceUpload(
      "LF-HDC-00003",
      "car_insurance",
      "onboarding/LF-HDC-00003/car_insurance/policy.pdf",
      deps
    );

    expect(result).toEqual({ success: true });
    expect(mockRecordPath).toHaveBeenCalledWith(
      "LF-HDC-00003",
      "car_insurance",
      "onboarding/LF-HDC-00003/car_insurance/policy.pdf"
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      "LF-HDC-00003",
      "car_insurance_status",
      "completed"
    );
  });

  it("records path and sets additional_training_status to completed", async () => {
    const result = await executeComplianceUpload(
      "LF-HDC-00004",
      "additional_training",
      "onboarding/LF-HDC-00004/additional_training/cert.pdf",
      deps
    );

    expect(result).toEqual({ success: true });
    expect(mockRecordPath).toHaveBeenCalledWith(
      "LF-HDC-00004",
      "additional_training",
      "onboarding/LF-HDC-00004/additional_training/cert.pdf"
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      "LF-HDC-00004",
      "additional_training_status",
      "completed"
    );
  });

  it("rejects an unknown document type and does not call recordPath or updateStatus", async () => {
    const result = await executeComplianceUpload(
      "LF-HDC-00001",
      "unknown_doc" as never,
      "onboarding/LF-HDC-00001/unknown_doc/file.pdf",
      deps
    );

    expect(result).toEqual({ error: "Invalid document type" });
    expect(mockRecordPath).not.toHaveBeenCalled();
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it("surfaces recordPath errors", async () => {
    mockRecordPath.mockResolvedValue({ error: { message: "Storage write failed" } });

    const result = await executeComplianceUpload(
      "LF-HDC-00001",
      "identity_right_to_work",
      "onboarding/LF-HDC-00001/identity_right_to_work/passport.pdf",
      deps
    );

    expect(result).toEqual({ error: "Storage write failed" });
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it("surfaces updateStatus errors", async () => {
    mockUpdateStatus.mockResolvedValue({ error: { message: "RLS violation" } });

    const result = await executeComplianceUpload(
      "LF-HDC-00001",
      "identity_right_to_work",
      "onboarding/LF-HDC-00001/identity_right_to_work/passport.pdf",
      deps
    );

    expect(result).toEqual({ error: "RLS violation" });
  });
});
