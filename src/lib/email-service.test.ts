import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

import { EmailService } from "./email-service";

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

describe("EmailService.sendReferenceDocuments", () => {
  it("sends to the correct recipient", async () => {
    await EmailService.sendReferenceDocuments(
      "jane@example.com",
      "Jane Smith",
      "https://storage.example/handbook",
      "https://storage.example/sil-manual"
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com" })
    );
  });

  it("uses the correct subject", async () => {
    await EmailService.sendReferenceDocuments(
      "jane@example.com",
      "Jane Smith",
      "https://storage.example/handbook",
      "https://storage.example/sil-manual"
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Your Lifeheart reference documents" })
    );
  });

  it("includes both document URLs in the HTML body", async () => {
    const handbookUrl = "https://storage.example/handbook?token=abc";
    const silManualUrl = "https://storage.example/sil-manual?token=xyz";

    await EmailService.sendReferenceDocuments(
      "jane@example.com",
      "Jane Smith",
      handbookUrl,
      silManualUrl
    );

    const { html } = mockSend.mock.calls[0][0] as { html: string };
    expect(html).toContain(handbookUrl);
    expect(html).toContain(silManualUrl);
  });

  it("throws when Resend returns an error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "API key invalid" } });

    await expect(
      EmailService.sendReferenceDocuments(
        "jane@example.com",
        "Jane Smith",
        "https://storage.example/handbook",
        "https://storage.example/sil-manual"
      )
    ).rejects.toThrow("API key invalid");
  });
});
