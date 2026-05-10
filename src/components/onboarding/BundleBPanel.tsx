"use client";

import { useState } from "react";
import { sendContractBundle } from "@/app/actions/bundle-b";
import type { ContractTemplate } from "@/lib/types";

interface Props {
  recordId: string;
  staffEmail: string;
  templates: ContractTemplate[];
}

export default function BundleBPanel({ recordId, staffEmail, templates }: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const permanent = templates.filter((t) => t.employment_type === "permanent");
  const casual = templates.filter((t) => t.employment_type === "casual");

  async function handleSend() {
    if (!selectedTemplateId) return;
    setPending(true);
    setError(null);
    const result = await sendContractBundle(recordId, selectedTemplateId, staffEmail);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Contract Bundle (Bundle B)</h2>
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
          Contract bundle sent for signing.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Contract Bundle (Bundle B)</h2>
      <p className="text-xs text-gray-500">
        Select a contract version and send the full signing bundle (Employment Contract, Flexible
        Working, Core Policy, High Intensity Policy, Implementing Behaviour Support).
      </p>

      <div className="space-y-1">
        <label htmlFor="contract-template" className="text-sm font-medium text-gray-700">
          Contract version
        </label>
        <select
          id="contract-template"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— select a version —</option>
          {permanent.length > 0 && (
            <optgroup label="Permanent">
              {permanent.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (v{t.version})
                </option>
              ))}
            </optgroup>
          )}
          {casual.length > 0 && (
            <optgroup label="Casual">
              {casual.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (v{t.version})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
      )}

      <button
        onClick={handleSend}
        disabled={!selectedTemplateId || pending}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "Sending…" : "Send contract bundle"}
      </button>
    </section>
  );
}
