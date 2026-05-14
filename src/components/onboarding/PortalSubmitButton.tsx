"use client";

import { useState } from "react";
import { submitPortalCompletion } from "@/app/actions/portal-submit";

interface Props {
  token: string;
}

export default function PortalSubmitButton({ token }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setState("loading");
    const result = await submitPortalCompletion(token);
    if ("error" in result) {
      setErrorMessage(result.error);
      setState("error");
    } else {
      setState("done");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center">
        <p className="text-sm font-medium text-green-800">
          Submission received — your onboarding officer has been notified. Thank you!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="w-full px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {state === "loading" ? "Submitting…" : "Complete Submission"}
      </button>
      {state === "error" && errorMessage && (
        <p className="text-xs text-red-600 text-center">{errorMessage}</p>
      )}
    </div>
  );
}
