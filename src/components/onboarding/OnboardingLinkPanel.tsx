"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  sendOnboardingLink,
  revokeToken,
  resendOnboardingLink,
} from "@/app/actions/onboarding-link";

interface ActiveToken {
  id: string;
}

interface Props {
  recordId: string;
  isAdmin: boolean;
  isOfficer: boolean;
  activeToken?: ActiveToken | null;
}

type ModalMode = "send" | "resend" | "revoke" | null;

export default function OnboardingLinkPanel({
  recordId,
  isAdmin,
  isOfficer,
  activeToken,
}: Props) {
  const [mode, setMode] = useState<ModalMode>(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tokenRevoked, setTokenRevoked] = useState(false);

  const canSend = isAdmin || isOfficer;
  const hasActiveToken = !!activeToken && !tokenRevoked;

  function openModal(m: ModalMode) {
    setMode(m);
    setEmail("");
    setError(null);
  }

  function closeModal() {
    setMode(null);
    setError(null);
  }

  async function handleSendOrResend() {
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    setPending(true);
    setError(null);
    const action = mode === "resend" ? resendOnboardingLink : sendOnboardingLink;
    const result = await action(recordId, email.trim());
    setPending(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(mode === "resend" ? "New link sent." : "Onboarding link sent.");
      closeModal();
    }
  }

  async function handleRevoke() {
    if (!activeToken) return;
    setPending(true);
    setError(null);
    const result = await revokeToken(activeToken.id, recordId);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setTokenRevoked(true);
      setSuccess("Token revoked.");
      closeModal();
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Onboarding Link</h2>

      {hasActiveToken && (
        <p className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-md">
          Active token on file
        </p>
      )}

      {tokenRevoked && (
        <p className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md">
          Token revoked
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">{success}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {canSend && !hasActiveToken && (
          <button
            onClick={() => openModal("send")}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Send onboarding link
          </button>
        )}

        {isAdmin && hasActiveToken && (
          <>
            <button
              onClick={() => openModal("resend")}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Resend link
            </button>
            <button
              onClick={() => openModal("revoke")}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Revoke token
            </button>
          </>
        )}
      </div>

      {/* Send / Resend email modal */}
      <Dialog.Root open={mode === "send" || mode === "resend"} onOpenChange={(open) => !open && closeModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              {mode === "resend" ? "Resend onboarding link" : "Send onboarding link"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500">
              Enter the staff member&apos;s email address to dispatch the link.
            </Dialog.Description>

            <div className="space-y-1">
              <label htmlFor="email-input" className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={pending}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendOrResend}
                disabled={pending}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Revoke confirmation modal */}
      <Dialog.Root open={mode === "revoke"} onOpenChange={(open) => !open && closeModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Revoke token
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500">
              The staff member will no longer be able to use their existing onboarding link.
              This cannot be undone.
            </Dialog.Description>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={pending}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={pending}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Revoking…" : "Revoke"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
