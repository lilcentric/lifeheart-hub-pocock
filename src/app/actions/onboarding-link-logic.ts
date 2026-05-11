export interface SendOnboardingLinkDeps {
  generateToken: (recordId: string) => Promise<{ token: string; error: null } | { token: null; error: string }>;
  sendEmail: (staffEmail: string, token: string) => Promise<{ error: string | null }>;
  sendBundleA: (recordId: string, staffEmail: string) => Promise<{ envelopeId: string } | { error: string }>;
}

export type SendOnboardingLinkResult =
  | { success: true; annatureWarning?: string }
  | { error: string };

export async function executeSendOnboardingLink(
  recordId: string,
  staffEmail: string,
  deps: SendOnboardingLinkDeps
): Promise<SendOnboardingLinkResult> {
  const tokenResult = await deps.generateToken(recordId);
  if (tokenResult.token === null) return { error: tokenResult.error };

  const emailResult = await deps.sendEmail(staffEmail, tokenResult.token);
  if (emailResult.error) return { error: emailResult.error };

  const bundleResult = await deps.sendBundleA(recordId, staffEmail);
  if ("error" in bundleResult) {
    return { success: true, annatureWarning: bundleResult.error };
  }

  return { success: true };
}
