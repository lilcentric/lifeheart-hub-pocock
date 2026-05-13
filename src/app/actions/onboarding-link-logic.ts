export interface SendOnboardingLinkDeps {
  generateToken: (recordId: string) => Promise<{ token: string; error: null } | { token: null; error: string }>;
  revokeToken: (token: string) => Promise<void>;
  sendEmail: (staffEmail: string, token: string) => Promise<{ error: string | null }>;
  sendAllDocuments: (
    recordId: string,
    staffEmail: string,
    employmentBundleId: string,
    flexibleWorkingOptedIn: boolean
  ) => Promise<{ envelopeId: string; signingUrl: string | null; fwaEnvelopeId: string | null; fwaSigningUrl: string | null } | { error: string }>;
}

export type SendOnboardingLinkResult =
  | { success: true; annatureWarning?: string }
  | { error: string };

export async function executeSendOnboardingLink(
  recordId: string,
  staffEmail: string,
  employmentBundleId: string,
  flexibleWorkingOptedIn: boolean,
  deps: SendOnboardingLinkDeps
): Promise<SendOnboardingLinkResult> {
  const tokenResult = await deps.generateToken(recordId);
  if (tokenResult.token === null) return { error: tokenResult.error };

  const emailResult = await deps.sendEmail(staffEmail, tokenResult.token);
  if (emailResult.error) {
    await deps.revokeToken(tokenResult.token);
    return { error: emailResult.error };
  }

  const annatureResult = await deps.sendAllDocuments(
    recordId,
    staffEmail,
    employmentBundleId,
    flexibleWorkingOptedIn
  );
  if ("error" in annatureResult) {
    return { success: true, annatureWarning: annatureResult.error };
  }

  return { success: true };
}
