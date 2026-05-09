/**
 * One-time Xero OAuth2 consent flow.
 * Run: node scripts/xero-auth.mjs
 *
 * Prints XERO_TENANT_ID and XERO_REFRESH_TOKEN — paste both into .env.local.
 */

import http from "http";
import { exec } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CLIENT_ID = process.env.XERO_CLIENT_ID;
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/api/xero/callback";
const SCOPES = "payroll.employees payroll.settings offline_access openid profile email";
const PORT = 3000;
const CALLBACK_PATH = "/api/xero/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing XERO_CLIENT_ID or XERO_CLIENT_SECRET in environment.");
  console.error("Run: node --env-file=.env.local scripts/xero-auth.mjs");
  process.exit(1);
}

const state = Math.random().toString(36).slice(2);

const authUrl =
  `https://login.xero.com/identity/connect/authorize` +
  `?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&state=${state}`;

console.log("\n=== Xero OAuth2 Setup ===\n");
console.log("Opening browser for Xero consent...");
console.log("If it doesn't open automatically, visit:\n");
console.log(authUrl);
console.log("\nWaiting for redirect...\n");

// Open browser (Windows / Mac / Linux)
const openCmd =
  process.platform === "win32"
    ? `start "" "${authUrl}"`
    : process.platform === "darwin"
    ? `open "${authUrl}"`
    : `xdg-open "${authUrl}"`;
exec(openCmd);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== CALLBACK_PATH) {
    res.writeHead(404);
    res.end();
    return;
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2>Error: ${error}</h2><p>Check terminal.</p>`);
    console.error("Xero returned an error:", error);
    server.close();
    return;
  }

  if (returnedState !== state) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<h2>State mismatch — possible CSRF</h2>");
    server.close();
    return;
  }

  // Exchange code for tokens
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2>Token exchange failed</h2><pre>${body}</pre>`);
    console.error("Token exchange failed:", body);
    server.close();
    return;
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token } = tokens;

  // Fetch tenant connections
  const connRes = await fetch("https://api.xero.com/connections", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const connections = await connRes.json();

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    `<h2>Success! Check your terminal for the values to paste into .env.local</h2>`
  );

  console.log("\n✓ Token exchange successful!\n");
  console.log("Connected Xero organisations:");
  connections.forEach((c, i) => {
    console.log(`  [${i + 1}] ${c.tenantName}  →  tenantId: ${c.tenantId}`);
  });

  const tenant = connections[0];
  console.log("\n--- Paste these into .env.local ---\n");
  console.log(`XERO_TENANT_ID=${tenant?.tenantId ?? "<pick from above>"}`);
  console.log(`XERO_REFRESH_TOKEN=${refresh_token}`);
  console.log("\n------------------------------------\n");

  server.close();
});

server.listen(PORT, () => {
  // listening — waiting for redirect
});
