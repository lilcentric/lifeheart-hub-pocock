import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OnboardingRecord } from "@/lib/types";

vi.mock("@/lib/supabase/server");

import { TokenService } from "./token-service";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function makeSupabaseMock(terminalResult: unknown) {
  const single = vi.fn().mockResolvedValue(terminalResult);
  const is = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ single, is }));
  const select = vi.fn(() => ({ single, eq }));
  const insert = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
  const from = vi.fn(() => ({ insert, select, update }));
  return { from, insert, select, update, eq, is, single };
}

const RECORD: OnboardingRecord = {
  id: "LF-HDC-00001",
  staff_name: "Alice Example",
  created_by: null,
  onboarding_officer: "officer-uuid",
  date_onboarding_began: null,
  date_shift_began: null,
  archived_at: null,
  archived_by: null,
  contract_template_id: null,
  xero_employee_id: null,
  job_application_status: "completed",
  interview_status: "completed",
  reference_checks_status: "not_completed",
  cv_status: "not_completed",
  position_description_status: "not_completed",
  employment_contract_status: "not_completed",
  code_of_conduct_status: "not_completed",
  employee_details_form_status: "not_completed",
  identity_right_to_work_status: "not_completed",
  conflict_of_interest_status: "not_completed",
  wwcc_status: "not_completed",
  ndiswsc_status: "not_completed",
  ndis_orientation_status: "not_completed",
  qualifications_status: "not_completed",
  first_aid_cpr_status: "not_completed",
  car_insurance_status: "not_completed",
  training_status: "not_completed",
  orientation_induction_status: "not_completed",
  training_needs_status: "not_completed",
  uniforms_status: "not_completed",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("TokenService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generate", () => {
    it("returns a valid UUID and persists a row for the record", async () => {
      const mock = makeSupabaseMock({ data: { id: VALID_UUID }, error: null });
      mockCreateClient.mockResolvedValue(mock as never);

      const token = await TokenService.generate("LF-HDC-00001");

      expect(token).toBe(VALID_UUID);
      expect(mock.from).toHaveBeenCalledWith("onboarding_tokens");
      expect(mock.insert).toHaveBeenCalledWith({ record_id: "LF-HDC-00001" });
    });
  });

  describe("validate", () => {
    it("returns the associated onboarding record for a valid token", async () => {
      const mock = makeSupabaseMock({
        data: { id: VALID_UUID, record_id: RECORD.id, revoked_at: null, onboarding_records: RECORD },
        error: null,
      });
      mockCreateClient.mockResolvedValue(mock as never);

      const result = await TokenService.validate(VALID_UUID);

      expect(result).toEqual(RECORD);
    });

    it("returns null for a revoked token", async () => {
      const mock = makeSupabaseMock({ data: null, error: null });
      mockCreateClient.mockResolvedValue(mock as never);

      const result = await TokenService.validate(VALID_UUID);

      expect(result).toBeNull();
    });

    it("returns null for a token whose record is archived (revoked_at set)", async () => {
      // archived = token row has revoked_at, filtered out by .is("revoked_at", null)
      const mock = makeSupabaseMock({ data: null, error: null });
      mockCreateClient.mockResolvedValue(mock as never);

      const result = await TokenService.validate(VALID_UUID);

      expect(result).toBeNull();
    });
  });
});
