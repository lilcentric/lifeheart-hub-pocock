interface DocumentLink {
  filename: string | null;
  storagePath: string;
  signedUrl: string | null;
  uploadedAt: string;
}

interface DocumentGroup {
  label: string;
  type: string;
  documents: DocumentLink[];
}

interface Props {
  groups: DocumentGroup[];
}

export default function UploadedDocumentsPanel({ groups }: Props) {
  const hasAny = groups.some((g) => g.documents.length > 0);
  if (!hasAny) return null;

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-900">Uploaded Documents</h2>

      {groups.map((group) =>
        group.documents.length > 0 ? (
          <div key={group.type}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {group.label}
            </h3>
            <ul className="space-y-1">
              {group.documents.map((doc, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {doc.signedUrl ? (
                    <a
                      href={doc.signedUrl}
                      download={doc.filename ?? undefined}
                      className="flex items-center gap-1.5 text-blue-600 hover:underline"
                    >
                      <DownloadIcon />
                      {doc.filename ?? doc.storagePath.split("/").pop()}
                    </a>
                  ) : (
                    <span className="text-gray-400">
                      {doc.filename ?? doc.storagePath.split("/").pop()} (unavailable)
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-AU")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
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
