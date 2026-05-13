import type { OnboardingRecord, OnboardingStatus } from "@/lib/types";
import type { ComplianceDocumentType } from "@/app/actions/compliance-upload-logic";

// ── New typed portal item system ──────────────────────────────────────────────

export type PortalItemKind = "form" | "sign" | "upload" | "multi-upload";

// Upload variants determine which server action the portal uses.
export type UploadVariant = "compliance" | "wwcc" | "ndiswsc";

interface BasePortalItem {
  key: string;
  label: string;
  status: OnboardingStatus;
  kind: PortalItemKind;
}

export interface FormPortalItem extends BasePortalItem {
  kind: "form";
  href: string;
}

export interface SignPortalItem extends BasePortalItem {
  kind: "sign";
  signingUrl: string | null;
}

export interface UploadPortalItem extends BasePortalItem {
  kind: "upload";
  uploadVariant: UploadVariant;
  documentType?: ComplianceDocumentType; // only for uploadVariant === "compliance"
  howToGetItUrl?: string;
}

export interface MultiUploadPortalItem extends BasePortalItem {
  kind: "multi-upload";
  documentType: string;
}

export type AnyPortalItem =
  | FormPortalItem
  | SignPortalItem
  | UploadPortalItem
  | MultiUploadPortalItem;

export function getPortalItems(record: OnboardingRecord, token: string): AnyPortalItem[] {
  const signingUrl = record.signing_url ?? null;

  const items: AnyPortalItem[] = [
    {
      kind: "form",
      key: "employee_details_form_status",
      label: "Employee Details Form",
      status: record.employee_details_form_status,
      href: `/onboard/${token}/details`,
    },
    {
      kind: "sign",
      key: "position_description_status",
      label: "Position Description & Code of Conduct",
      status: record.position_description_status,
      signingUrl,
    },
    {
      kind: "sign",
      key: "employment_contract_status",
      label: "Employment Contract",
      status: record.employment_contract_status,
      signingUrl,
    },
    {
      kind: "sign",
      key: "policies_status",
      label: "Policies",
      status: record.policies_status,
      signingUrl,
    },
    {
      kind: "sign",
      key: "conflict_of_interest_status",
      label: "Conflict of Interest",
      status: record.conflict_of_interest_status,
      signingUrl,
    },
    {
      kind: "upload",
      key: "identity_right_to_work_status",
      label: "Identity & Right to Work",
      status: record.identity_right_to_work_status,
      uploadVariant: "compliance",
      documentType: "identity_right_to_work",
    },
    {
      kind: "upload",
      key: "car_insurance_status",
      label: "Car Insurance",
      status: record.car_insurance_status,
      uploadVariant: "compliance",
      documentType: "car_insurance",
    },
    {
      kind: "upload",
      key: "wwcc_status",
      label: "Working With Children Check",
      status: record.wwcc_status,
      uploadVariant: "wwcc",
      howToGetItUrl:
        "https://www.service.nsw.gov.au/transaction/apply-for-a-working-with-children-check",
    },
    {
      kind: "upload",
      key: "ndiswsc_status",
      label: "NDIS Worker Screening Check",
      status:
        record.ndiswsc_status === "pending_verification"
          ? "in_progress"
          : record.ndiswsc_status,
      uploadVariant: "ndiswsc",
      howToGetItUrl:
        "https://www.service.nsw.gov.au/transaction/apply-for-an-ndis-worker-screening-check",
    },
    {
      kind: "upload",
      key: "ndis_orientation_status",
      label: "NDIS Worker Orientation Module",
      status: record.ndis_orientation_status,
      uploadVariant: "compliance",
      documentType: "ndis_orientation",
    },
    {
      kind: "upload",
      key: "additional_training_status",
      label: "Additional Training Certificates",
      status: record.additional_training_status,
      uploadVariant: "compliance",
      documentType: "additional_training",
    },
    {
      kind: "multi-upload",
      key: "qualifications_status",
      label: "Qualifications",
      status: record.qualifications_status,
      documentType: "qualifications",
    },
    {
      kind: "multi-upload",
      key: "first_aid_cpr_status",
      label: "First Aid & CPR",
      status: record.first_aid_cpr_status,
      documentType: "first_aid_cpr",
    },
  ];

  // Item 14: FWA — only shown when flexible working was opted in
  if (record.flexible_working_opted_in) {
    items.push({
      kind: "sign",
      key: "flexible_working_status",
      label: "Flexible Working Agreement",
      status: record.flexible_working_status,
      signingUrl: record.fwa_signing_url ?? null,
    });
  }

  return items;
}

// ── Legacy exports (deprecated — used by old portal page, remove after staff portal rewrite) ────

export interface ChecklistItem {
  key: string;
  label: string;
  status: OnboardingStatus;
}

export interface UploadChecklistItem extends ChecklistItem {
  documentType: ComplianceDocumentType;
}

/** @deprecated Use getPortalItems instead */
export function getStaffFacingItems(record: OnboardingRecord): ChecklistItem[] {
  return getPortalItems(record, "").map(({ key, label, status }) => ({ key, label, status }));
}

/** @deprecated Use getPortalItems instead */
export function getUploadItems(record: OnboardingRecord): UploadChecklistItem[] {
  return getPortalItems(record, "")
    .filter((i): i is UploadPortalItem => i.kind === "upload" && i.uploadVariant === "compliance" && !!i.documentType)
    .filter((i) => (["identity_right_to_work", "ndis_orientation", "car_insurance"] as string[]).includes(i.documentType!))
    .map((i) => ({ key: i.key, label: i.label, status: i.status, documentType: i.documentType! }));
}
