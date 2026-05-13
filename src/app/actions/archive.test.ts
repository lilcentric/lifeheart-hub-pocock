import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockSingleProfile, mockSupabase } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockSingleProfile = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingleProfile });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  const mockSupabase = { auth: { getUser: mockGetUser }, from: mockFrom };
  return { mockGetUser, mockSingleProfile, mockSupabase };
});

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/archive-service", () => ({
  archiveRecord: vi.fn().mockResolvedValue({ error: null }),
  unarchiveRecord: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

import { archiveAction, unarchiveAction } from "./archive";
import { archiveRecord, unarchiveRecord } from "@/lib/archive-service";

function setupUser(userId: string, role: string) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
  mockSingleProfile.mockResolvedValue({ data: { role }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Re-apply default mock implementations after clearAllMocks
  vi.mocked(archiveRecord).mockResolvedValue({ error: null });
  vi.mocked(unarchiveRecord).mockResolvedValue({ error: null });
});

describe("archiveAction", () => {
  it("calls archiveRecord when user is admin", async () => {
    setupUser("admin-uuid", "admin");

    const result = await archiveAction("LF-HDC-00001");

    expect(archiveRecord).toHaveBeenCalledWith(
      mockSupabase,
      "LF-HDC-00001",
      "admin-uuid"
    );
    expect(result).toEqual({ success: true });
  });

  it("returns unauthorized error when user is officer", async () => {
    setupUser("officer-uuid", "officer");

    const result = await archiveAction("LF-HDC-00001");

    expect(archiveRecord).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Unauthorised" });
  });

  it("returns unauthorized error when user is viewer", async () => {
    setupUser("viewer-uuid", "viewer");

    const result = await archiveAction("LF-HDC-00001");

    expect(archiveRecord).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Unauthorised" });
  });

  it("returns error message when archiveRecord fails", async () => {
    setupUser("admin-uuid", "admin");
    vi.mocked(archiveRecord).mockResolvedValueOnce({
      error: { message: "DB failure" },
    });

    const result = await archiveAction("LF-HDC-00001");

    expect(result).toEqual({ error: "DB failure" });
  });
});

describe("unarchiveAction", () => {
  it("calls unarchiveRecord when user is admin", async () => {
    setupUser("admin-uuid", "admin");

    const result = await unarchiveAction("LF-HDC-00001");

    expect(unarchiveRecord).toHaveBeenCalledWith(mockSupabase, "LF-HDC-00001");
    expect(result).toEqual({ success: true });
  });

  it("returns unauthorized error when user is officer", async () => {
    setupUser("officer-uuid", "officer");

    const result = await unarchiveAction("LF-HDC-00001");

    expect(unarchiveRecord).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Unauthorised" });
  });

  it("returns error message when unarchiveRecord fails", async () => {
    setupUser("admin-uuid", "admin");
    vi.mocked(unarchiveRecord).mockResolvedValueOnce({
      error: { message: "DB failure" },
    });

    const result = await unarchiveAction("LF-HDC-00001");

    expect(result).toEqual({ error: "DB failure" });
  });
});
