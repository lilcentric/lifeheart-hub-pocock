import type { OnboardingRecord, OnboardingStatus } from "./types";

type StatusFieldKey = {
  [K in keyof OnboardingRecord]: K extends `${string}_status` ? K : never;
}[keyof OnboardingRecord];

// Envelope types that can be matched to registry-owned fields via getEnvelopeFieldUpdates.
// "tna" is excluded — its sequential staff/admin signing is handled by custom logic in the webhook.
export type EnvelopeOwner = "bundle_a" | "fwa" | "tna";

type UploadConfig =
  | {
      kind: "single";
      pathField: Extract<keyof OnboardingRecord, `${string}_storage_path`>;
      uploadedStatus: Extract<OnboardingStatus, "completed" | "in_progress">;
    }
  | {
      kind: "multi";
      uploadedStatus: Extract<OnboardingStatus, "completed">;
    };

type RegistryEntry = {
  include: boolean;       // true = counted in deriveOverallStatus
  group: string;          // column group label for the tracker table
  label: string;          // short display label for the table column header
  legacy?: true;          // dimmed in the tracker UI, pending removal
  upload?: UploadConfig;  // present when this item has a staff file upload
  envelopeOwner?: EnvelopeOwner; // present when set by an Annature signing event
};

// Registry of every _status field. TypeScript enforces exhaustiveness: adding a
// _status column to OnboardingRecord without listing it here is a compile error.
const REGISTRY = {
  // Recruitment
  job_application_status:   { include: true,  group: "Recruitment", label: "Job Application" },
  interview_status:         { include: true,  group: "Recruitment", label: "Interview" },
  reference_checks_status:  { include: true,  group: "Recruitment", label: "References" },
  cv_status:                { include: true,  group: "Recruitment", label: "CV", legacy: true },

  // Documentation — set by Annature Employment Bundle signing
  position_description_status: {
    include: true, group: "Documentation", label: "Position Description",
    envelopeOwner: "bundle_a" as const,
  },
  employment_contract_status: {
    include: true, group: "Documentation", label: "Contract",
    envelopeOwner: "bundle_a" as const,
  },
  code_of_conduct_status: {
    include: true, group: "Documentation", label: "Code of Conduct",
    envelopeOwner: "bundle_a" as const,
  },
  employee_details_form_status: { include: true, group: "Documentation", label: "Employee Details" },
  conflict_of_interest_status: {
    include: true, group: "Documentation", label: "Conflict of Interest",
    envelopeOwner: "bundle_a" as const,
  },

  // Compliance — staff file uploads
  identity_right_to_work_status: {
    include: true, group: "Compliance & Identity", label: "ID / Right to Work",
    upload: { kind: "single" as const, pathField: "identity_right_to_work_storage_path" as const, uploadedStatus: "completed" as const },
  },
  wwcc_status: {
    include: true, group: "Compliance & Identity", label: "WWCC",
    upload: { kind: "single" as const, pathField: "wwcc_storage_path" as const, uploadedStatus: "in_progress" as const },
  },
  ndiswsc_status: {
    include: true, group: "Compliance & Identity", label: "NDISWSC",
    upload: { kind: "single" as const, pathField: "ndiswsc_storage_path" as const, uploadedStatus: "in_progress" as const },
  },
  ndis_orientation_status: {
    include: true, group: "Compliance & Identity", label: "NDIS Orientation",
    upload: { kind: "single" as const, pathField: "ndis_orientation_storage_path" as const, uploadedStatus: "completed" as const },
  },
  qualifications_status: {
    include: true, group: "Compliance & Identity", label: "Qualifications",
    upload: { kind: "multi" as const, uploadedStatus: "completed" as const },
  },
  first_aid_cpr_status: {
    include: true, group: "Compliance & Identity", label: "First Aid & CPR",
    upload: { kind: "multi" as const, uploadedStatus: "completed" as const },
  },
  car_insurance_status: {
    include: true, group: "Compliance & Identity", label: "Car Insurance",
    upload: { kind: "single" as const, pathField: "car_insurance_storage_path" as const, uploadedStatus: "completed" as const },
  },

  // Training & Induction
  training_status:              { include: true, group: "Training", label: "Training" },
  orientation_induction_status: { include: true, group: "Training", label: "Orientation/Induction" },
  training_needs_status:        { include: true, group: "Training", label: "Training Needs", legacy: true },

  // TNA — sequential staff + admin signing; handled by custom webhook logic
  tna_status: { include: true, group: "Admin", label: "TNA", envelopeOwner: "tna" as const },

  // Admin legacy
  uniforms_status: { include: true, group: "Admin", label: "Uniforms", legacy: true },

  // Excluded from overall completion check
  flexible_working_status: {
    include: false, group: "Admin", label: "Flexible Working",
    envelopeOwner: "fwa" as const,
  },
  policies_status: {
    include: false, group: "Admin", label: "Policies",
    envelopeOwner: "bundle_a" as const,
  },
  additional_training_status: {
    include: false, group: "Admin", label: "Additional Training",
    upload: { kind: "single" as const, pathField: "additional_training_storage_path" as const, uploadedStatus: "completed" as const },
  },
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

// Returns the record field updates to apply when an Annature envelope is fully signed.
// Only "bundle_a" and "fwa" are supported — TNA is excluded because it uses sequential
// staff/admin signing events handled by custom webhook logic.
export function getEnvelopeFieldUpdates(
  envelopeOwner: Exclude<EnvelopeOwner, "tna">
): Record<string, OnboardingStatus> {
  const updates: Record<string, OnboardingStatus> = {};
  for (const [field, entry] of Object.entries(REGISTRY) as [StatusFieldKey, RegistryEntry][]) {
    if (entry.envelopeOwner === envelopeOwner) {
      updates[field] = "completed";
    }
  }
  return updates;
}

// Returns the upload config for a given status field key, or null if the field
// has no file upload. Used by recordUpload to determine storage and status behaviour.
export function getUploadConfig(statusField: StatusFieldKey): UploadConfig | null {
  const entry = REGISTRY[statusField];
  return entry.upload ?? null;
}

export { REGISTRY };
export type { UploadConfig, RegistryEntry, StatusFieldKey };
