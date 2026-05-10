import type { StaffDetail } from "@/lib/types";

const CITIZENSHIP_LABELS: Record<string, string> = {
  australian_citizen: "Australian Citizen",
  permanent_resident: "Permanent Resident",
  visa_holder: "Visa Holder",
  other: "Other",
};

interface Props {
  detail: StaffDetail | null;
}

export default function StaffDetailsPanel({ detail }: Props) {
  if (!detail) {
    return (
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Staff Details
        </h2>
        <p className="text-sm text-gray-400 italic">
          Not yet submitted by staff member.
        </p>
      </section>
    );
  }

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Full name", value: [detail.first_name, detail.last_name].filter(Boolean).join(" ") },
    { label: "Preferred name", value: detail.preferred_name },
    { label: "Personal email", value: detail.personal_email },
    { label: "Phone", value: detail.phone },
    { label: "Emergency contact", value: detail.emergency_contact_name },
    { label: "Relationship", value: detail.emergency_contact_relationship },
    { label: "Emergency phone", value: detail.emergency_contact_phone },
    {
      label: "Citizenship / visa status",
      value: detail.right_to_work
        ? (CITIZENSHIP_LABELS[detail.right_to_work] ?? detail.right_to_work)
        : null,
    },
    { label: "Visa type", value: detail.visa_type },
    { label: "Visa expiry", value: detail.visa_expiry_date },
  ];

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Staff Details</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(({ label, value }) =>
          value ? (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm text-gray-900 mt-0.5">{value}</dd>
            </div>
          ) : null
        )}
      </dl>
      <p className="text-xs text-gray-400 mt-4">
        Submitted{" "}
        {new Date(detail.created_at).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </section>
  );
}
