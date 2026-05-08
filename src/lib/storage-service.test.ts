import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "./storage-service";

// ---------------------------------------------------------------------------
// Supabase mock factory
// ---------------------------------------------------------------------------

function makeStorageMock() {
  return {
    createSignedUploadUrl: vi.fn(),
    createSignedUrl: vi.fn(),
  };
}

function makeDbMock() {
  const chain = {
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
  return {
    from: vi.fn().mockReturnValue(chain),
    _chain: chain,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  const storageMock = makeStorageMock();
  const dbMock = makeDbMock();
  const service = new StorageService(dbMock as never, storageMock as never);
  return { service, storageMock, dbMock };
}

// ---------------------------------------------------------------------------
// getSingleUploadUrl
// ---------------------------------------------------------------------------

describe("getSingleUploadUrl", () => {
  it("returns uploadUrl and path built from recordId, documentType, filename", async () => {
    const { service, storageMock } = makeService();
    storageMock.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/signed-upload" },
      error: null,
    });

    const result = await service.getSingleUploadUrl(
      "LF-HDC-00001",
      "identity",
      "passport.pdf"
    );

    expect(result.path).toBe("onboarding/LF-HDC-00001/identity/passport.pdf");
    expect(result.uploadUrl).toBe("https://storage.example/signed-upload");
    expect(storageMock.createSignedUploadUrl).toHaveBeenCalledWith(
      "onboarding/LF-HDC-00001/identity/passport.pdf"
    );
  });

  it("throws when Supabase returns an error", async () => {
    const { service, storageMock } = makeService();
    storageMock.createSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: "Bucket not found" },
    });

    await expect(
      service.getSingleUploadUrl("LF-HDC-00001", "identity", "passport.pdf")
    ).rejects.toThrow("Bucket not found");
  });
});

// ---------------------------------------------------------------------------
// recordSingleUpload
// ---------------------------------------------------------------------------

describe("recordSingleUpload", () => {
  it("updates the correct column on onboarding_records for the given recordId", async () => {
    const { service, dbMock } = makeService();

    await service.recordSingleUpload(
      "LF-HDC-00001",
      "identity",
      "onboarding/LF-HDC-00001/identity/passport.pdf"
    );

    expect(dbMock.from).toHaveBeenCalledWith("onboarding_records");
    expect(dbMock._chain.update).toHaveBeenCalledWith({
      identity_storage_path: "onboarding/LF-HDC-00001/identity/passport.pdf",
    });
    expect(dbMock._chain.eq).toHaveBeenCalledWith("id", "LF-HDC-00001");
  });

  it("throws when the db update returns an error", async () => {
    const { service, dbMock } = makeService();
    dbMock._chain.eq.mockResolvedValue({ error: { message: "RLS violation" } });

    await expect(
      service.recordSingleUpload(
        "LF-HDC-00001",
        "identity",
        "onboarding/LF-HDC-00001/identity/passport.pdf"
      )
    ).rejects.toThrow("RLS violation");
  });
});

// ---------------------------------------------------------------------------
// getMultiUploadUrl
// ---------------------------------------------------------------------------

describe("getMultiUploadUrl", () => {
  it("returns uploadUrl and path using the same path structure as single uploads", async () => {
    const { service, storageMock } = makeService();
    storageMock.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/multi-signed-upload" },
      error: null,
    });

    const result = await service.getMultiUploadUrl(
      "LF-HDC-00002",
      "qualifications",
      "cert.pdf"
    );

    expect(result.path).toBe("onboarding/LF-HDC-00002/qualifications/cert.pdf");
    expect(result.uploadUrl).toBe("https://storage.example/multi-signed-upload");
    expect(storageMock.createSignedUploadUrl).toHaveBeenCalledWith(
      "onboarding/LF-HDC-00002/qualifications/cert.pdf"
    );
  });

  it("throws when Supabase returns an error", async () => {
    const { service, storageMock } = makeService();
    storageMock.createSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: "Storage error" },
    });

    await expect(
      service.getMultiUploadUrl("LF-HDC-00002", "qualifications", "cert.pdf")
    ).rejects.toThrow("Storage error");
  });
});

// ---------------------------------------------------------------------------
// recordMultiUpload
// ---------------------------------------------------------------------------

describe("recordMultiUpload", () => {
  it("inserts a row into onboarding_documents with record_id, document_type, path and filename", async () => {
    const { service, dbMock } = makeService();

    await service.recordMultiUpload(
      "LF-HDC-00002",
      "qualifications",
      "onboarding/LF-HDC-00002/qualifications/cert.pdf",
      "cert.pdf"
    );

    expect(dbMock.from).toHaveBeenCalledWith("onboarding_documents");
    expect(dbMock._chain.insert).toHaveBeenCalledWith({
      record_id: "LF-HDC-00002",
      document_type: "qualifications",
      path: "onboarding/LF-HDC-00002/qualifications/cert.pdf",
      filename: "cert.pdf",
    });
  });

  it("throws when the insert returns an error", async () => {
    const { service, dbMock } = makeService();
    dbMock._chain.insert.mockResolvedValue({ error: { message: "Insert failed" } });

    await expect(
      service.recordMultiUpload(
        "LF-HDC-00002",
        "qualifications",
        "onboarding/LF-HDC-00002/qualifications/cert.pdf",
        "cert.pdf"
      )
    ).rejects.toThrow("Insert failed");
  });
});

// ---------------------------------------------------------------------------
// getSignedUrl
// ---------------------------------------------------------------------------

describe("getSignedUrl", () => {
  it("returns a download URL and passes the expiry through to Supabase", async () => {
    const { service, storageMock } = makeService();
    storageMock.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/download-signed" },
      error: null,
    });

    const url = await service.getSignedUrl(
      "onboarding/LF-HDC-00001/identity/passport.pdf",
      3600
    );

    expect(url).toBe("https://storage.example/download-signed");
    expect(storageMock.createSignedUrl).toHaveBeenCalledWith(
      "onboarding/LF-HDC-00001/identity/passport.pdf",
      3600
    );
  });

  it("throws when Supabase returns an error", async () => {
    const { service, storageMock } = makeService();
    storageMock.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    await expect(
      service.getSignedUrl("onboarding/LF-HDC-00001/identity/passport.pdf", 3600)
    ).rejects.toThrow("Not found");
  });
});
