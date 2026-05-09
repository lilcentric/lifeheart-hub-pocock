"use client";

import { useState, useRef } from "react";
import { getNdisWscUploadUrl, markNdisWscUploaded, markNdisWscApplying } from "@/app/actions/ndiswsc-upload";
import type { OnboardingStatus } from "@/lib/types";

interface Props {
  recordId: string;
  currentStatus: OnboardingStatus;
}

type Selection = "yes" | "no" | null;

export default function NdisWscUploadPanel({ recordId, currentStatus }: Props) {
  const [selection, setSelection] = useState<Selection>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(
    currentStatus === "in_progress" ||
    currentStatus === "pending_verification" ||
    currentStatus === "completed"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (done) {
    return (
      <p className="text-sm text-amber-700 mt-2">
        Your NDIS Worker Screening Check is being processed. An admin will confirm once verified.
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

  async function handleApplying() {
    setSubmitting(true);
    setError(null);
    const result = await markNdisWscApplying(recordId);
    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    setDone(true);
    setSubmitting(false);
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm font-medium text-gray-700">
        Do you have a current NDIS Worker Screening Clearance?
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setSelection("yes"); setError(null); }}
          className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            selection === "yes"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => { setSelection("no"); setError(null); }}
          className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            selection === "no"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          No
        </button>
      </div>

      {selection === "yes" && (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Upload your NDIS Worker Screening Clearance below. Your file goes directly and securely to our storage.
          </p>
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
            {uploading ? "Uploading…" : "Click to select file (PDF, JPG, PNG)"}
          </button>
        </div>
      )}

      {selection === "no" && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800">
            How to apply for an NDIS Worker Screening Check
          </p>
          <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
            <li>Visit the Service NSW website and search for "NDIS Worker Screening Check".</li>
            <li>
              Select <strong>Employer/Organisation</strong> when prompted, and enter Lifeheart&apos;s
              registration ID: <strong className="font-mono">4-IBS0H1Z</strong>
            </li>
            <li>Complete the application form and pay the application fee.</li>
            <li>
              You will receive a clearance number once approved — keep it safe.
            </li>
          </ol>
          <p className="text-sm text-amber-700 pt-1">
            Once you have submitted your application, click the button below so we can track your progress.
          </p>
          <button
            type="button"
            disabled={submitting}
            onClick={handleApplying}
            className="mt-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Saving…" : "I have submitted my NDIS Worker Screening application"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
