"use client";

import { getNdisWscUploadUrl, markNdisWscUploaded } from "@/app/actions/ndiswsc-upload";
import type { OnboardingStatus } from "@/lib/types";
import SingleFileUploadPanel from "./SingleFileUploadPanel";

interface Props {
  recordId: string;
  currentStatus: OnboardingStatus;
  howToGetItUrl: string;
}

export default function NdisWscUploadPanel({ recordId, currentStatus, howToGetItUrl }: Props) {
  return (
    <SingleFileUploadPanel
      recordId={recordId}
      currentStatus={currentStatus}
      doneStatuses={["in_progress", "pending_verification", "completed"]}
      getUploadUrl={getNdisWscUploadUrl}
      markUploaded={markNdisWscUploaded}
      buttonLabel="Click to upload NDIS WSC Clearance (PDF, JPG, PNG)"
      successMessage="Your NDIS Worker Screening Check has been uploaded. An admin will confirm once verified."
      howToGetItUrl={howToGetItUrl}
      howToGetItNote={
        <>(use Lifeheart ID: <span className="font-mono font-medium">4-IBS0H1Z</span>)</>
      }
    />
  );
}
