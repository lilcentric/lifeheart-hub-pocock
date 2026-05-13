/**
 * Live integration test — verifies the exact JSON field path for the signing URL
 * returned by GET /v1/envelopes/{id}.
 *
 * Skipped automatically when ANNATURE_ID is absent (CI / unit-test runs).
 * Run manually with:
 *   ANNATURE_ID=... ANNATURE_KEY=... npx vitest run annature-logic.live
 *
 * Uses the FWA template (the only template + role pair available in .env.local).
 * A test envelope is created and immediately inspected — no human action required.
 */

import { describe, it, expect } from "vitest";

const creds = {
  annatureId: process.env.ANNATURE_ID ?? "",
  annatureKey: process.env.ANNATURE_KEY ?? "",
  accountId: process.env.ANNATURE_ACCOUNT_ID ?? "",
  templateId: process.env.ANNATURE_FLEXIBLE_WORKING_TEMPLATE_ID ?? "",
  roleId: process.env.ANNATURE_FWA_ROLE_ID ?? "",
};

const hasLiveCreds = Object.values(creds).every(Boolean);

const BASE = "https://api.annature.com.au";

describe.skipIf(!hasLiveCreds)("live: Annature GET /v1/envelopes/{id} — signing URL field path", () => {
  it(
    "GET /v1/envelopes/{id} uses recipients[] not signers[], and signing_link is absent from recipient objects",
    async () => {
      const authHeaders = {
        "Content-Type": "application/json",
        "X-Annature-Id": creds.annatureId,
        "X-Annature-Key": creds.annatureKey,
      };

      // Step 1 — list existing envelopes and pick the first one
      // (avoids needing to know all role IDs required to create a fresh envelope)
      const listRes = await fetch(`${BASE}/v1/envelopes?account_id=${creds.accountId}&limit=1`, {
        headers: {
          "X-Annature-Id": creds.annatureId,
          "X-Annature-Key": creds.annatureKey,
        },
      });
      if (!listRes.ok) {
        const errBody = await listRes.text();
        console.error(`\nGET /v1/envelopes (list) ${listRes.status} body:\n`, errBody);
      }
      expect(listRes.ok, `GET /v1/envelopes (list) failed with status ${listRes.status}`).toBe(true);
      const listData = await listRes.json();

      // Pick a "sent" envelope — only pending-signature envelopes carry active signing links
      const allEnvelopes: { id: string; status: string }[] = Array.isArray(listData)
        ? listData
        : listData.data ?? listData.envelopes ?? [];
      expect(allEnvelopes.length, "No existing envelopes found in this account").toBeGreaterThan(0);
      const sentEnvelope = allEnvelopes.find((e) => e.status === "sent") ?? allEnvelopes[0];
      const envelopeId = sentEnvelope.id;
      console.log(`\nUsing envelope ${envelopeId} (status: ${sentEnvelope.status})`);

      // Step 2 — fetch the envelope
      const getRes = await fetch(`${BASE}/v1/envelopes/${envelopeId}`, {
        headers: {
          "X-Annature-Id": creds.annatureId,
          "X-Annature-Key": creds.annatureKey,
        },
      });
      expect(getRes.ok, `GET /v1/envelopes/${envelopeId} failed with status ${getRes.status}`).toBe(true);
      const getData = await getRes.json();

      // Always log the full shape — handy when the assertion fails
      console.log(
        "\nGET /v1/envelopes/{id} full response:\n",
        JSON.stringify(getData, null, 2)
      );

      // Step 3 — verify the confirmed API shape (live test 2026-05-13)
      //
      // Finding: the response uses "recipients" not "signers".
      // "signing_link" is NOT present in GET /v1/envelopes/{id} recipients — the field may only
      // exist in a future signing-session endpoint. signingUrl is always null for now.
      expect(getData?.signers, 'GET response must NOT have a "signers" field (use "recipients")').toBeUndefined();
      expect(Array.isArray(getData?.recipients), 'GET response must have a "recipients" array').toBe(true);

      const recipientKeys = Object.keys(getData?.recipients?.[0] ?? {});
      console.log("\nrecipients[0] keys:", recipientKeys.join(", "));

      // signing_link is absent from the current API — document this explicitly
      expect(
        getData?.recipients?.[0]?.signing_link,
        "signing_link is not yet returned by GET /v1/envelopes/{id} — signingUrl will remain null until Annature adds it"
      ).toBeUndefined();
    },
    30_000 // live network call — allow 30 s
  );
});
