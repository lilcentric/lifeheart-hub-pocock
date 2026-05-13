import { describe, it, expect } from "vitest";
import { COLUMN_GROUPS, ALL_STATUS_FIELDS } from "./onboarding-status-fields";

// Collect every column key across all groups
const allRenderedKeys = COLUMN_GROUPS.flatMap((g) => g.columns.map((c) => c.key));

describe("COLUMN_GROUPS", () => {
  // screening_checks_status was dropped from the DB in migration 002_compliance_split.sql
  // (documented in ADR 0008). It must not appear as a rendered column — doing so causes
  // StatusBadge to receive `undefined` from the Supabase response and crash.
  it("does not include screening_checks_status (dropped DB column)", () => {
    expect(allRenderedKeys).not.toContain("screening_checks_status");
  });

  it("does not include id_verification_status (dropped DB column)", () => {
    expect(allRenderedKeys).not.toContain("id_verification_status");
  });

  it("does not include relevant_insurance_status (dropped DB column)", () => {
    expect(allRenderedKeys).not.toContain("relevant_insurance_status");
  });
});

describe("ALL_STATUS_FIELDS", () => {
  it("does not include screening_checks_status", () => {
    expect(ALL_STATUS_FIELDS).not.toContain("screening_checks_status");
  });
});
