import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { describe, it, expect, beforeAll } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATION_PATH = resolve(__dirname, "../../supabase/migrations/006_real_template_ids.sql");

describe("migration 006 — real Annature template IDs", () => {
  let sql: string;

  beforeAll(() => {
    sql = readFileSync(MIGRATION_PATH, "utf-8");
  });

  it("contains no PLACEHOLDER values in SET clauses", () => {
    // WHERE clauses may reference old names; SET clauses must not contain PLACEHOLDER
    const setClauses = sql.match(/set\s+[\s\S]*?;/gi) ?? [];
    for (const clause of setClauses) {
      expect(clause, "SET clause must not contain PLACEHOLDER").not.toMatch(/PLACEHOLDER/i);
    }
  });

  it("renames Permanent 2.4 → Permanent 3.1", () => {
    // The new name must be SET; the old name may appear only in a WHERE clause
    expect(sql).toMatch(/set\s[\s\S]*?'Employment Bundle - Permanent 3\.1'/);
  });

  it("includes all 7 real Annature template IDs", () => {
    const realIds = [
      "f7cba589dbed427fa413b0515f6d2146", // Permanent 2.1
      "5a20c7e1bbc84e2dbb37578b96070dd6", // Permanent 2.2
      "ccbbf549bfca451ba2942719f6a506e4", // Permanent 2.3
      "084a6d93e309434b82ad9782555a0d3d", // Permanent 3.1
      "12629e054d9c4d3d80b5beae041d5d04", // Casual 2.1
      "55cc925587d44deb927ec7e1d909f764", // Casual 2.2
      "ee06ffad38554c66a1ad1b4e1be3e01b", // Casual 2.3
    ];
    for (const id of realIds) {
      expect(sql, `Missing template ID ${id}`).toContain(id);
    }
  });
});
