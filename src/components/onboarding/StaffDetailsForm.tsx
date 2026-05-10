"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { StaffDetail } from "@/lib/types";
import { submitStaffDetails } from "@/app/actions/staff-details";

const CITIZENSHIP_OPTIONS = [
  { value: "australian_citizen", label: "Australian Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "visa_holder", label: "Visa Holder" },
  { value: "other", label: "Other" },
] as const;

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  preferred_name: z.string().optional(),
  personal_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  citizenship_status: z.string().min(1, "Please select a citizenship / visa status"),
  visa_type: z.string().optional(),
  visa_expiry_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  token: string;
  existing?: StaffDetail | null;
}

export default function StaffDetailsForm({ token, existing }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const existingFullName = existing
    ? [existing.first_name, existing.last_name].filter(Boolean).join(" ")
    : "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: existingFullName,
      preferred_name: existing?.preferred_name ?? "",
      personal_email: existing?.personal_email ?? "",
      phone: existing?.phone ?? "",
      emergency_contact_name: existing?.emergency_contact_name ?? "",
      emergency_contact_relationship: existing?.emergency_contact_relationship ?? "",
      emergency_contact_phone: existing?.emergency_contact_phone ?? "",
      citizenship_status: existing?.right_to_work ?? "",
      visa_type: existing?.visa_type ?? "",
      visa_expiry_date: existing?.visa_expiry_date ?? "",
    },
  });

  const citizenshipStatus = watch("citizenship_status");
  const showVisaFields = citizenshipStatus === "visa_holder";

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await submitStaffDetails(token, {
      ...values,
      personal_email: values.personal_email || undefined,
      preferred_name: values.preferred_name || undefined,
      phone: values.phone || undefined,
      emergency_contact_name: values.emergency_contact_name || undefined,
      emergency_contact_relationship: values.emergency_contact_relationship || undefined,
      emergency_contact_phone: values.emergency_contact_phone || undefined,
      visa_type: showVisaFields ? values.visa_type || undefined : undefined,
      visa_expiry_date: showVisaFields ? values.visa_expiry_date || undefined : undefined,
    });
    if ("error" in result) {
      setServerError(result.error);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-center">
        <p className="text-sm font-medium text-green-800">
          Your details have been saved. Thank you!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("full_name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {errors.full_name && (
              <p className="text-xs text-red-600 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred name
            </label>
            <input
              {...register("preferred_name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal email
            </label>
            <input
              type="email"
              {...register("personal_email")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {errors.personal_email && (
              <p className="text-xs text-red-600 mt-1">{errors.personal_email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              {...register("phone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </section>

      {/* Emergency contact */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Emergency contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              {...register("emergency_contact_name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <input
              {...register("emergency_contact_relationship")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              {...register("emergency_contact_phone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </section>

      {/* Right to work */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Right to work</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Citizenship / visa status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("citizenship_status")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Select…</option>
              {CITIZENSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {errors.citizenship_status && (
              <p className="text-xs text-red-600 mt-1">
                {errors.citizenship_status.message}
              </p>
            )}
          </div>

          {showVisaFields && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visa type
                </label>
                <input
                  {...register("visa_type")}
                  placeholder="e.g. Subclass 482"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visa expiry date
                </label>
                <input
                  type="date"
                  {...register("visa_expiry_date")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Saving…" : existing ? "Update details" : "Submit details"}
      </button>
    </form>
  );
}
