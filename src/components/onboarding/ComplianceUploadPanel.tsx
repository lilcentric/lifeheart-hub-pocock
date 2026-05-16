"use client";

import { getPortalUploadUrl, recordPortalUpload } from "@/app/actions/portal-single-upload";
import type { ComplianceDocumentType, OnboardingStatus } from "@/lib/types";
import SingleFileUploadPanel from "./SingleFileUploadPanel";

interface Props {
  recordId: string;
  documentType: ComplianceDocumentType;
  currentStatus: OnboardingStatus;
  uploadLabel?: string;
}

export default function ComplianceUploadPanel({
  recordId,
  documentType,
  currentStatus,
  uploadLabel = "Click to upload file (PDF, JPG, PNG)",
}: Props) {
  return (
    <SingleFileUploadPanel
      recordId={recordId}
      currentStatus={currentStatus}
      doneStatuses={["completed"]}
      getUploadUrl={(id, filename) => getPortalUploadUrl(id, documentType, filename)}
      markUploaded={(id, path) => recordPortalUpload(id, documentType, path)}
      buttonLabel={uploadLabel}
      successMessage="Document uploaded successfully."
    />
  );
}
