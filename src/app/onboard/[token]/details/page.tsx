import { createServiceClient } from "@/lib/supabase/service";
import { validateToken } from "@/lib/token-service";
import StaffDetailsForm from "@/components/onboarding/StaffDetailsForm";
import type { StaffDetail } from "@/lib/types";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function StaffDetailsPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  const record = await validateToken(token, {
    lookupToken: (t) =>
      supabase
        .from("onboarding_tokens")
        .select("*")
        .eq("id", t)
        .maybeSingle()
        .then((r) => ({ data: r.data, error: r.error })),
    getRecord: (id) =>
      supabase
        .from("onboarding_records")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then((r) => ({ data: r.data, error: r.error })),
  });

  if (!record) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">
            This link is no longer valid
          </h1>
          <p className="text-sm text-gray-500">
            Your onboarding link may have expired or been revoked. Please
            contact your onboarding officer for a new link.
          </p>
        </div>
      </main>
    );
  }

  const { data: rawDetail } = await supabase
    .from("staff_details")
    .select("*")
    .eq("record_id", record.id)
    .maybeSingle();
  const existing = rawDetail as StaffDetail | null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <header>
          <a
            href={`/onboard/${token}`}
            className="text-xs text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← Back to checklist
          </a>
          <h1 className="text-2xl font-semibold text-gray-900">
            Employee details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Please fill in your personal details below. Payroll information
            (banking, tax file number, superannuation) is collected separately
            via Xero.
          </p>
        </header>

        <StaffDetailsForm token={token} existing={existing} />
      </div>
    </main>
  );
}
