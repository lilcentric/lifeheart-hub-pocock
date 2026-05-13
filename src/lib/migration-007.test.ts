import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { describe, it, expect, beforeAll } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/007_bundle_a_envelope_id.sql"
);

describe("migration 007 — bundle_a_envelope_id column", () => {
  let sql: string;

  beforeAll(() => {
    expect(existsSync(MIGRATION_PATH), `Missing migration file: ${MIGRATION_PATH}`).toBe(true);
    sql = readFileSync(MIGRATION_PATH, "utf-8");
  });

  it("exists as a SQL migration file", () => {
    expect(sql.length).toBeGreaterThan(0);
  });

  it("adds bundle_a_envelope_id as text on onboarding_records", () => {
    expect(sql).toMatch(/alter\s+table\s+onboarding_records/i);
    expect(sql).toMatch(/bundle_a_envelope_id\s+text/i);
  });

  it("is idempotent — uses 'add column if not exists' so it's safe against the manually patched prod DB", () => {
    expect(sql).toMatch(/add\s+column\s+if\s+not\s+exists\s+bundle_a_envelope_id/i);
  });
});
