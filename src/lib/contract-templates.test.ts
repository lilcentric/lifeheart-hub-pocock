import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  getActiveTemplates,
  addTemplate,
  archiveTemplate,
} from "./contract-templates";
import type { ContractTemplate } from "./types";

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

const template: ContractTemplate = {
  id: "uuid-1",
  name: "Standard Perm",
  employment_type: "permanent",
  version: "1.0",
  template_id: "ann_001",
  archived: false,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => vi.clearAllMocks());

// ── Behavior 2: addTemplate – Zod validation ─────────────────────────────────

describe("addTemplate", () => {
  it("throws a ZodError when name is missing", async () => {
    await expect(
      addTemplate({ employment_type: "permanent", version: "1.0", template_id: "ann_001" })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("inserts and returns the new template", async () => {
    const created = { ...template, id: "uuid-2", name: "New Casual" };
    mockCreateClient.mockResolvedValue(
      makeSupabase({ data: created, error: null }) as never
    );

    const result = await addTemplate({
      name: "New Casual",
      employment_type: "casual",
      version: "2.0",
      template_id: "ann_002",
    });

    expect(result).toEqual(created);
  });
});

// ── Behaviors 4 & 5: archiveTemplate ─────────────────────────────────────────

describe("archiveTemplate", () => {
  it("throws Forbidden when caller is not admin", async () => {
    await expect(archiveTemplate("uuid-1", "officer")).rejects.toThrow(
      "Forbidden"
    );
  });

  it("calls update with archived=true for admin caller", async () => {
    const supabaseMock = makeSupabase({ error: null });
    mockCreateClient.mockResolvedValue(supabaseMock as never);

    await archiveTemplate("uuid-1", "admin");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain = (supabaseMock.from as any).mock.results[0].value;
    expect(chain.update).toHaveBeenCalledWith({ archived: true });
    expect(chain.eq).toHaveBeenCalledWith("id", "uuid-1");
  });
});

// ── Behavior 1: getActiveTemplates ────────────────────────────────────────────

describe("getActiveTemplates", () => {
  it("returns only non-archived templates from supabase", async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ data: [template], error: null }) as never
    );

    const result = await getActiveTemplates();

    expect(result).toEqual([template]);
  });
});
