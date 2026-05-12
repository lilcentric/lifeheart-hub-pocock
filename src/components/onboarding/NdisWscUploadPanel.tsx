"use client";

import { useState, useRef } from "react";
import { getNdisWscUploadUrl, markNdisWscUploaded } from "@/app/actions/ndiswsc-upload";
import type { OnboardingStatus } from "@/lib/types";

interface Props {
  recordId: string;
  currentStatus: OnboardingStatus;
  howToGetItUrl: string;
}

export default function NdisWscUploadPanel({ recordId, currentStatus, howToGetItUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(
    currentStatus === "in_progress" ||
      currentStatus === "pending_verification" ||
      currentStatus === "completed"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (done) {
    return (
      <p className="text-sm text-green-700 mt-2">
        Your NDIS Worker Screening Check has been uploaded. An admin will confirm once verified.
      </p>
    );
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError(null);

    const urlResult = await getNdisWscUploadUrl(recordId, file.name);
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

    const recordResult = await markNdisWscUploaded(recordId, path);
    if ("error" in recordResult) {
      setError(recordResult.error);
      setUploading(false);
      return;
    }

    setDone(true);
    setUploading(false);
  }

  return (
    <div className="mt-3 space-y-3">
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
        {uploading ? "Uploading…" : "Click to upload NDIS WSC Clearance (PDF, JPG, PNG)"}
      </button>
      <p className="text-sm text-gray-500">
        Don&apos;t have one?{" "}
        <a
          href={howToGetItUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-700"
        >
          Here&apos;s how to get it →
        </a>
        {" "}(use Lifeheart ID: <span className="font-mono font-medium">4-IBS0H1Z</span>)
      </p>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
