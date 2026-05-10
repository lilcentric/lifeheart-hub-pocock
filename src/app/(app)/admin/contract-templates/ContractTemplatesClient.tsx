"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { newTemplateSchema } from "@/lib/contract-templates";
import type { ContractTemplate, EmploymentType } from "@/lib/types";

type FormValues = z.infer<typeof newTemplateSchema>;

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "permanent", label: "Permanent" },
  { value: "casual", label: "Casual" },
];

interface Props {
  templates: ContractTemplate[];
}

export default function ContractTemplatesClient({ templates: initial }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(newTemplateSchema),
    defaultValues: { employment_type: "permanent" },
  });

  const permanent = templates.filter((t) => t.employment_type === "permanent");
  const casual = templates.filter((t) => t.employment_type === "casual");

  async function onSubmit(values: FormValues) {
    setError(null);
    const supabase = createClient();
    const { data, error: sbError } = await supabase
      .from("contract_templates")
      .insert(values)
      .select()
      .single();
    if (sbError) {
      setError(sbError.message);
      return;
    }
    setTemplates((prev) => [data as ContractTemplate, ...prev]);
    reset();
    router.refresh();
  }

  async function onArchive(id: string) {
    setError(null);
    const supabase = createClient();
    const { error: sbError } = await supabase
      .from("contract_templates")
      .update({ archived: true })
      .eq("id", id);
    if (sbError) {
      setError(sbError.message);
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
          {error}
        </p>
      )}

      {/* Template list */}
      {[
        { label: "Permanent", items: permanent },
        { label: "Casual", items: casual },
      ].map(({ label, items }) => (
        <section key={label}>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{label}</h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400">No active {label.toLowerCase()} templates.</p>
          ) : (
            <div className="border border-gray-200 rounded-md divide-y divide-gray-100">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      v{t.version} · {t.annature_template_id}
                    </p>
                  </div>
                  <button
                    onClick={() => onArchive(t.id)}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Retire
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Add template form */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Add template
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border border-gray-200 rounded-md p-4 space-y-4 max-w-lg"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                {...register("name")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. Permanent Full-Time Contract v3"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Employment type
              </label>
              <select
                {...register("employment_type")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {EMPLOYMENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                {...register("version")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. 3.0"
              />
              {errors.version && (
                <p className="text-xs text-red-600 mt-1">{errors.version.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Annature template ID
              </label>
              <input
                {...register("annature_template_id")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. ann_perm_ft_v3"
              />
              {errors.annature_template_id && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.annature_template_id.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Adding…" : "Add template"}
          </button>
        </form>
      </section>
    </div>
  );
}
