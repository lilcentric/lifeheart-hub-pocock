import { createServiceClient } from "@/lib/supabase/service";
import { resolveStaffToken } from "@/lib/token-service";
import { getPortalItems } from "@/utils/portal-items";
import type { AnyPortalItem, SignPortalItem, UploadPortalItem, MultiUploadPortalItem } from "@/utils/portal-items";
import type { StaffDetail } from "@/lib/types";
import StatusBadge from "@/components/onboarding/StatusBadge";
import StaffDetailsForm from "@/components/onboarding/StaffDetailsForm";
import WwccPanel from "@/components/onboarding/WwccPanel";
import NdisWscUploadPanel from "@/components/onboarding/NdisWscUploadPanel";
import ComplianceUploadPanel from "@/components/onboarding/ComplianceUploadPanel";
import MultiFileUpload from "@/components/onboarding/MultiFileUpload";
import PortalSubmitButton from "@/components/onboarding/PortalSubmitButton";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function StaffPortalPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  const record = await resolveStaffToken(token);

  if (!record) {
    return <TokenErrorPage />;
  }

  const items = getPortalItems(record, token);

  const { data: rawDetail } = await supabase
    .from("staff_details")
    .select("*")
    .eq("record_id", record.id)
    .maybeSingle();
  const staffDetail = rawDetail as StaffDetail | null;

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
              <li key={item.key} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-800">{item.label}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {renderItemAction(item)}
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                {renderItemPanel(item, record.id, token, staffDetail)}
              </li>
            ))}
          </ul>
        </section>

        <PortalSubmitButton token={token} />
      </div>
    </main>
  );
}

function renderItemAction(item: AnyPortalItem) {
  if (item.kind === "form") {
    return null;
  }

  if (item.kind === "sign") {
    const signItem = item as SignPortalItem;
    if (signItem.status === "completed") return null;
    if (!signItem.signingUrl) {
      return (
        <span className="text-xs text-gray-400 italic">Awaiting link</span>
      );
    }
    return (
      <a
        href={signItem.signingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 font-medium hover:text-blue-700 whitespace-nowrap"
      >
        Sign Document →
      </a>
    );
  }

  return null;
}

function renderItemPanel(
  item: AnyPortalItem,
  recordId: string,
  token: string,
  staffDetail: StaffDetail | null
) {
  if (item.status === "completed") return null;

  if (item.kind === "form") {
    return (
      <div className="mt-3">
        <StaffDetailsForm token={token} existing={staffDetail} />
      </div>
    );
  }

  if (item.kind === "upload") {
    const uploadItem = item as UploadPortalItem;

    if (uploadItem.uploadVariant === "wwcc") {
      return (
        <WwccPanel
          recordId={recordId}
          currentStatus={uploadItem.status}
          howToGetItUrl={uploadItem.howToGetItUrl!}
        />
      );
    }

    if (uploadItem.uploadVariant === "ndiswsc") {
      return (
        <NdisWscUploadPanel
          recordId={recordId}
          currentStatus={uploadItem.status}
          howToGetItUrl={uploadItem.howToGetItUrl!}
        />
      );
    }

    if (uploadItem.documentType) {
      return (
        <ComplianceUploadPanel
          recordId={recordId}
          documentType={uploadItem.documentType}
          currentStatus={uploadItem.status}
        />
      );
    }
  }

  if (item.kind === "multi-upload") {
    const multiItem = item as MultiUploadPortalItem;
    return (
      <div className="mt-3">
        <MultiFileUpload
          token={token}
          documentType={multiItem.documentType}
          label={multiItem.label}
        />
      </div>
    );
  }

  return null;
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
