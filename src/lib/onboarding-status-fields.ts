import type { OnboardingRecord } from "./types";

// All keys on OnboardingRecord ending in _status — auto-synced with the type.
type StatusFieldKey = {
  [K in keyof OnboardingRecord]: K extends `${string}_status` ? K : never;
}[keyof OnboardingRecord];

// Registry of every _status field. true = included in deriveOverallStatus.
// TypeScript enforces exhaustiveness: adding a _status field to OnboardingRecord
// without listing it here is a compile error.
const REGISTRY = {
  // Recruitment
  job_application_status: true,
  interview_status: true,
  reference_checks_status: true,
  cv_status: true,

  // Documentation
  position_description_status: true,
  employment_contract_status: true,
  code_of_conduct_status: true,
  employee_details_form_status: true,
  conflict_of_interest_status: true,

  // Compliance
  ndiswsc_status: true,
  identity_right_to_work_status: true,
  wwcc_status: true,
  ndis_orientation_status: true,
  qualifications_status: true,
  first_aid_cpr_status: true,
  car_insurance_status: true,

  // Training & Induction
  training_status: true,
  orientation_induction_status: true,

  // TNA
  tna_status: true,

  // Legacy — dimmed in UI, retained for audit trail
  training_needs_status: true,
  uniforms_status: true,

  // Migration / optional — excluded from overall completion check
  screening_checks_status: false,  // superseded by ndiswsc_status
  flexible_working_status: false,  // FWA optional; tracked separately per CONTEXT.md
  policies_status: false,          // set by employment bundle webhook, not a standalone checklist item
  additional_training_status: false, // optional upload, not a blocking requirement
} as const satisfies Record<StatusFieldKey, boolean>;

export type StatusField = {
  [K in StatusFieldKey]: (typeof REGISTRY)[K] extends true ? K : never;
}[StatusFieldKey];

export const ALL_STATUS_FIELDS = (
  Object.entries(REGISTRY) as [StatusFieldKey, boolean][]
)
  .filter(([, include]) => include)
  .map(([k]) => k) as StatusField[];
