import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { describe, it, expect, beforeAll } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/010_staff_details_align.sql"
);

describe("migration 010 — staff_details schema alignment", () => {
  let sql: string;

  beforeAll(() => {
    expect(existsSync(MIGRATION_PATH), `Missing migration file: ${MIGRATION_PATH}`).toBe(true);
    sql = readFileSync(MIGRATION_PATH, "utf-8");
  });

  it("exists as a non-empty SQL migration file", () => {
    expect(sql.length).toBeGreaterThan(0);
  });

  it("renames onboarding_record_id to record_id", () => {
    expect(sql).toMatch(/onboarding_record_id/i);
    expect(sql).toMatch(/record_id/i);
    expect(sql).toMatch(/rename\s+column\s+onboarding_record_id\s+to\s+record_id/i);
  });

  it("adds first_name and last_name columns split from full_name", () => {
    expect(sql).toMatch(/first_name/i);
    expect(sql).toMatch(/last_name/i);
    expect(sql).toMatch(/full_name/i);
  });

  it("renames emergency_name to emergency_contact_name", () => {
    expect(sql).toMatch(/rename\s+column\s+emergency_name\s+to\s+emergency_contact_name/i);
  });

  it("renames emergency_phone to emergency_contact_phone", () => {
    expect(sql).toMatch(/rename\s+column\s+emergency_phone\s+to\s+emergency_contact_phone/i);
  });

  it("renames citizenship_status to right_to_work", () => {
    expect(sql).toMatch(/rename\s+column\s+citizenship_status\s+to\s+right_to_work/i);
  });

  it("renames submitted_at to created_at", () => {
    expect(sql).toMatch(/rename\s+column\s+submitted_at\s+to\s+created_at/i);
  });

  it("handles visa_expiry to visa_expiry_date migration", () => {
    expect(sql).toMatch(/visa_expiry/i);
    expect(sql).toMatch(/visa_expiry_date/i);
  });

  it("adds updated_at column", () => {
    expect(sql).toMatch(/updated_at/i);
  });

  it("is idempotent — all renames are guarded by information_schema.columns checks", () => {
    expect(sql).toMatch(/information_schema\.columns/i);
    const checks = sql.match(/information_schema\.columns/gi) ?? [];
    expect(checks.length).toBeGreaterThanOrEqual(7);
  });
});
