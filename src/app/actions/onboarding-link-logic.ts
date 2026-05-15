export interface SendOnboardingLinkDeps {
  generateToken: (recordId: string) => Promise<{ token: string; error: null } | { token: null; error: string }>;
  getStaffName: (recordId: string) => Promise<string>;
  sendEmail: (email: string, staffName: string, token: string) => Promise<{ error: string | null }>;
  sendAllDocuments: (
    recordId: string,
    staffEmail: string,
    staffName: string,
    employmentBundleId: string,
    flexibleWorkingOptedIn: boolean
  ) => Promise<{ envelopeId: string; signingUrl: string | null; fwaEnvelopeId: string | null; fwaSigningUrl: string | null } | { error: string }>;
  createXeroEmployee: (name: string, email: string) => Promise<{ xeroEmployeeId: string } | { error: string }>;
  // ADR-0009: sent 1 hour after the onboarding email via a scheduled job so the
  // staff member reads the Lifeheart email before receiving the Xero invite.
  sendXeroInvite: (xeroEmployeeId: string) => Promise<{ error: string | null }>;
}

export type SendOnboardingLinkResult =
  | { success: true; annatureWarning?: string; xeroWarning?: string }
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

  const staffName = await deps.getStaffName(recordId);

  const emailResult = await deps.sendEmail(staffEmail, staffName, tokenResult.token);
  if (emailResult.error) return { error: emailResult.error };

  let annatureWarning: string | undefined;
  const annatureResult = await deps.sendAllDocuments(
    recordId,
    staffEmail,
    staffName,
    employmentBundleId,
    flexibleWorkingOptedIn
  );
  if ("error" in annatureResult) {
    annatureWarning = annatureResult.error;
  }

  let xeroWarning: string | undefined;
  const xeroResult = await deps.createXeroEmployee(staffName, staffEmail);
  if ("error" in xeroResult) {
    xeroWarning = xeroResult.error;
  } else {
    const inviteResult = await deps.sendXeroInvite(xeroResult.xeroEmployeeId);
    if (inviteResult.error) {
      xeroWarning = inviteResult.error;
    }
  }

  return { success: true, annatureWarning, xeroWarning };
}
