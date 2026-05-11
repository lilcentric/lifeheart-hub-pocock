import { describe, it, expect } from "vitest";
import { getPortalItems } from "./portal-items";
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
  conflict_of_interest_status: "not_completed",
  wwcc_status: "in_progress",
  ndiswsc_status: "not_completed",
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
  // Overhaul fields
  pd_coc_template_id: null,
  flexible_working_opted_in: false,
  signing_url: null,
  policies_status: "not_completed",
  additional_training_status: "not_completed",
  additional_training_storage_path: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("getPortalItems", () => {
  it("returns exactly 13 items", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    expect(items).toHaveLength(13);
  });

  it("returns items in the correct order", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual([
      "employee_details_form_status",
      "position_description_status",
      "employment_contract_status",
      "policies_status",
      "conflict_of_interest_status",
      "identity_right_to_work_status",
      "car_insurance_status",
      "wwcc_status",
      "ndiswsc_status",
      "ndis_orientation_status",
      "additional_training_status",
      "qualifications_status",
      "first_aid_cpr_status",
    ]);
  });

  it("item 1 is kind=form with correct href", () => {
    const [first] = getPortalItems(baseRecord, "tok-abc");
    expect(first).toMatchObject({
      kind: "form",
      key: "employee_details_form_status",
      href: "/onboard/tok-abc/details",
    });
  });

  it("sign items carry signingUrl from record", () => {
    const record = { ...baseRecord, signing_url: "https://sign.annature.com.au/xyz" };
    const items = getPortalItems(record, "tok-abc");
    const signItems = items.filter((i) => i.kind === "sign");

    expect(signItems).toHaveLength(4);
    for (const item of signItems) {
      expect((item as { signingUrl: string | null }).signingUrl).toBe(
        "https://sign.annature.com.au/xyz"
      );
    }
  });

  it("sign items carry signingUrl=null when record has no signing_url", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const signItems = items.filter((i) => i.kind === "sign");

    for (const item of signItems) {
      expect((item as { signingUrl: string | null }).signingUrl).toBeNull();
    }
  });

  it("wwcc_status item has howToGetItUrl set", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const wwcc = items.find((i) => i.key === "wwcc_status");
    expect(wwcc).toBeDefined();
    expect((wwcc as { howToGetItUrl?: string }).howToGetItUrl).toContain("service.nsw.gov.au");
  });

  it("ndiswsc_status item has howToGetItUrl set", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const ndis = items.find((i) => i.key === "ndiswsc_status");
    expect((ndis as { howToGetItUrl?: string }).howToGetItUrl).toContain("service.nsw.gov.au");
  });

  it("car_insurance_status does not have howToGetItUrl", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const car = items.find((i) => i.key === "car_insurance_status");
    expect((car as { howToGetItUrl?: string }).howToGetItUrl).toBeUndefined();
  });

  it("additional_training_status appears at position 11 (index 10)", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    expect(items[10].key).toBe("additional_training_status");
    expect(items[10].label).toBe("Additional Training Certificates");
  });

  it("ndiswsc_status maps pending_verification to in_progress", () => {
    const record = { ...baseRecord, ndiswsc_status: "pending_verification" as const };
    const items = getPortalItems(record, "tok-abc");
    const ndis = items.find((i) => i.key === "ndiswsc_status");
    expect(ndis?.status).toBe("in_progress");
  });

  it("does not include orientation_induction_status", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("orientation_induction_status");
  });

  it("does not include tna_status", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("tna_status");
  });

  it("does not include training_status", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("training_status");
  });

  it("qualifications and first_aid_cpr are kind=multi-upload", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const qual = items.find((i) => i.key === "qualifications_status");
    const fac = items.find((i) => i.key === "first_aid_cpr_status");
    expect(qual?.kind).toBe("multi-upload");
    expect(fac?.kind).toBe("multi-upload");
  });
});
