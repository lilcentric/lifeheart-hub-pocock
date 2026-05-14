import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock hoisting
// ---------------------------------------------------------------------------

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

import { EmailService } from "./email-service";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "test-key";
  process.env.NEXT_PUBLIC_APP_URL = "https://hub.lifeheart.com.au";
  mockSend.mockResolvedValue({ error: null });
});

describe("EmailService.sendSubmissionNotification", () => {
  it("sends to the officer email address", async () => {
    await EmailService.sendSubmissionNotification(
      "officer@lifeheart.com.au",
      "Alice Example",
      "LF-HDC-00001"
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "officer@lifeheart.com.au" })
    );
  });

  it("includes staff name in the subject", async () => {
    await EmailService.sendSubmissionNotification(
      "officer@lifeheart.com.au",
      "Alice Example",
      "LF-HDC-00001"
    );

    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain("Alice Example");
  });

  it("includes a link to the onboarding record in the body", async () => {
    await EmailService.sendSubmissionNotification(
      "officer@lifeheart.com.au",
      "Alice Example",
      "LF-HDC-00001"
    );

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("https://hub.lifeheart.com.au/onboarding/LF-HDC-00001");
  });
});
