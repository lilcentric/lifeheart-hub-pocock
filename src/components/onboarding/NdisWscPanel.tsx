"use client";

import { useState } from "react";
import type { OnboardingStatus } from "@/lib/types";
import { getStatusMeta } from "@/utils/status-utils";
import { getAdminNdisWscActions } from "@/utils/ndiswsc-transitions";
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

type ServerAction = (id: string, current: OnboardingStatus) => Promise<{ success?: true; error?: string }>;

const ACTION_MAP: Record<string, ServerAction> = {
  pending_verification: markNdisWscAsPendingVerification,
  completed: markNdisWscAsCleared,
};

const BUTTON_CLASS: Record<string, string> = {
  pending_verification: "bg-amber-600 hover:bg-amber-700",
  completed: "bg-green-700 hover:bg-green-800",
};

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
  const adminActions = isAdmin ? getAdminNdisWscActions(status) : [];

  async function handleTransition(action: ServerAction, targetStatus: OnboardingStatus) {
    setPending(true);
    setError(null);
    const result = await action(recordId, status);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setStatus(targetStatus);
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

      {adminActions.length > 0 && (
        <div className="flex items-center gap-3">
          {adminActions.map(({ targetStatus, label }) => (
            <button
              key={targetStatus}
              onClick={() => handleTransition(ACTION_MAP[targetStatus], targetStatus)}
              disabled={pending}
              className={`px-4 py-2 text-white text-sm font-medium rounded-md disabled:opacity-50 transition-colors ${BUTTON_CLASS[targetStatus]}`}
            >
              {label}
            </button>
          ))}
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
