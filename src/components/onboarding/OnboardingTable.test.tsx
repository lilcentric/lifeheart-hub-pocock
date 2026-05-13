// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(cleanup);
import React from "react";
import OnboardingTable from "./OnboardingTable";
import type { OnboardingStatus } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

const S: OnboardingStatus = "not_completed";

const BASE_RECORD = {
  id: "rec-1",
  created_by: null,
  staff_name: "Test Staff",
  onboarding_officer: "officer-1",
  date_onboarding_began: null,
  date_shift_began: null,
  job_application_status: S,
  interview_status: S,
  reference_checks_status: S,
  cv_status: S,
  position_description_status: S,
  employment_contract_status: S,
  code_of_conduct_status: S,
  employee_details_form_status: S,
  conflict_of_interest_status: S,
  ndiswsc_status: S,
  identity_right_to_work_status: S,
  wwcc_status: S,
  ndis_orientation_status: S,
  qualifications_status: S,
  first_aid_cpr_status: S,
  car_insurance_status: S,
  training_status: S,
  orientation_induction_status: S,
  training_needs_status: S,
  uniforms_status: S,
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
  tna_status: S,
  screening_checks_status: S,
  signing_url: null,
  flexible_working_opted_in: false,
  fwa_envelope_id: null,
  fwa_signing_url: null,
  flexible_working_status: S,
  policies_status: S,
  additional_training_status: S,
  additional_training_storage_path: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  officer_profile: null,
};

describe("OnboardingTable status cell", () => {
  it("renders fallback when a status value is null at runtime", () => {
    const record = {
      ...BASE_RECORD,
      job_application_status: null as unknown as OnboardingStatus,
    };
    render(
      <OnboardingTable
        records={[record]}
        canWrite={false}
        currentUserId="user-1"
        currentUserRole="viewer"
      />
    );
    const fallbacks = screen.getAllByText("—");
    expect(fallbacks.length).toBeGreaterThan(0);
  });

  it("renders fallback when a status value is undefined at runtime", () => {
    const record = {
      ...BASE_RECORD,
      interview_status: undefined as unknown as OnboardingStatus,
    };
    render(
      <OnboardingTable
        records={[record]}
        canWrite={false}
        currentUserId="user-1"
        currentUserRole="viewer"
      />
    );
    const fallbacks = screen.getAllByText("—");
    expect(fallbacks.length).toBeGreaterThan(0);
  });

  it("renders without crashing when all status values are valid", () => {
    render(
      <OnboardingTable
        records={[BASE_RECORD]}
        canWrite={false}
        currentUserId="user-1"
        currentUserRole="viewer"
      />
    );
    expect(screen.getAllByText("Test Staff").length).toBeGreaterThan(0);
  });
});
