export interface AnnatureEnv {
  annatureId: string;
  annatureKey: string;
  accountId: string;
  roleId: string;
  flexibleWorkingTemplateId: string;
  corePolicyTemplateId: string;
  highIntensityTemplateId: string;
  behaviourSupportTemplateId: string;
}

export type AnnatureEnvResult =
  | { ok: true; env: AnnatureEnv }
  | { ok: false; missing: string[] };

const REQUIRED: Array<[keyof AnnatureEnv, string]> = [
  ["annatureId", "ANNATURE_ID"],
  ["annatureKey", "ANNATURE_KEY"],
  ["accountId", "ANNATURE_ACCOUNT_ID"],
  ["roleId", "ANNATURE_BUNDLE_B_ROLE_ID"],
  ["flexibleWorkingTemplateId", "ANNATURE_BUNDLE_B_FLEXIBLE_WORKING_TEMPLATE_ID"],
  ["corePolicyTemplateId", "ANNATURE_BUNDLE_B_CORE_POLICY_TEMPLATE_ID"],
  ["highIntensityTemplateId", "ANNATURE_BUNDLE_B_HIGH_INTENSITY_TEMPLATE_ID"],
  ["behaviourSupportTemplateId", "ANNATURE_BUNDLE_B_BEHAVIOUR_SUPPORT_TEMPLATE_ID"],
];

export function validateAnnatureEnv(env: Record<string, string | undefined>): AnnatureEnvResult {
  const missing: string[] = [];
  const result = {} as AnnatureEnv;

  for (const [field, varName] of REQUIRED) {
    const value = env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      result[field] = value;
    }
  }

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, env: result };
}
