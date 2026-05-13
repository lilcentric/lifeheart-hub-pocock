import type { OnboardingRecord, OnboardingStatus } from "./types";

type SingleUploadConfig = {
  statusField: Extract<keyof OnboardingRecord, `${string}_status`>;
  pathField: Extract<keyof OnboardingRecord, `${string}_storage_path`>;
  uploadedStatus: Extract<OnboardingStatus, "completed" | "in_progress">;
};

// Typed mapping from upload kind to the OnboardingRecord columns it writes.
// TypeScript verifies statusField and pathField are real columns on OnboardingRecord.
export const SINGLE_UPLOAD_CONFIG = {
  identity_right_to_work: {
    statusField: "identity_right_to_work_status",
    pathField: "identity_right_to_work_storage_path",
    uploadedStatus: "completed",
  },
  ndis_orientation: {
    statusField: "ndis_orientation_status",
    pathField: "ndis_orientation_storage_path",
    uploadedStatus: "completed",
  },
  car_insurance: {
    statusField: "car_insurance_status",
    pathField: "car_insurance_storage_path",
    uploadedStatus: "completed",
  },
  additional_training: {
    statusField: "additional_training_status",
    pathField: "additional_training_storage_path",
    uploadedStatus: "completed",
  },
  ndiswsc: {
    statusField: "ndiswsc_status",
    pathField: "ndiswsc_storage_path",
    uploadedStatus: "in_progress",
  },
  wwcc: {
    statusField: "wwcc_status",
    pathField: "wwcc_storage_path",
    uploadedStatus: "in_progress",
  },
} as const satisfies Record<string, SingleUploadConfig>;

export type SingleUploadKind = keyof typeof SINGLE_UPLOAD_CONFIG;
