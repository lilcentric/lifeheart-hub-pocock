"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveAction, unarchiveAction } from "@/app/actions/archive";

interface Props {
  recordId: string;
  isArchived: boolean;
}

export default function ArchiveButton({ recordId, isArchived }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    const result = isArchived
      ? await unarchiveAction(recordId)
      : await archiveAction(recordId);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    startTransition(() => {
      router.push("/onboarding");
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          isArchived
            ? "px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            : "px-4 py-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-md hover:bg-amber-50 disabled:opacity-50 transition-colors"
        }
      >
        {isPending
          ? isArchived
            ? "Unarchiving…"
            : "Archiving…"
          : isArchived
          ? "Unarchive record"
          : "Archive record"}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
