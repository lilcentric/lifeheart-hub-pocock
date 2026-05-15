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
  employment_bundle_id: null,
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
  tna_status: "not_completed",
  identity_right_to_work_storage_path: null,
  ndis_orientation_storage_path: null,
  car_insurance_storage_path: null,
  wwcc_storage_path: null,
  ndiswsc_storage_path: null,
  bundle_a_envelope_id: null,
  tna_envelope_id: null,
  // Overhaul fields
  flexible_working_opted_in: false,
  signing_url: null,
  fwa_envelope_id: null,
  fwa_signing_url: null,
  flexible_working_status: "na",
  policies_status: "not_completed",
  additional_training_status: "not_completed",
  additional_training_storage_path: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("getPortalItems", () => {
  it("returns exactly 12 items when flexible_working_opted_in is false", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    expect(items).toHaveLength(12);
  });

  it("returns exactly 13 items when flexible_working_opted_in is true", () => {
    const record = { ...baseRecord, flexible_working_opted_in: true, flexible_working_status: "not_completed" as const };
    const items = getPortalItems(record, "tok-abc");
    expect(items).toHaveLength(13);
  });

  it("item 4 (index 3) is flexible_working_status with kind=sign and uses fwa_signing_url", () => {
    const record = {
      ...baseRecord,
      flexible_working_opted_in: true,
      flexible_working_status: "not_completed" as const,
      fwa_signing_url: "https://sign.annature.com.au/fwa-123",
    };
    const items = getPortalItems(record, "tok-abc");
    const fwaItem = items[3];
    expect(fwaItem).toMatchObject({
      key: "flexible_working_status",
      kind: "sign",
      label: "Flexible Working Agreement",
      status: "not_completed",
    });
    expect((fwaItem as { signingUrl: string | null }).signingUrl).toBe("https://sign.annature.com.au/fwa-123");
  });

  it("flexible_working_status item has signingUrl=null when fwa_signing_url is null", () => {
    const record = { ...baseRecord, flexible_working_opted_in: true, flexible_working_status: "not_completed" as const };
    const items = getPortalItems(record, "tok-abc");
    const fwaItem = items[3];
    expect((fwaItem as { signingUrl: string | null }).signingUrl).toBeNull();
  });

  it("returns items in the correct order", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual([
      "employee_details_form_status",
      "position_description_status",
      "employment_contract_status",
      "policies_status",
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

  it("sign items carry signingUrl from record (3 sign items when opted_in=false)", () => {
    const record = { ...baseRecord, signing_url: "https://sign.annature.com.au/xyz" };
    const items = getPortalItems(record, "tok-abc");
    const signItems = items.filter((i) => i.kind === "sign");

    expect(signItems).toHaveLength(3);
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

  it("additional_training_status appears at position 10 (index 9)", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    expect(items[9].key).toBe("additional_training_status");
    expect(items[9].label).toBe("Additional Training Certificates");
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

  it("merged row label is 'Position Description, Code of Conduct & Conflict of Interest' and status comes from position_description_status", () => {
    const record = { ...baseRecord, position_description_status: "completed" as const };
    const items = getPortalItems(record, "tok-abc");
    const merged = items.find((i) => i.key === "position_description_status");
    expect(merged).toMatchObject({
      label: "Position Description, Code of Conduct & Conflict of Interest",
      status: "completed",
      kind: "sign",
    });
  });

  it("FWA at index 3 sits between Employment Contract (index 2) and Policies (index 4)", () => {
    const record = { ...baseRecord, flexible_working_opted_in: true, flexible_working_status: "not_completed" as const };
    const items = getPortalItems(record, "tok-abc");
    expect(items[2].key).toBe("employment_contract_status");
    expect(items[3].key).toBe("flexible_working_status");
    expect(items[4].key).toBe("policies_status");
  });

  it("does not include conflict_of_interest_status as a separate portal row", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    expect(items.map((i) => i.key)).not.toContain("conflict_of_interest_status");
  });

  it("qualifications and first_aid_cpr are kind=multi-upload", () => {
    const items = getPortalItems(baseRecord, "tok-abc");
    const qual = items.find((i) => i.key === "qualifications_status");
    const fac = items.find((i) => i.key === "first_aid_cpr_status");
    expect(qual?.kind).toBe("multi-upload");
    expect(fac?.kind).toBe("multi-upload");
  });
});
