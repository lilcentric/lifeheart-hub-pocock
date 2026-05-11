export interface SendOnboardingLinkDeps {
  generateToken: (recordId: string) => Promise<{ token: string; error: null } | { token: null; error: string }>;
  sendEmail: (staffEmail: string, token: string) => Promise<{ error: string | null }>;
  sendAllDocuments: (
    recordId: string,
    staffEmail: string,
    pdCocTemplateId: string,
    contractTemplateId: string,
    flexibleWorkingOptedIn: boolean
  ) => Promise<{ envelopeId: string; signingUrl: string | null } | { error: string }>;
}

export type SendOnboardingLinkResult =
  | { success: true; annatureWarning?: string }
  | { error: string };

export async function executeSendOnboardingLink(
  recordId: string,
  staffEmail: string,
  pdCocTemplateId: string,
  contractTemplateId: string,
  flexibleWorkingOptedIn: boolean,
  deps: SendOnboardingLinkDeps
): Promise<SendOnboardingLinkResult> {
  const tokenResult = await deps.generateToken(recordId);
  if (tokenResult.token === null) return { error: tokenResult.error };

  const emailResult = await deps.sendEmail(staffEmail, tokenResult.token);
  if (emailResult.error) return { error: emailResult.error };

  const annatureResult = await deps.sendAllDocuments(
    recordId,
    staffEmail,
    pdCocTemplateId,
    contractTemplateId,
    flexibleWorkingOptedIn
  );
  if ("error" in annatureResult) {
    return { success: true, annatureWarning: annatureResult.error };
  }

  return { success: true };
}
