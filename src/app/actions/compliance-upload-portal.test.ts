import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock hoisting — must be above imports
// ---------------------------------------------------------------------------

const { mockCreateSignedUploadUrl, mockEq } = vi.hoisted(() => ({
  mockCreateSignedUploadUrl: vi.fn(),
  mockEq: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: mockEq })),
    })),
    storage: {
      from: vi.fn(() => ({ createSignedUploadUrl: mockCreateSignedUploadUrl })),
    },
  })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  getPortalComplianceUploadUrl,
  recordPortalComplianceUpload,
} from "./compliance-upload-portal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockEq.mockResolvedValue({ error: null });
  mockCreateSignedUploadUrl.mockResolvedValue({
    data: { signedUrl: "https://storage.example/signed-upload" },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// getPortalComplianceUploadUrl
// ---------------------------------------------------------------------------

describe("getPortalComplianceUploadUrl", () => {
  it("returns uploadUrl and path for identity_right_to_work without requiring an officer session", async () => {
    const result = await getPortalComplianceUploadUrl(
      "LF-HDC-00001",
      "identity_right_to_work",
      "passport.pdf"
    );

    expect(result).toEqual({
      uploadUrl: "https://storage.example/signed-upload",
      path: "onboarding/LF-HDC-00001/identity_right_to_work/passport.pdf",
    });
  });

  it("returns uploadUrl and path for car_insurance", async () => {
    const result = await getPortalComplianceUploadUrl(
      "LF-HDC-00001",
      "car_insurance",
      "insurance.pdf"
    );

    expect(result).toEqual({
      uploadUrl: "https://storage.example/signed-upload",
      path: "onboarding/LF-HDC-00001/car_insurance/insurance.pdf",
    });
  });

  it("returns uploadUrl and path for ndis_orientation", async () => {
    const result = await getPortalComplianceUploadUrl(
      "LF-HDC-00001",
      "ndis_orientation",
      "cert.pdf"
    );

    expect(result).toEqual({
      uploadUrl: "https://storage.example/signed-upload",
      path: "onboarding/LF-HDC-00001/ndis_orientation/cert.pdf",
    });
  });

  it("returns uploadUrl and path for additional_training", async () => {
    const result = await getPortalComplianceUploadUrl(
      "LF-HDC-00001",
      "additional_training",
      "training.pdf"
    );

    expect(result).toEqual({
      uploadUrl: "https://storage.example/signed-upload",
      path: "onboarding/LF-HDC-00001/additional_training/training.pdf",
    });
  });

  it("returns error when storage throws", async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: "Bucket not found" },
    });

    const result = await getPortalComplianceUploadUrl(
      "LF-HDC-00001",
      "identity_right_to_work",
      "passport.pdf"
    );

    expect(result).toEqual({ error: "Bucket not found" });
  });
});

// ---------------------------------------------------------------------------
// recordPortalComplianceUpload
// ---------------------------------------------------------------------------

describe("recordPortalComplianceUpload", () => {
  it("returns success for identity_right_to_work and sets path + status", async () => {
    const result = await recordPortalComplianceUpload(
      "LF-HDC-00001",
      "identity_right_to_work",
      "onboarding/LF-HDC-00001/identity_right_to_work/passport.pdf"
    );

    expect(result).toEqual({ success: true });
    expect(mockEq).toHaveBeenCalledWith("id", "LF-HDC-00001");
  });

  it("returns success for car_insurance", async () => {
    const result = await recordPortalComplianceUpload(
      "LF-HDC-00001",
      "car_insurance",
      "onboarding/LF-HDC-00001/car_insurance/policy.pdf"
    );

    expect(result).toEqual({ success: true });
  });

  it("returns success for ndis_orientation", async () => {
    const result = await recordPortalComplianceUpload(
      "LF-HDC-00001",
      "ndis_orientation",
      "onboarding/LF-HDC-00001/ndis_orientation/module.pdf"
    );

    expect(result).toEqual({ success: true });
  });

  it("returns success for additional_training", async () => {
    const result = await recordPortalComplianceUpload(
      "LF-HDC-00001",
      "additional_training",
      "onboarding/LF-HDC-00001/additional_training/cert.pdf"
    );

    expect(result).toEqual({ success: true });
  });

  it("surfaces database error as error result", async () => {
    mockEq.mockResolvedValue({ error: { message: "RLS violation" } });

    const result = await recordPortalComplianceUpload(
      "LF-HDC-00001",
      "identity_right_to_work",
      "onboarding/LF-HDC-00001/identity_right_to_work/passport.pdf"
    );

    expect(result).toEqual({ error: "RLS violation" });
  });
});
