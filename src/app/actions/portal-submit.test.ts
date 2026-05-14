import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OnboardingRecord } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock hoisting
// ---------------------------------------------------------------------------

const { mockResolveStaffToken, mockGetUserById, mockSendSubmissionNotification } =
  vi.hoisted(() => {
    return {
      mockResolveStaffToken: vi.fn(),
      mockGetUserById: vi.fn(),
      mockSendSubmissionNotification: vi.fn(),
    };
  });

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  })),
}));

vi.mock("@/lib/token-service", () => ({
  resolveStaffToken: mockResolveStaffToken,
}));

vi.mock("@/lib/email-service", () => ({
  EmailService: {
    sendSubmissionNotification: mockSendSubmissionNotification,
  },
}));

import { submitPortalCompletion } from "./portal-submit";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RECORD: OnboardingRecord = {
  id: "LF-HDC-00001",
  staff_name: "Alice Example",
  created_by: null,
  onboarding_officer: "officer-uuid",
  date_onboarding_began: null,
  date_shift_began: null,
  job_application_status: "completed",
  interview_status: "completed",
  reference_checks_status: "not_completed",
  cv_status: "not_completed",
  position_description_status: "not_completed",
  employment_contract_status: "not_completed",
  code_of_conduct_status: "not_completed",
  employee_details_form_status: "not_completed",
  conflict_of_interest_status: "not_completed",
  screening_checks_status: "not_completed",
  ndiswsc_status: "not_completed",
  training_status: "not_completed",
  orientation_induction_status: "not_completed",
  identity_right_to_work_status: "not_completed",
  wwcc_status: "not_completed",
  ndis_orientation_status: "not_completed",
  qualifications_status: "not_completed",
  first_aid_cpr_status: "not_completed",
  car_insurance_status: "not_completed",
  training_needs_status: "not_completed",
  uniforms_status: "not_completed",
  archived_at: null,
  archived_by: null,
  employment_bundle_id: null,
  xero_employee_id: null,
  identity_right_to_work_storage_path: null,
  ndis_orientation_storage_path: null,
  car_insurance_storage_path: null,
  wwcc_storage_path: null,
  ndiswsc_storage_path: null,
  bundle_a_envelope_id: null,
  tna_envelope_id: null,
  tna_status: "not_completed",
  flexible_working_opted_in: false,
  signing_url: null,
  fwa_envelope_id: null,
  fwa_signing_url: null,
  flexible_working_status: "na",
  policies_status: "not_completed",
  additional_training_status: "not_completed",
  additional_training_storage_path: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockResolveStaffToken.mockResolvedValue(RECORD);
  mockGetUserById.mockResolvedValue({
    data: { user: { email: "officer@lifeheart.com.au" } },
    error: null,
  });
  mockSendSubmissionNotification.mockResolvedValue(undefined);
});

describe("submitPortalCompletion", () => {
  it("returns error and does not send email when token is invalid", async () => {
    mockResolveStaffToken.mockResolvedValue(null);

    const result = await submitPortalCompletion("bad-token");

    expect(result).toEqual({ error: "Invalid or expired link" });
    expect(mockSendSubmissionNotification).not.toHaveBeenCalled();
  });

  it("sends notification to officer email on valid token", async () => {
    const result = await submitPortalCompletion("good-token");

    expect(result).toEqual({ success: true });
    expect(mockSendSubmissionNotification).toHaveBeenCalledWith(
      "officer@lifeheart.com.au",
      "Alice Example",
      "LF-HDC-00001"
    );
  });

  it("surfaces email failure as error result", async () => {
    mockSendSubmissionNotification.mockRejectedValue(new Error("Resend rate limit"));

    const result = await submitPortalCompletion("good-token");

    expect(result).toEqual({ error: "Resend rate limit" });
  });
});
