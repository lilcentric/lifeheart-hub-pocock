import { createServiceClient } from "@/lib/supabase/service";
import { validateToken } from "@/lib/token-service";
import { getStaffFacingItems } from "@/utils/portal-items";
import StatusBadge from "@/components/onboarding/StatusBadge";
import NdisWscUploadPanel from "@/components/onboarding/NdisWscUploadPanel";

interface Props {
  params: Promise<{ token: string }>;
}

const REFERENCE_DOCS = [
  { label: "Staff Handbook", path: "reference-docs/staff-handbook.pdf" },
  { label: "SIL Voyager Staff Manual", path: "reference-docs/sil-voyager-staff-manual.pdf" },
] as const;

export default async function StaffPortalPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  const record = await validateToken(token, {
    lookupToken: (t) =>
      supabase
        .from("onboarding_tokens")
        .select("*")
        .eq("id", t)
        .is("revoked_at", null)
        .maybeSingle()
        .then((res) => ({ data: res.data, error: res.error })),
    getRecord: (recordId) =>
      supabase
        .from("onboarding_records")
        .select("*")
        .eq("id", recordId)
        .maybeSingle()
        .then((res) => ({ data: res.data, error: res.error })),
  });

  if (!record) {
    return <TokenErrorPage />;
  }

  const items = getStaffFacingItems(record);

  const signedUrls = await Promise.all(
    REFERENCE_DOCS.map(async (doc) => {
      const { data } = await supabase.storage
        .from("staff-docs")
        .createSignedUrl(doc.path, 300);
      return { label: doc.label, url: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, {record.staff_name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your onboarding checklist — complete each item to finalise your start at Lifeheart.
          </p>
        </header>

        <section aria-labelledby="checklist-heading">
          <h2
            id="checklist-heading"
            className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3"
          >
            Checklist
          </h2>
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden">
            {items.map((item) => (
              <li
                key={item.key}
                className="px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-800">{item.label}</span>
                  <StatusBadge status={item.status} />
                </div>
                {item.key === "ndiswsc_status" && (
                  <NdisWscUploadPanel recordId={record.id} currentStatus={item.status} />
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="docs-heading">
          <h2
            id="docs-heading"
            className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3"
          >
            Reference Documents
          </h2>
          <ul className="space-y-2">
            {signedUrls.map(({ label, url }) => (
              <li key={label}>
                {url ? (
                  <a
                    href={url}
                    download
                    className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <DownloadIcon />
                    {label}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-200 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                    <DownloadIcon />
                    {label} (unavailable)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function TokenErrorPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl" aria-hidden="true">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900">
          This link is no longer valid
        </h1>
        <p className="text-sm text-gray-500">
          Your onboarding link may have expired or been revoked. Please contact
          your onboarding officer for a new link.
        </p>
      </div>
    </main>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
      />
    </svg>
  );
}
