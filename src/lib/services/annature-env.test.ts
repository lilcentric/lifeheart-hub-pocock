import { describe, it, expect } from "vitest";
import { validateAnnatureEnv } from "./annature-env";

const ALL_VARS = {
  ANNATURE_ID: "test-id",
  ANNATURE_KEY: "test-key",
  ANNATURE_ACCOUNT_ID: "test-account",
  ANNATURE_BUNDLE_B_ROLE_ID: "test-role",
  ANNATURE_BUNDLE_B_FLEXIBLE_WORKING_TEMPLATE_ID: "tmpl-flex",
  ANNATURE_BUNDLE_B_CORE_POLICY_TEMPLATE_ID: "tmpl-core",
  ANNATURE_BUNDLE_B_HIGH_INTENSITY_TEMPLATE_ID: "tmpl-hi",
  ANNATURE_BUNDLE_B_BEHAVIOUR_SUPPORT_TEMPLATE_ID: "tmpl-bs",
};

describe("validateAnnatureEnv", () => {
  it("returns ok with typed env when all 8 vars are present", () => {
    const result = validateAnnatureEnv(ALL_VARS);

    expect(result).toEqual({
      ok: true,
      env: {
        annatureId: "test-id",
        annatureKey: "test-key",
        accountId: "test-account",
        roleId: "test-role",
        flexibleWorkingTemplateId: "tmpl-flex",
        corePolicyTemplateId: "tmpl-core",
        highIntensityTemplateId: "tmpl-hi",
        behaviourSupportTemplateId: "tmpl-bs",
      },
    });
  });

  it("returns ok: false with missing var name when one var is absent", () => {
    const { ANNATURE_BUNDLE_B_ROLE_ID: _, ...rest } = ALL_VARS;
    const result = validateAnnatureEnv(rest);

    expect(result).toEqual({
      ok: false,
      missing: ["ANNATURE_BUNDLE_B_ROLE_ID"],
    });
  });

  it("lists all missing var names when multiple vars are absent", () => {
    const result = validateAnnatureEnv({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toEqual(expect.arrayContaining(Object.keys(ALL_VARS)));
      expect(result.missing).toHaveLength(8);
    }
  });

  it("reports missing key names, not missing values", () => {
    const result = validateAnnatureEnv({ ANNATURE_ID: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("ANNATURE_ID");
    }
  });
});
