import type { OnboardingRecord, OnboardingStatus } from "@/lib/types";
import type { ComplianceDocumentType } from "@/app/actions/compliance-upload-logic";

export interface ChecklistItem {
  key: string;
  label: string;
  status: OnboardingStatus;
}

export interface UploadChecklistItem extends ChecklistItem {
  documentType: ComplianceDocumentType;
}

type StaffStatusKey = keyof Pick<
  OnboardingRecord,
  | "position_description_status"
  | "employment_contract_status"
  | "code_of_conduct_status"
  | "employee_details_form_status"
  | "identity_right_to_work_status"
  | "car_insurance_status"
  | "conflict_of_interest_status"
  | "wwcc_status"
  | "ndiswsc_status"
  | "training_status"
  | "orientation_induction_status"
>;

const STAFF_ITEMS: { key: StaffStatusKey; label: string }[] = [
  { key: "position_description_status", label: "Position Description" },
  { key: "employment_contract_status", label: "Employment Contract" },
  { key: "code_of_conduct_status", label: "Code of Conduct" },
  { key: "employee_details_form_status", label: "Employee Details Form" },
  { key: "identity_right_to_work_status", label: "Identity & Right to Work" },
  { key: "car_insurance_status", label: "Car Insurance" },
  { key: "conflict_of_interest_status", label: "Conflict of Interest" },
  { key: "wwcc_status", label: "Working With Children Check" },
  { key: "ndiswsc_status", label: "NDIS Worker Screening Check" },
  { key: "training_status", label: "Training" },
  { key: "orientation_induction_status", label: "Orientation & Induction" },
];

const UPLOAD_ITEMS: {
  key: keyof Pick<
    OnboardingRecord,
    | "identity_right_to_work_status"
    | "ndis_orientation_status"
    | "car_insurance_status"
  >;
  label: string;
  documentType: ComplianceDocumentType;
}[] = [
  {
    key: "identity_right_to_work_status",
    label: "Identity & Right to Work",
    documentType: "identity_right_to_work",
  },
  {
    key: "ndis_orientation_status",
    label: "NDIS Worker Orientation Module",
    documentType: "ndis_orientation",
  },
  {
    key: "car_insurance_status",
    label: "Car Insurance",
    documentType: "car_insurance",
  },
];

function toStaffStatus(status: OnboardingStatus): OnboardingStatus {
  return status === "pending_verification" ? "in_progress" : status;
}

export function getStaffFacingItems(record: OnboardingRecord): ChecklistItem[] {
  return STAFF_ITEMS.map(({ key, label }) => ({
    key,
    label,
    status: toStaffStatus(record[key]),
  }));
}

export function getUploadItems(record: OnboardingRecord): UploadChecklistItem[] {
  return UPLOAD_ITEMS.map(({ key, label, documentType }) => ({
    key,
    label,
    documentType,
    status: record[key],
  }));
}
