import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeNdisWscApplying } from "./ndiswsc-upload-logic";

describe("executeNdisWscApplying", () => {
  const mockUpdateStatus = vi.fn();

  beforeEach(() => {
    mockUpdateStatus.mockClear();
    mockUpdateStatus.mockResolvedValue({ error: null });
  });

  it("sets ndiswsc_status to in_progress", async () => {
    const result = await executeNdisWscApplying("LF-HDC-00001", mockUpdateStatus);

    expect(result).toEqual({ success: true });
    expect(mockUpdateStatus).toHaveBeenCalledWith("LF-HDC-00001", "in_progress");
  });

  it("surfaces database errors", async () => {
    mockUpdateStatus.mockResolvedValue({ error: { message: "DB error" } });

    const result = await executeNdisWscApplying("LF-HDC-00001", mockUpdateStatus);

    expect(result).toEqual({ error: "DB error" });
    expect(mockUpdateStatus).toHaveBeenCalledOnce();
  });
});
