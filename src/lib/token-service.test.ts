import { describe, it, expect, vi } from "vitest";
import { validateToken } from "./token-service";
import type { OnboardingToken, OnboardingRecord } from "./types";

const baseRecord: OnboardingRecord = {
  id: "LF-HDC-00001",
  created_by: null,
  staff_name: "Jane Doe",
  onboarding_officer: "officer-uuid",
  date_onboarding_began: null,
  date_shift_began: null,
  archived: false,
  job_application_status: "not_completed",
  interview_status: "not_completed",
  reference_checks_status: "not_completed",
  cv_status: "na",
  position_description_status: "not_completed",
  employment_contract_status: "not_completed",
  code_of_conduct_status: "not_completed",
  employee_details_form_status: "not_completed",
  id_verification_status: "not_completed",
  relevant_insurance_status: "not_completed",
  conflict_of_interest_status: "not_completed",
  screening_checks_status: "not_completed",
  ndiswsc_status: "not_completed",
  training_status: "not_completed",
  orientation_induction_status: "not_completed",
  training_needs_status: "na",
  uniforms_status: "na",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const validToken: OnboardingToken = {
  token: "abc-123",
  record_id: "LF-HDC-00001",
  revoked_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("validateToken", () => {
  it("returns the onboarding record for a valid, unrevoked token", async () => {
    const deps = {
      lookupToken: vi.fn().mockResolvedValue({ data: validToken, error: null }),
      getRecord: vi.fn().mockResolvedValue({ data: baseRecord, error: null }),
    };

    const result = await validateToken("abc-123", deps);

    expect(result).toEqual(baseRecord);
    expect(deps.lookupToken).toHaveBeenCalledWith("abc-123");
    expect(deps.getRecord).toHaveBeenCalledWith("LF-HDC-00001");
  });

  it("returns null for an unknown token", async () => {
    const deps = {
      lookupToken: vi.fn().mockResolvedValue({ data: null, error: null }),
      getRecord: vi.fn(),
    };

    const result = await validateToken("unknown-token", deps);

    expect(result).toBeNull();
    expect(deps.getRecord).not.toHaveBeenCalled();
  });

  it("returns null for a revoked token", async () => {
    const revokedToken: OnboardingToken = {
      ...validToken,
      revoked_at: "2026-02-01T00:00:00Z",
    };
    const deps = {
      lookupToken: vi.fn().mockResolvedValue({ data: revokedToken, error: null }),
      getRecord: vi.fn(),
    };

    const result = await validateToken("abc-123", deps);

    expect(result).toBeNull();
    expect(deps.getRecord).not.toHaveBeenCalled();
  });

  it("returns null when the associated record is archived", async () => {
    const archivedRecord: OnboardingRecord = { ...baseRecord, archived: true };
    const deps = {
      lookupToken: vi.fn().mockResolvedValue({ data: validToken, error: null }),
      getRecord: vi.fn().mockResolvedValue({ data: archivedRecord, error: null }),
    };

    const result = await validateToken("abc-123", deps);

    expect(result).toBeNull();
  });
});
