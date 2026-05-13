import type { OnboardingRecord } from "./types";

// All keys on OnboardingRecord ending in _status — auto-synced with the type.
type StatusFieldKey = {
  [K in keyof OnboardingRecord]: K extends `${string}_status` ? K : never;
}[keyof OnboardingRecord];

type RegistryEntry = {
  include: boolean;   // true = counted in deriveOverallStatus
  group: string;      // column group label for the tracker table
  label: string;      // short display label for the table column header
  legacy?: true;      // dimmed in the tracker UI, pending removal
};

// Registry of every _status field. TypeScript enforces exhaustiveness: adding a
// _status column to OnboardingRecord without listing it here is a compile error.
const REGISTRY = {
  // Recruitment
  job_application_status:   { include: true,  group: "Recruitment",           label: "Job Application" },
  interview_status:         { include: true,  group: "Recruitment",           label: "Interview" },
  reference_checks_status:  { include: true,  group: "Recruitment",           label: "References" },
  cv_status:                { include: true,  group: "Recruitment",           label: "CV",           legacy: true },

  // Documentation
  position_description_status:  { include: true, group: "Documentation", label: "Position Description" },
  employment_contract_status:   { include: true, group: "Documentation", label: "Contract" },
  code_of_conduct_status:       { include: true, group: "Documentation", label: "Code of Conduct" },
  employee_details_form_status: { include: true, group: "Documentation", label: "Employee Details" },
  conflict_of_interest_status:  { include: true, group: "Documentation", label: "Conflict of Interest" },

  // Compliance
  identity_right_to_work_status: { include: true, group: "Compliance & Identity", label: "ID / Right to Work" },
  wwcc_status:                   { include: true, group: "Compliance & Identity", label: "WWCC" },
  ndiswsc_status:                { include: true, group: "Compliance & Identity", label: "NDISWSC" },
  ndis_orientation_status:       { include: true, group: "Compliance & Identity", label: "NDIS Orientation" },
  qualifications_status:         { include: true, group: "Compliance & Identity", label: "Qualifications" },
  first_aid_cpr_status:          { include: true, group: "Compliance & Identity", label: "First Aid & CPR" },
  car_insurance_status:          { include: true, group: "Compliance & Identity", label: "Car Insurance" },

  // Training & Induction
  training_status:             { include: true, group: "Training", label: "Training" },
  orientation_induction_status:{ include: true, group: "Training", label: "Orientation/Induction" },
  training_needs_status:       { include: true, group: "Training", label: "Training Needs", legacy: true },

  // TNA
  tna_status: { include: true, group: "Admin", label: "TNA" },

  // Legacy — retained for audit trail
  uniforms_status: { include: true, group: "Admin", label: "Uniforms", legacy: true },

  // Excluded from overall completion check
  screening_checks_status:    { include: false, group: "Admin", label: "Screening Checks" },   // superseded by ndiswsc_status
  flexible_working_status:    { include: false, group: "Admin", label: "Flexible Working" },   // FWA optional; tracked separately
  policies_status:            { include: false, group: "Admin", label: "Policies" },            // set by webhook, not a standalone item
  additional_training_status: { include: false, group: "Admin", label: "Additional Training" }, // optional upload
} as const satisfies Record<StatusFieldKey, RegistryEntry>;

export type StatusField = {
  [K in StatusFieldKey]: (typeof REGISTRY)[K]["include"] extends true ? K : never;
}[StatusFieldKey];

export const ALL_STATUS_FIELDS = (
  Object.entries(REGISTRY) as [StatusFieldKey, RegistryEntry][]
)
  .filter(([, entry]) => entry.include)
  .map(([k]) => k) as StatusField[];

// Column group structure derived from the registry — used by OnboardingTable.
export type ColumnGroupConfig = {
  label: string;
  columns: { key: StatusFieldKey; label: string }[];
};

export const COLUMN_GROUPS: ColumnGroupConfig[] = (() => {
  const seen = new Map<string, ColumnGroupConfig>();
  for (const [key, entry] of Object.entries(REGISTRY) as [StatusFieldKey, RegistryEntry][]) {
    if (!seen.has(entry.group)) {
      seen.set(entry.group, { label: entry.group, columns: [] });
    }
    seen.get(entry.group)!.columns.push({ key, label: entry.label });
  }
  return Array.from(seen.values());
})();

// Fields rendered dimmed in the tracker (legacy — pending lean workflow removal).
export const LEGACY_STATUS_FIELDS = new Set(
  (Object.entries(REGISTRY) as [StatusFieldKey, RegistryEntry][])
    .filter(([, entry]) => entry.legacy)
    .map(([k]) => k)
);
