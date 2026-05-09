export class XeroError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "XeroError";
  }
}

export interface XeroTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface XeroTokenStore {
  getTokens(): Promise<XeroTokens>;
  saveTokens(tokens: XeroTokens): Promise<void>;
}

export interface XeroHttpClient {
  post(
    url: string,
    body: unknown,
    headers: Record<string, string>
  ): Promise<{ status: number; data: unknown }>;
}

export class XeroService {
  constructor(
    private readonly tokenStore: XeroTokenStore,
    private readonly http: XeroHttpClient,
    private readonly tenantId: string,
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  private async getValidAccessToken(): Promise<string> {
    const tokens = await this.tokenStore.getTokens();
    if (Date.now() < tokens.expiresAt) {
      return tokens.accessToken;
    }

    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await this.http.post(
      "https://identity.xero.com/connect/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
      }).toString(),
      {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }
    );

    if (res.status !== 200) {
      throw new XeroError("Token refresh failed", res.status);
    }

    const data = res.data as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    const refreshed: XeroTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    await this.tokenStore.saveTokens(refreshed);
    return refreshed.accessToken;
  }

  async createEmployee(name: string, email: string): Promise<string> {
    const accessToken = await this.getValidAccessToken();
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || parts[0];

    const res = await this.http.post(
      "https://api.xero.com/payroll.xro/1.0/Employees",
      { Employees: [{ FirstName: firstName, LastName: lastName, Email: email }] },
      {
        Authorization: `Bearer ${accessToken}`,
        "Xero-Tenant-Id": this.tenantId,
        "Content-Type": "application/json",
      }
    );

    if (res.status !== 200) {
      throw new XeroError(`createEmployee failed with status ${res.status}`, res.status);
    }

    const data = res.data as { Employees: Array<{ EmployeeID: string }> };
    return data.Employees[0].EmployeeID;
  }

  async sendSelfSetupInvitation(xeroEmployeeId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken();

    const res = await this.http.post(
      `https://api.xero.com/payroll.xro/1.0/Employees/${xeroEmployeeId}/SelfSetup`,
      {},
      {
        Authorization: `Bearer ${accessToken}`,
        "Xero-Tenant-Id": this.tenantId,
        "Content-Type": "application/json",
      }
    );

    if (res.status !== 200) {
      throw new XeroError(
        `sendSelfSetupInvitation failed with status ${res.status}`,
        res.status
      );
    }
  }
}
