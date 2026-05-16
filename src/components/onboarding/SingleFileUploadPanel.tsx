"use client";

import { useState, useRef } from "react";
import type { OnboardingStatus } from "@/lib/types";

interface Props {
  recordId: string;
  currentStatus: OnboardingStatus;
  /** Statuses that mean the upload is already done — panel shows success message instead of dropzone. */
  doneStatuses: OnboardingStatus[];
  getUploadUrl: (
    recordId: string,
    filename: string
  ) => Promise<{ uploadUrl: string; path: string } | { error: string }>;
  markUploaded: (
    recordId: string,
    path: string
  ) => Promise<{ success: true } | { error: string }>;
  buttonLabel: string;
  successMessage: string;
  howToGetItUrl?: string;
  howToGetItNote?: React.ReactNode;
}

export default function SingleFileUploadPanel({
  recordId,
  currentStatus,
  doneStatuses,
  getUploadUrl,
  markUploaded,
  buttonLabel,
  successMessage,
  howToGetItUrl,
  howToGetItNote,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(doneStatuses.includes(currentStatus));
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (done) {
    return <p className="text-sm text-green-700 mt-2">{successMessage}</p>;
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError(null);

    const urlResult = await getUploadUrl(recordId, file.name);
    if ("error" in urlResult) {
      setError(urlResult.error);
      setUploading(false);
      return;
    }

    const uploadRes = await fetch(urlResult.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!uploadRes.ok) {
      setError("File upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const recordResult = await markUploaded(recordId, urlResult.path);
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
        {uploading ? "Uploading…" : buttonLabel}
      </button>
      {howToGetItUrl && (
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
          {howToGetItNote && <>{" "}{howToGetItNote}</>}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
