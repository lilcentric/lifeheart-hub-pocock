import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeNdisWscTransition } from "./ndiswsc-logic";

describe("executeNdisWscTransition", () => {
  const mockUpdate = vi.fn().mockResolvedValue({ error: null });

  beforeEach(() => {
    mockUpdate.mockClear();
    mockUpdate.mockResolvedValue({ error: null });
  });

  it("updates the record when admin transitions in_progress → pending_verification", async () => {
    const result = await executeNdisWscTransition({
      recordId: "LF-HDC-00001",
      currentStatus: "in_progress",
      targetStatus: "pending_verification",
      userRole: "admin",
      updateRecord: mockUpdate,
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith("LF-HDC-00001", "pending_verification");
  });

  it("updates the record when admin transitions pending_verification → completed", async () => {
    const result = await executeNdisWscTransition({
      recordId: "LF-HDC-00002",
      currentStatus: "pending_verification",
      targetStatus: "completed",
      userRole: "admin",
      updateRecord: mockUpdate,
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith("LF-HDC-00002", "completed");
  });

  it("rejects officer callers with an error and does not call updateRecord", async () => {
    const result = await executeNdisWscTransition({
      recordId: "LF-HDC-00001",
      currentStatus: "in_progress",
      targetStatus: "pending_verification",
      userRole: "officer",
      updateRecord: mockUpdate,
    });

    expect(result).toEqual({ error: "Unauthorised" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects viewer callers with an error and does not call updateRecord", async () => {
    const result = await executeNdisWscTransition({
      recordId: "LF-HDC-00001",
      currentStatus: "in_progress",
      targetStatus: "pending_verification",
      userRole: "viewer",
      updateRecord: mockUpdate,
    });

    expect(result).toEqual({ error: "Unauthorised" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects illegal transitions for admin and does not call updateRecord", async () => {
    const result = await executeNdisWscTransition({
      recordId: "LF-HDC-00001",
      currentStatus: "not_completed",
      targetStatus: "pending_verification",
      userRole: "admin",
      updateRecord: mockUpdate,
    });

    expect(result).toEqual({ error: "Invalid transition" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("surfaces database errors", async () => {
    mockUpdate.mockResolvedValue({ error: { message: "DB error" } });

    const result = await executeNdisWscTransition({
      recordId: "LF-HDC-00001",
      currentStatus: "in_progress",
      targetStatus: "pending_verification",
      userRole: "admin",
      updateRecord: mockUpdate,
    });

    expect(result).toEqual({ error: "DB error" });
  });
});
