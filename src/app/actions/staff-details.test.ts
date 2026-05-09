import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OnboardingRecord, OnboardingToken } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock hoisting
// ---------------------------------------------------------------------------

const { mockValidateToken, mockUpsert, mockUpdate, mockServiceClient } =
  vi.hoisted(() => {
    const mockUpsert = vi.fn();
    const mockUpdate = vi.fn();

    // Minimal Supabase chain for staff_details upsert
    const staffDetailsChain = { upsert: mockUpsert };
    // Minimal Supabase chain for onboarding_records update
    const recordsUpdateChain = {
      update: vi.fn(() => ({ eq: mockUpdate })),
    };

    const mockFrom = vi.fn((table: string) => {
      if (table === "staff_details") return staffDetailsChain;
      if (table === "onboarding_records") return recordsUpdateChain;
      return {};
    });

    const mockServiceClient = { from: mockFrom };
    const mockValidateToken = vi.fn();

    return { mockValidateToken, mockUpsert, mockUpdate, mockServiceClient };
  });

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
}));

vi.mock("@/lib/token-service", () => ({
  validateToken: mockValidateToken,
}));

import { submitStaffDetails } from "./staff-details";

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
  contract_template_id: null,
  xero_employee_id: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const VALID_INPUT = {
  full_name: "Alice Example",
  preferred_name: "Ali",
  personal_email: "alice@example.com",
  phone: "0400000000",
  emergency_contact_name: "Bob Example",
  emergency_contact_relationship: "Spouse",
  emergency_contact_phone: "0411111111",
  citizenship_status: "australian_citizen",
  visa_type: undefined,
  visa_expiry_date: undefined,
} as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
  mockUpdate.mockResolvedValue({ error: null });
});

describe("submitStaffDetails", () => {
  it("returns error when token is invalid or expired", async () => {
    mockValidateToken.mockResolvedValue(null);

    const result = await submitStaffDetails("bad-token", VALID_INPUT);

    expect(result).toEqual({ error: "Invalid or expired link" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("upserts staff_details row on valid token", async () => {
    mockValidateToken.mockResolvedValue(RECORD);

    const result = await submitStaffDetails("good-token", VALID_INPUT);

    expect(result).toEqual({ success: true });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        record_id: "LF-HDC-00001",
        first_name: "Alice",
        last_name: "Example",
        preferred_name: "Ali",
        personal_email: "alice@example.com",
        right_to_work: "australian_citizen",
      }),
      { onConflict: "record_id" }
    );
  });

  it("updates employee_details_form_status to completed on success", async () => {
    mockValidateToken.mockResolvedValue(RECORD);

    await submitStaffDetails("good-token", VALID_INPUT);

    expect(mockUpdate).toHaveBeenCalledWith("id", "LF-HDC-00001");
  });

  it("returns error when upsert fails", async () => {
    mockValidateToken.mockResolvedValue(RECORD);
    mockUpsert.mockResolvedValue({ error: { message: "DB write failed" } });

    const result = await submitStaffDetails("good-token", VALID_INPUT);

    expect(result).toEqual({ error: "DB write failed" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns error when status update fails", async () => {
    mockValidateToken.mockResolvedValue(RECORD);
    mockUpdate.mockResolvedValue({ error: { message: "Status update failed" } });

    const result = await submitStaffDetails("good-token", VALID_INPUT);

    expect(result).toEqual({ error: "Status update failed" });
  });
});
