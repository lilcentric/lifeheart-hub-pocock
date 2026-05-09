import { describe, it, expect, vi } from "vitest";
import { XeroService, XeroError } from "./xero-service";

const makeTokenStore = (expiresAt = Date.now() + 3_600_000) => ({
  getTokens: vi.fn().mockResolvedValue({
    accessToken: "valid-access-token",
    refreshToken: "valid-refresh-token",
    expiresAt,
  }),
  saveTokens: vi.fn().mockResolvedValue(undefined),
});

const makeHttp = (status: number, data: unknown) => ({
  post: vi.fn().mockResolvedValue({ status, data }),
});

describe("XeroService.createEmployee", () => {
  it("returns a xeroEmployeeId on success", async () => {
    const tokenStore = makeTokenStore();
    const http = makeHttp(200, {
      Employees: [{ EmployeeID: "xero-emp-123" }],
    });
    const service = new XeroService(
      tokenStore,
      http,
      "tenant-id",
      "client-id",
      "client-secret"
    );

    const id = await service.createEmployee("Jane Smith", "jane@example.com");

    expect(id).toBe("xero-emp-123");
  });
});

describe("XeroService.createEmployee — error handling", () => {
  it("throws a XeroError on non-2xx Xero API response", async () => {
    const tokenStore = makeTokenStore();
    const http = makeHttp(400, { Detail: "Validation failed" });
    const service = new XeroService(
      tokenStore,
      http,
      "tenant-id",
      "client-id",
      "client-secret"
    );

    await expect(
      service.createEmployee("Jane Smith", "jane@example.com")
    ).rejects.toThrow(XeroError);
  });
});

describe("XeroService — token refresh", () => {
  it("refreshes the access token automatically when expired and uses the new token", async () => {
    const expiredAt = Date.now() - 1000;
    const tokenStore = makeTokenStore(expiredAt);
    const http = {
      post: vi
        .fn()
        .mockResolvedValueOnce({
          status: 200,
          data: {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            expires_in: 1800,
          },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { Employees: [{ EmployeeID: "xero-emp-456" }] },
        }),
    };
    const service = new XeroService(
      tokenStore,
      http,
      "tenant-id",
      "client-id",
      "client-secret"
    );

    await service.createEmployee("Bob Jones", "bob@example.com");

    expect(tokenStore.saveTokens).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "new-access-token" })
    );
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("Employees"),
      expect.anything(),
      expect.objectContaining({ Authorization: "Bearer new-access-token" })
    );
  });
});
