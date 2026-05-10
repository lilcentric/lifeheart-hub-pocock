import { describe, it, expect } from "vitest";
import {
  getStatusMeta,
  deriveOverallStatus,
  isDocumentField,
} from "./status-utils";

// ---------------------------------------------------------------------------
// getStatusMeta
// ---------------------------------------------------------------------------

describe("getStatusMeta", () => {
  it("returns metadata for pending_verification", () => {
    const meta = getStatusMeta("pending_verification");
    expect(meta.label).toBeDefined();
    expect(meta.className).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// deriveOverallStatus
// ---------------------------------------------------------------------------

describe("deriveOverallStatus", () => {
  const BASE = {
    job_application_status: "completed",
    interview_status: "completed",
    reference_checks_status: "completed",
    cv_status: "completed",
    position_description_status: "completed",
    employment_contract_status: "completed",
    code_of_conduct_status: "completed",
    employee_details_form_status: "completed",
    conflict_of_interest_status: "completed",
    screening_checks_status: "completed",
    training_status: "completed",
    orientation_induction_status: "completed",
    training_needs_status: "completed",
    uniforms_status: "completed",
    // new Phase 2 fields
    identity_right_to_work_status: "completed",
    wwcc_status: "completed",
    ndiswsc_status: "completed",
    ndis_orientation_status: "completed",
    qualifications_status: "completed",
    first_aid_cpr_status: "completed",
    car_insurance_status: "completed",
  } as const;

  it("returns Completed when all new fields are completed", () => {
    expect(deriveOverallStatus(BASE)).toBe("Completed");
  });

  it("returns In Progress when a new field is not_completed", () => {
    expect(
      deriveOverallStatus({ ...BASE, ndiswsc_status: "not_completed" })
    ).toBe("In Progress");
  });

  it("returns In Progress when a new field is pending_verification", () => {
    expect(
      deriveOverallStatus({ ...BASE, ndiswsc_status: "pending_verification" })
    ).toBe("In Progress");
  });
});

// ---------------------------------------------------------------------------
// isDocumentField
// ---------------------------------------------------------------------------

describe("isDocumentField", () => {
  it("returns false for id_verification_status (removed)", () => {
    expect(isDocumentField("id_verification_status" as never)).toBe(false);
  });

  it("returns false for relevant_insurance_status (removed)", () => {
    expect(isDocumentField("relevant_insurance_status" as never)).toBe(false);
  });

  it("returns true for position_description_status (retained document field)", () => {
    expect(isDocumentField("position_description_status")).toBe(true);
  });
});
