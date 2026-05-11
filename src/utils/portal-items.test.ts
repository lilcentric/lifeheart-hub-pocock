import { describe, it, expect } from "vitest";
import { getStaffFacingItems, getUploadItems } from "./portal-items";
import type { OnboardingRecord } from "@/lib/types";

const baseRecord: OnboardingRecord = {
  id: "LF-HDC-00001",
  created_by: null,
  staff_name: "Jane Doe",
  onboarding_officer: "officer-uuid",
  date_onboarding_began: null,
  date_shift_began: null,
  archived_at: null,
  archived_by: null,
  contract_template_id: null,
  xero_employee_id: null,
  job_application_status: "completed",
  interview_status: "completed",
  reference_checks_status: "completed",
  cv_status: "na",
  position_description_status: "not_received",
  employment_contract_status: "not_signed",
  code_of_conduct_status: "in_progress",
  employee_details_form_status: "not_completed",
  identity_right_to_work_status: "not_completed",
  car_insurance_status: "not_completed",
  conflict_of_interest_status: "completed",
  wwcc_status: "in_progress",
  ndiswsc_status: "pending_verification",
  ndis_orientation_status: "not_completed",
  qualifications_status: "not_completed",
  first_aid_cpr_status: "not_completed",
  training_status: "not_completed",
  orientation_induction_status: "not_completed",
  training_needs_status: "na",
  uniforms_status: "na",
  screening_checks_status: "not_completed",
  tna_status: "not_completed",
  identity_right_to_work_storage_path: null,
  ndis_orientation_storage_path: null,
  car_insurance_storage_path: null,
  wwcc_storage_path: null,
  ndiswsc_storage_path: null,
  bundle_a_envelope_id: null,
  tna_envelope_id: null,
  bundle_b_envelope_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("getStaffFacingItems", () => {
  it("excludes admin-only and legacy fields", () => {
    const items = getStaffFacingItems(baseRecord);
    const keys = items.map((i) => i.key);

    expect(keys).not.toContain("job_application_status");
    expect(keys).not.toContain("interview_status");
    expect(keys).not.toContain("reference_checks_status");
    expect(keys).not.toContain("cv_status");
    expect(keys).not.toContain("training_needs_status");
    expect(keys).not.toContain("uniforms_status");
  });

  it("includes all staff-facing checklist items with correct labels and statuses", () => {
    const items = getStaffFacingItems(baseRecord);
    const byKey = Object.fromEntries(items.map((i) => [i.key, i]));

    expect(byKey["position_description_status"]).toMatchObject({
      label: "Position Description",
      status: "not_received",
    });
    expect(byKey["employment_contract_status"]).toMatchObject({
      label: "Employment Contract",
      status: "not_signed",
    });
    expect(byKey["code_of_conduct_status"]).toMatchObject({
      label: "Code of Conduct",
      status: "in_progress",
    });
    expect(byKey["wwcc_status"]).toMatchObject({
      label: "Working With Children Check",
      status: "in_progress",
    });
    expect(byKey["wwcc_status"]).toMatchObject({
      label: "Working With Children Check",
      status: "not_completed",
    });
    expect(byKey["training_status"]).toMatchObject({
      label: "Training",
      status: "not_completed",
    });
    expect(byKey["orientation_induction_status"]).toMatchObject({
      label: "Orientation & Induction",
      status: "not_completed",
    });
  });

  it("maps pending_verification to in_progress for staff display", () => {
    const items = getStaffFacingItems(baseRecord);
    const ndis = items.find((i) => i.key === "ndiswsc_status");

    expect(ndis?.status).toBe("in_progress");
  });

  it("includes qualifications_status with correct label and status", () => {
    const record = { ...baseRecord, qualifications_status: "not_completed" as const };
    const items = getStaffFacingItems(record);
    const item = items.find((i) => i.key === "qualifications_status");

    expect(item).toMatchObject({ label: "Qualifications", status: "not_completed" });
  });

  it("includes first_aid_cpr_status with correct label and status", () => {
    const record = { ...baseRecord, first_aid_cpr_status: "completed" as const };
    const items = getStaffFacingItems(record);
    const item = items.find((i) => i.key === "first_aid_cpr_status");

    expect(item).toMatchObject({ label: "First Aid & CPR", status: "completed" });
  });
});

describe("getUploadItems", () => {
  it("returns the three single-file upload items", () => {
    const items = getUploadItems(baseRecord);
    const keys = items.map((i) => i.key);

    expect(keys).toContain("identity_right_to_work_status");
    expect(keys).toContain("ndis_orientation_status");
    expect(keys).toContain("car_insurance_status");
    expect(items).toHaveLength(3);
  });

  it("returns correct labels and document types", () => {
    const items = getUploadItems(baseRecord);
    const byKey = Object.fromEntries(items.map((i) => [i.key, i]));

    expect(byKey["identity_right_to_work_status"]).toMatchObject({
      label: "Identity & Right to Work",
      documentType: "identity_right_to_work",
      status: "not_completed",
    });
    expect(byKey["ndis_orientation_status"]).toMatchObject({
      label: "NDIS Worker Orientation Module",
      documentType: "ndis_orientation",
      status: "not_completed",
    });
    expect(byKey["car_insurance_status"]).toMatchObject({
      label: "Car Insurance",
      documentType: "car_insurance",
      status: "not_completed",
    });
  });

  it("reflects the current status from the record", () => {
    const items = getUploadItems({
      ...baseRecord,
      identity_right_to_work_status: "completed",
      ndis_orientation_status: "in_progress",
    });
    const byKey = Object.fromEntries(items.map((i) => [i.key, i]));

    expect(byKey["identity_right_to_work_status"].status).toBe("completed");
    expect(byKey["ndis_orientation_status"].status).toBe("in_progress");
    expect(byKey["car_insurance_status"].status).toBe("not_completed");
  });
});
