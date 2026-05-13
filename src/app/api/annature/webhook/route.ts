import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  executeAnnatureWebhook,
  type AnnatureWebhookDeps,
} from "@/lib/services/annature-webhook-logic";

const ANNATURE_BASE = "https://api.annature.com.au";

function validateHmac(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-annature-signature") ?? "";

  const db = createServiceClient();

  const deps: AnnatureWebhookDeps = {
    webhookSecret: process.env.ANNATURE_WEBHOOK_SECRET!,
    validateHmac,

    async findRecordByEnvelopeId(envelopeId) {
      const columns = [
        { col: "bundle_a_envelope_id", type: "bundle_a" as const },
        { col: "tna_envelope_id", type: "tna" as const },
        { col: "fwa_envelope_id", type: "fwa" as const },
      ];

      for (const { col, type } of columns) {
        const { data } = await db
          .from("onboarding_records")
          .select("id")
          .eq(col as never, envelopeId)
          .single();

        if (data) return { recordId: data.id, envelopeType: type };
      }

      return null;
    },

    async updateRecordFields(recordId, fields) {
      const { error } = await db
        .from("onboarding_records")
        .update(fields as never)
        .eq("id", recordId);
      return { error: error?.message ?? null };
    },

    async fetchAndStorePdf(recordId, envelopeId, documentType) {
      const annatureId = process.env.ANNATURE_PUBLIC_KEY!;
      const annatureKey = process.env.ANNATURE_PRIVATE_KEY!;

      const res = await fetch(
        `${ANNATURE_BASE}/v1/envelopes/${envelopeId}/download`,
        {
          headers: {
            "X-Annature-Id": annatureId,
            "X-Annature-Key": annatureKey,
          },
        }
      );

      if (!res.ok) return { error: `Annature download failed: ${res.status}` };

      const pdfBuffer = Buffer.from(await res.arrayBuffer());
      const path = `onboarding/${recordId}/${documentType}/signed.pdf`;

      const { error } = await db.storage
        .from("documents")
        .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });

      return { error: error?.message ?? null };
    },
  };

  const result = await executeAnnatureWebhook(rawBody, signature, deps);

  return NextResponse.json(
    result.status === 200 ? {} : { error: (result as { error: string }).error },
    { status: result.status }
  );
}
