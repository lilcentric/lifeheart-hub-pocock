import { describe, it, expect, vi, beforeEach } from "vitest";
import { archiveRecord, unarchiveRecord } from "./archive-service";

function makeSupabaseMock(error: unknown = null) {
  const eqMock = vi.fn().mockResolvedValue({ error });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  const fromMock = vi.fn().mockReturnValue({ update: updateMock });
  return { client: { from: fromMock }, updateMock, eqMock };
}

describe("archiveRecord", () => {
  it("updates archived_at and archived_by for the given record", async () => {
    const { client, updateMock, eqMock } = makeSupabaseMock();
    const now = new Date("2026-05-08T00:00:00.000Z");
    vi.setSystemTime(now);

    await archiveRecord(client as never, "LF-HDC-00001", "user-uuid-123");

    expect(client.from).toHaveBeenCalledWith("onboarding_records");
    expect(updateMock).toHaveBeenCalledWith({
      archived_at: now.toISOString(),
      archived_by: "user-uuid-123",
    });
    expect(eqMock).toHaveBeenCalledWith("id", "LF-HDC-00001");

    vi.useRealTimers();
  });

  it("returns an error object when the DB call fails", async () => {
    const { client } = makeSupabaseMock({ message: "DB error" });

    const result = await archiveRecord(client as never, "LF-HDC-00001", "user-uuid-123");

    expect(result.error).toMatchObject({ message: "DB error" });
  });

  it("returns null error on success", async () => {
    const { client } = makeSupabaseMock(null);

    const result = await archiveRecord(client as never, "LF-HDC-00001", "user-uuid-123");

    expect(result.error).toBeNull();
  });
});

describe("unarchiveRecord", () => {
  it("nulls archived_at and archived_by for the given record", async () => {
    const { client, updateMock, eqMock } = makeSupabaseMock();

    await unarchiveRecord(client as never, "LF-HDC-00001");

    expect(client.from).toHaveBeenCalledWith("onboarding_records");
    expect(updateMock).toHaveBeenCalledWith({
      archived_at: null,
      archived_by: null,
    });
    expect(eqMock).toHaveBeenCalledWith("id", "LF-HDC-00001");
  });

  it("returns an error object when the DB call fails", async () => {
    const { client } = makeSupabaseMock({ message: "DB error" });

    const result = await unarchiveRecord(client as never, "LF-HDC-00001");

    expect(result.error).toMatchObject({ message: "DB error" });
  });

  it("returns null error on success", async () => {
    const { client } = makeSupabaseMock(null);

    const result = await unarchiveRecord(client as never, "LF-HDC-00001");

    expect(result.error).toBeNull();
  });
});
