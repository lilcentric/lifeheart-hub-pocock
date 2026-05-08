"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  DOCUMENT_STATUSES,
  GENERAL_STATUSES,
  DOCUMENT_FIELDS,
} from "@/utils/status-utils";
import type { OnboardingRecord, OnboardingStatus, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusEnum = z.enum([
  "completed",
  "not_completed",
  "not_received",
  "not_signed",
  "in_progress",
  "pending_verification",
  "na",
]);

const schema = z.object({
  staff_name: z.string().min(1, "Required"),
  onboarding_officer: z.string().uuid("Required"),
  date_onboarding_began: z.string().optional(),
  date_shift_began: z.string().optional(),

  job_application_status: statusEnum,
  interview_status: statusEnum,
  reference_checks_status: statusEnum,
  cv_status: statusEnum,

  position_description_status: statusEnum,
  employment_contract_status: statusEnum,
  code_of_conduct_status: statusEnum,
  employee_details_form_status: statusEnum,
  id_verification_status: statusEnum,
  relevant_insurance_status: statusEnum,
  conflict_of_interest_status: statusEnum,

  screening_checks_status: statusEnum,
  training_status: statusEnum,
  orientation_induction_status: statusEnum,
  training_needs_status: statusEnum,
  uniforms_status: statusEnum,
});

type FormValues = z.infer<typeof schema>;

type StatusFieldKey = keyof Pick<
  FormValues,
  | "job_application_status"
  | "interview_status"
  | "reference_checks_status"
  | "cv_status"
  | "position_description_status"
  | "employment_contract_status"
  | "code_of_conduct_status"
  | "employee_details_form_status"
  | "id_verification_status"
  | "relevant_insurance_status"
  | "conflict_of_interest_status"
  | "screening_checks_status"
  | "training_status"
  | "orientation_induction_status"
  | "training_needs_status"
  | "uniforms_status"
>;

const LEGACY_FIELDS = new Set<StatusFieldKey>([
  "cv_status",
  "training_needs_status",
  "uniforms_status",
]);

type FieldGroup = {
  label: string;
  fields: { key: StatusFieldKey; label: string }[];
};

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Recruitment",
    fields: [
      { key: "job_application_status", label: "Job Application" },
      { key: "interview_status", label: "Interview" },
      { key: "reference_checks_status", label: "Reference Checks" },
      { key: "cv_status", label: "CV (legacy)" },
    ],
  },
  {
    label: "Documentation",
    fields: [
      { key: "position_description_status", label: "Position Description" },
      { key: "employment_contract_status", label: "Employment Contract" },
      { key: "code_of_conduct_status", label: "Code of Conduct" },
      { key: "employee_details_form_status", label: "Employee Details Form" },
      { key: "id_verification_status", label: "ID Verification" },
      { key: "relevant_insurance_status", label: "Relevant Insurance" },
      { key: "conflict_of_interest_status", label: "Conflict of Interest" },
    ],
  },
  {
    label: "Compliance",
    fields: [{ key: "screening_checks_status", label: "Screening Checks" }],
  },
  {
    label: "Training & Induction",
    fields: [
      { key: "training_status", label: "Training" },
      { key: "orientation_induction_status", label: "Orientation / Induction" },
      { key: "training_needs_status", label: "Training Needs (legacy)" },
    ],
  },
  {
    label: "Admin",
    fields: [{ key: "uniforms_status", label: "Uniforms (legacy)" }],
  },
];

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  completed: "Completed",
  not_completed: "Not Completed",
  not_received: "Not Received",
  not_signed: "Not Signed",
  in_progress: "In Progress",
  pending_verification: "Pending Verification",
  na: "N/A",
};

const DEFAULT_VALUES: FormValues = {
  staff_name: "",
  onboarding_officer: "",
  date_onboarding_began: "",
  date_shift_began: "",
  job_application_status: "not_completed",
  interview_status: "not_completed",
  reference_checks_status: "not_completed",
  cv_status: "not_completed",
  position_description_status: "not_completed",
  employment_contract_status: "not_completed",
  code_of_conduct_status: "not_completed",
  employee_details_form_status: "not_completed",
  id_verification_status: "not_completed",
  relevant_insurance_status: "not_completed",
  conflict_of_interest_status: "not_completed",
  screening_checks_status: "not_completed",
  training_status: "not_completed",
  orientation_induction_status: "not_completed",
  training_needs_status: "not_completed",
  uniforms_status: "not_completed",
};

interface Props {
  record?: OnboardingRecord;
  officers: Pick<Profile, "id" | "full_name">[];
  currentUserRole: string;
}

export default function OnboardingForm({
  record,
  officers,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!record;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: record
      ? {
          staff_name: record.staff_name,
          onboarding_officer: record.onboarding_officer,
          date_onboarding_began: record.date_onboarding_began ?? "",
          date_shift_began: record.date_shift_began ?? "",
          job_application_status: record.job_application_status,
          interview_status: record.interview_status,
          reference_checks_status: record.reference_checks_status,
          cv_status: record.cv_status,
          position_description_status: record.position_description_status,
          employment_contract_status: record.employment_contract_status,
          code_of_conduct_status: record.code_of_conduct_status,
          employee_details_form_status: record.employee_details_form_status,
          id_verification_status: record.id_verification_status,
          relevant_insurance_status: record.relevant_insurance_status,
          conflict_of_interest_status: record.conflict_of_interest_status,
          screening_checks_status: record.screening_checks_status,
          training_status: record.training_status,
          orientation_induction_status: record.orientation_induction_status,
          training_needs_status: record.training_needs_status,
          uniforms_status: record.uniforms_status,
        }
      : DEFAULT_VALUES,
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();

    const payload = {
      ...values,
      date_onboarding_began: values.date_onboarding_began || null,
      date_shift_began: values.date_shift_began || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("onboarding_records")
        .update(payload)
        .eq("id", record!.id);
      if (error) { setServerError(error.message); return; }
    } else {
      const { error } = await supabase
        .from("onboarding_records")
        .insert(payload);
      if (error) { setServerError(error.message); return; }
    }

    router.push("/onboarding");
    router.refresh();
  }

  const isDocField = (key: StatusFieldKey) =>
    DOCUMENT_FIELDS.includes(key as keyof OnboardingRecord);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      {/* Core fields */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Name
            </label>
            <input
              {...register("staff_name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {errors.staff_name && (
              <p className="text-xs text-red-600 mt-1">
                {errors.staff_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onboarding Officer
            </label>
            <select
              {...register("onboarding_officer")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={
                currentUserRole === "officer" && isEdit
              }
            >
              <option value="">Select officer…</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name}
                </option>
              ))}
            </select>
            {errors.onboarding_officer && (
              <p className="text-xs text-red-600 mt-1">
                {errors.onboarding_officer.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Onboarding Began
            </label>
            <input
              type="date"
              {...register("date_onboarding_began")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Shift Began
            </label>
            <input
              type="date"
              {...register("date_shift_began")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </section>

      {/* Status field groups */}
      {FIELD_GROUPS.map((group) => (
        <section
          key={group.label}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-gray-900">{group.label}</h2>
          <div className="grid grid-cols-2 gap-4">
            {group.fields.map(({ key, label }) => {
              const isLegacy = LEGACY_FIELDS.has(key);
              const options = isDocField(key)
                ? DOCUMENT_STATUSES
                : GENERAL_STATUSES;
              return (
                <div key={key} className={cn(isLegacy && "opacity-50")}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <Controller
                    name={key}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        {options.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting
            ? "Saving…"
            : isEdit
            ? "Save changes"
            : "Create record"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
