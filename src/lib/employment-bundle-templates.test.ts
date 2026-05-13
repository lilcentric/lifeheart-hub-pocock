import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  getActiveEmploymentBundles,
  addEmploymentBundle,
  archiveEmploymentBundle,
} from "./employment-bundle-templates";
import type { EmploymentBundleTemplate } from "./types";

const mockCreateClient = vi.mocked(createClient);

function makeSupabase(result: { data?: unknown; error?: unknown | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => chain),
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return { from: vi.fn(() => chain) };
}

const bundle: EmploymentBundleTemplate = {
  id: "uuid-1",
  name: "Employment Bundle - Permanent 2.1",
  employment_type: "permanent",
  version: "2.1",
  annature_template_id: "PLACEHOLDER_PERM_2_1",
  archived: false,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => vi.clearAllMocks());

describe("addEmploymentBundle", () => {
  it("throws a ZodError when name is missing", async () => {
    await expect(
      addEmploymentBundle({ employment_type: "permanent", version: "2.1", annature_template_id: "ann_001" })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("inserts and returns the new employment bundle", async () => {
    const created = { ...bundle, id: "uuid-2", name: "Employment Bundle - Casual 2.2" };
    mockCreateClient.mockResolvedValue(
      makeSupabase({ data: created, error: null }) as never
    );

    const result = await addEmploymentBundle({
      name: "Employment Bundle - Casual 2.2",
      employment_type: "casual",
      version: "2.2",
      annature_template_id: "PLACEHOLDER_CAS_2_2",
    });

    expect(result).toEqual(created);
  });
});

describe("archiveEmploymentBundle", () => {
  it("throws Forbidden when caller is not admin", async () => {
    await expect(archiveEmploymentBundle("uuid-1", "officer")).rejects.toThrow(
      "Forbidden"
    );
  });

  it("calls update with archived=true for admin caller", async () => {
    const supabaseMock = makeSupabase({ error: null });
    mockCreateClient.mockResolvedValue(supabaseMock as never);

    await archiveEmploymentBundle("uuid-1", "admin");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain = (supabaseMock.from as any).mock.results[0].value;
    expect(chain.update).toHaveBeenCalledWith({ archived: true });
    expect(chain.eq).toHaveBeenCalledWith("id", "uuid-1");
  });
});

describe("getActiveEmploymentBundles", () => {
  it("returns only non-archived employment bundles from supabase", async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ data: [bundle], error: null }) as never
    );

    const result = await getActiveEmploymentBundles();

    expect(result).toEqual([bundle]);
  });

  it("queries the employment_bundle_templates table", async () => {
    const supabaseMock = makeSupabase({ data: [], error: null });
    mockCreateClient.mockResolvedValue(supabaseMock as never);

    await getActiveEmploymentBundles();

    expect(supabaseMock.from).toHaveBeenCalledWith("employment_bundle_templates");
  });
});
