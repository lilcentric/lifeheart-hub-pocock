"use client";

import { useState, useRef } from "react";
import { getPortalUploadUrl, recordPortalUpload } from "@/app/actions/portal-single-upload";
import type { ComplianceDocumentType } from "@/lib/types";
import type { OnboardingStatus } from "@/lib/types";

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(currentStatus === "completed");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (done) {
    return (
      <p className="text-sm text-green-700 mt-2">Document uploaded successfully.</p>
    );
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError(null);

    const urlResult = await getPortalUploadUrl(recordId, documentType, file.name);
    if ("error" in urlResult) {
      setError(urlResult.error);
      setUploading(false);
      return;
    }

    const { uploadUrl, path } = urlResult;
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!uploadRes.ok) {
      setError("File upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const recordResult = await recordPortalUpload(recordId, documentType, path);
    if ("error" in recordResult) {
      setError(recordResult.error);
      setUploading(false);
      return;
    }

    setDone(true);
    setUploading(false);
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {uploading ? "Uploading…" : uploadLabel}
      </button>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
