import type { OnboardingStatus, OnboardingRecord } from "@/lib/types";

interface StatusMeta {
  label: string;
  className: string;
}

const STATUS_META: Record<OnboardingStatus, StatusMeta> = {
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  not_completed: {
    label: "Not Completed",
    className: "bg-red-100 text-red-800",
  },
  not_received: {
    label: "Not Received",
    className: "bg-red-100 text-red-800",
  },
  not_signed: {
    label: "Not Signed",
    className: "bg-red-100 text-red-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-800",
  },
  pending_verification: {
    label: "Pending Verification",
    className: "bg-amber-100 text-amber-800",
  },
  na: {
    label: "N/A",
    className: "bg-gray-100 text-gray-600",
  },
};

export function getStatusMeta(status: OnboardingStatus): StatusMeta {
  return STATUS_META[status];
}

// Status values valid for document fields (support not_received / not_signed)
export const DOCUMENT_STATUSES: OnboardingStatus[] = [
  "completed",
  "not_completed",
  "not_received",
  "not_signed",
  "in_progress",
  "na",
];

// Status values valid for non-document fields
export const GENERAL_STATUSES: OnboardingStatus[] = [
  "completed",
  "not_completed",
  "in_progress",
  "na",
];

// Document fields per CONTEXT.md (supports not_received / not_signed)
export const DOCUMENT_FIELDS: (keyof OnboardingRecord)[] = [
  "position_description_status",
  "employment_contract_status",
  "code_of_conduct_status",
  "employee_details_form_status",
  "conflict_of_interest_status",
];

export function isDocumentField(field: keyof OnboardingRecord): boolean {
  return DOCUMENT_FIELDS.includes(field);
}

type StatusField = keyof Pick<
  OnboardingRecord,
  | "job_application_status"
  | "interview_status"
  | "reference_checks_status"
  | "cv_status"
  | "position_description_status"
  | "employment_contract_status"
  | "code_of_conduct_status"
  | "employee_details_form_status"
  | "conflict_of_interest_status"
  | "ndiswsc_status"
  | "training_status"
  | "orientation_induction_status"
  | "identity_right_to_work_status"
  | "wwcc_status"
  | "ndis_orientation_status"
  | "qualifications_status"
  | "first_aid_cpr_status"
  | "car_insurance_status"
  | "training_needs_status"
  | "uniforms_status"
  | "tna_status"
>;

const ALL_STATUS_FIELDS: StatusField[] = [
  "job_application_status",
  "interview_status",
  "reference_checks_status",
  "cv_status",
  "position_description_status",
  "employment_contract_status",
  "code_of_conduct_status",
  "employee_details_form_status",
  "conflict_of_interest_status",
  "ndiswsc_status",
  "training_status",
  "orientation_induction_status",
  "identity_right_to_work_status",
  "wwcc_status",
  "ndis_orientation_status",
  "qualifications_status",
  "first_aid_cpr_status",
  "car_insurance_status",
  "training_needs_status",
  "uniforms_status",
  "tna_status",
];

export function deriveOverallStatus(
  record: Pick<OnboardingRecord, StatusField>
): "Completed" | "In Progress" {
  const allDone = ALL_STATUS_FIELDS.every(
    (field) => record[field] === "completed" || record[field] === "na"
  );
  return allDone ? "Completed" : "In Progress";
}
