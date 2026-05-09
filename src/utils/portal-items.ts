import type { OnboardingRecord, OnboardingStatus } from "@/lib/types";

export interface ChecklistItem {
  key: string;
  label: string;
  status: OnboardingStatus;
}

type StaffStatusKey = keyof Pick<
  OnboardingRecord,
  | "position_description_status"
  | "employment_contract_status"
  | "code_of_conduct_status"
  | "employee_details_form_status"
  | "conflict_of_interest_status"
  | "ndiswsc_status"
  | "training_status"
  | "orientation_induction_status"
  | "qualifications_status"
  | "first_aid_cpr_status"
>;

const STAFF_ITEMS: { key: StaffStatusKey; label: string }[] = [
  { key: "position_description_status", label: "Position Description" },
  { key: "employment_contract_status", label: "Employment Contract" },
  { key: "code_of_conduct_status", label: "Code of Conduct" },
  { key: "employee_details_form_status", label: "Employee Details Form" },
  { key: "conflict_of_interest_status", label: "Conflict of Interest" },
  { key: "ndiswsc_status", label: "NDIS Worker Screening Check" },
  { key: "training_status", label: "Training" },
  { key: "orientation_induction_status", label: "Orientation & Induction" },
  { key: "qualifications_status", label: "Qualifications" },
  { key: "first_aid_cpr_status", label: "First Aid & CPR" },
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
