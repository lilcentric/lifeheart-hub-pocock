"use client";

import { useState } from "react";
import type { OnboardingStatus } from "@/lib/types";
import { getStatusMeta } from "@/utils/status-utils";
import {
  markNdisWscAsPendingVerification,
  markNdisWscAsCleared,
} from "@/app/actions/ndiswsc";

interface Props {
  recordId: string;
  initialStatus: OnboardingStatus;
  isAdmin: boolean;
  clearanceDownloadUrl?: string | null;
}

export default function NdisWscPanel({
  recordId,
  initialStatus,
  isAdmin,
  clearanceDownloadUrl,
}: Props) {
  const [status, setStatus] = useState<OnboardingStatus>(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = getStatusMeta(status);

  async function handleAction(
    action: (id: string, current: OnboardingStatus) => Promise<{ success?: true; error?: string }>
  ) {
    setPending(true);
    setError(null);
    const result = await action(recordId, status);
    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("success" in result) {
      if (status === "in_progress") setStatus("pending_verification");
      else if (status === "pending_verification") setStatus("completed");
    }
    setPending(false);
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">
        NDIS Worker Screening Check
      </h2>

      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      {clearanceDownloadUrl && (
        <a
          href={clearanceDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          View uploaded clearance
        </a>
      )}

      {isAdmin && (
        <div className="flex items-center gap-3">
          {status === "in_progress" && (
            <button
              onClick={() => handleAction(markNdisWscAsPendingVerification)}
              disabled={pending}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              Mark as Pending Verification
            </button>
          )}
          {status === "pending_verification" && (
            <button
              onClick={() => handleAction(markNdisWscAsCleared)}
              disabled={pending}
              className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              Mark as Cleared
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
    </section>
  );
}
