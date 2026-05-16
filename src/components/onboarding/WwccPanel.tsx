"use client";

import { getWwccUploadUrl, markWwccUploaded } from "@/app/actions/wwcc";
import type { OnboardingStatus } from "@/lib/types";
import SingleFileUploadPanel from "./SingleFileUploadPanel";

interface Props {
  recordId: string;
  currentStatus: OnboardingStatus;
  howToGetItUrl: string;
}

export default function WwccPanel({ recordId, currentStatus, howToGetItUrl }: Props) {
  return (
    <SingleFileUploadPanel
      recordId={recordId}
      currentStatus={currentStatus}
      doneStatuses={["in_progress", "completed"]}
      getUploadUrl={getWwccUploadUrl}
      markUploaded={markWwccUploaded}
      buttonLabel="Click to upload WWCC (PDF, JPG, PNG)"
      successMessage="Your WWCC has been uploaded. An admin will confirm once verified."
      howToGetItUrl={howToGetItUrl}
    />
  );
}
