import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdate = vi.fn();
const mockEqOnUpdate = vi.fn();
const mockGetUser = vi.fn();
const mockSingleProfile = vi.fn();

const mockSupabase = vi.hoisted(() => {
  const eqOnUpdate = vi.fn().mockReturnValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: eqOnUpdate });
  const eqOnSelect = vi.fn().mockReturnValue({ single: vi.fn() });
  const select = vi.fn().mockReturnValue({ eq: eqOnSelect });
  const from = vi.fn((table: string) => ({ select, update }));
  const getUser = vi.fn();
  return { from, update, eqOnUpdate, select, eqOnSelect, getUser };
});

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockSupabase.getUser },
    from: mockSupabase.from,
  }),
}));

vi.mock("@/lib/auth-guard", () => ({
  withRole: vi.fn(async (role: string, fn: (ctx: { userId: string }) => unknown) => {
    if (role === "admin") return fn({ userId: "admin-uuid" });
    return { error: "Unauthorised" };
  }),
}));

import { archiveAction, unarchiveAction } from "./archive";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.eqOnUpdate.mockReturnValue({ error: null });
  mockSupabase.update.mockReturnValue({ eq: mockSupabase.eqOnUpdate });
  mockSupabase.from.mockReturnValue({ select: mockSupabase.select, update: mockSupabase.update });
});

describe("archiveAction", () => {
  it("updates archived_at and archived_by when user is admin", async () => {
    const result = await archiveAction("LF-HDC-00001");

    expect(mockSupabase.from).toHaveBeenCalledWith("onboarding_records");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ archived_by: "admin-uuid" })
    );
    expect(mockSupabase.eqOnUpdate).toHaveBeenCalledWith("id", "LF-HDC-00001");
    expect(result).toEqual({ success: true });
  });

  it("returns error when DB update fails", async () => {
    mockSupabase.eqOnUpdate.mockReturnValueOnce({ error: { message: "DB failure" } });

    const result = await archiveAction("LF-HDC-00001");

    expect(result).toEqual({ error: "DB failure" });
  });
});

describe("unarchiveAction", () => {
  it("clears archived_at and archived_by when user is admin", async () => {
    const result = await unarchiveAction("LF-HDC-00001");

    expect(mockSupabase.update).toHaveBeenCalledWith({ archived_at: null, archived_by: null });
    expect(mockSupabase.eqOnUpdate).toHaveBeenCalledWith("id", "LF-HDC-00001");
    expect(result).toEqual({ success: true });
  });

  it("returns error when DB update fails", async () => {
    mockSupabase.eqOnUpdate.mockReturnValueOnce({ error: { message: "DB failure" } });

    const result = await unarchiveAction("LF-HDC-00001");

    expect(result).toEqual({ error: "DB failure" });
  });
});
