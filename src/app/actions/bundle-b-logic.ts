export interface SendContractBundleDeps {
  saveContractTemplateId: (
    recordId: string,
    contractTemplateId: string
  ) => Promise<{ error: string | null }>;
  sendBundleB: (
    recordId: string,
    contractTemplateId: string,
    staffEmail: string
  ) => Promise<{ envelopeId: string } | { error: string }>;
}

export type SendContractBundleResult =
  | { envelopeId: string }
  | { error: string };

export async function executeSendContractBundle(
  recordId: string,
  contractTemplateId: string,
  staffEmail: string,
  deps: SendContractBundleDeps
): Promise<SendContractBundleResult> {
  const { saveContractTemplateId, sendBundleB } = deps;

  const saveResult = await saveContractTemplateId(recordId, contractTemplateId);
  if (saveResult.error) return { error: saveResult.error };

  const bundleResult = await sendBundleB(recordId, contractTemplateId, staffEmail);
  if ("error" in bundleResult) return { error: bundleResult.error };

  return { envelopeId: bundleResult.envelopeId };
}
