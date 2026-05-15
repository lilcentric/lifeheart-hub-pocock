import type { OnboardingRecord, OnboardingStatus, ComplianceDocumentType } from "@/lib/types";
import type { UploadVariant, PortalItemConfig, StatusFieldKey, RegistryEntry } from "@/lib/onboarding-status-fields";
import { REGISTRY } from "@/lib/onboarding-status-fields";
import { getPortalStatus } from "@/utils/status-utils";

// ── Portal item types ─────────────────────────────────────────────────────────

export type PortalItemKind = PortalItemConfig["kind"];

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
  documentType?: ComplianceDocumentType;
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

// ── Derivation ────────────────────────────────────────────────────────────────

export function getPortalItems(record: OnboardingRecord, token: string): AnyPortalItem[] {
  const entries = (Object.entries(REGISTRY) as [StatusFieldKey, RegistryEntry][])
    .filter(([, entry]) => entry.portal !== undefined)
    .sort(([, a], [, b]) => a.portal!.order - b.portal!.order);

  const items: AnyPortalItem[] = [];
  for (const [key, entry] of entries) {
    const p = entry.portal!;

    if (p.kind === "sign" && p.conditional && !record[p.conditional]) continue;

    const rawStatus = record[key as keyof OnboardingRecord] as OnboardingStatus;

    switch (p.kind) {
      case "form":
        items.push({ kind: "form", key, label: p.label, status: rawStatus, href: `/onboard/${token}/details` });
        break;
      case "sign":
        items.push({
          kind: "sign",
          key,
          label: p.label,
          status: rawStatus,
          signingUrl: (record[p.signingUrlField as keyof OnboardingRecord] as string | null) ?? null,
        });
        break;
      case "upload":
        items.push({
          kind: "upload",
          key,
          label: p.label,
          status: p.usePortalStatus ? getPortalStatus(rawStatus) : rawStatus,
          uploadVariant: p.uploadVariant,
          documentType: p.documentType,
          howToGetItUrl: p.howToGetItUrl,
        });
        break;
      case "multi-upload":
        items.push({ kind: "multi-upload", key, label: p.label, status: rawStatus, documentType: p.documentType });
        break;
    }
  }
  return items;
}

// ── Legacy exports (deprecated) ───────────────────────────────────────────────

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
