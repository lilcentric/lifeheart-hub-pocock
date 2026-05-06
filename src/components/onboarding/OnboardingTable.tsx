"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import StatusBadge from "./StatusBadge";
import { deriveOverallStatus } from "@/utils/status-utils";
import type { OnboardingRecord, OnboardingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type RecordRow = OnboardingRecord & {
  officer_profile: { id: string; full_name: string } | null;
};

interface Props {
  records: RecordRow[];
  canWrite: boolean;
  currentUserId: string;
  currentUserRole: string;
}

// Columns visible but dimmed (legacy — pending lean workflow removal)
const LEGACY_FIELDS = new Set<keyof OnboardingRecord>([
  "cv_status",
  "training_needs_status",
  "uniforms_status",
]);

type ColumnGroup = {
  label: string;
  columns: { key: keyof OnboardingRecord; label: string }[];
};

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    label: "Recruitment",
    columns: [
      { key: "job_application_status", label: "Job Application" },
      { key: "interview_status", label: "Interview" },
      { key: "reference_checks_status", label: "References" },
      { key: "cv_status", label: "CV" },
    ],
  },
  {
    label: "Documentation",
    columns: [
      { key: "position_description_status", label: "Position Description" },
      { key: "employment_contract_status", label: "Contract" },
      { key: "code_of_conduct_status", label: "Code of Conduct" },
      { key: "employee_details_form_status", label: "Employee Details" },
      { key: "id_verification_status", label: "ID Verification" },
      { key: "relevant_insurance_status", label: "Insurance" },
      { key: "conflict_of_interest_status", label: "Conflict of Interest" },
    ],
  },
  {
    label: "Compliance",
    columns: [
      { key: "screening_checks_status", label: "Screening Checks" },
    ],
  },
  {
    label: "Training",
    columns: [
      { key: "training_status", label: "Training" },
      { key: "orientation_induction_status", label: "Orientation/Induction" },
      { key: "training_needs_status", label: "Training Needs" },
    ],
  },
  {
    label: "Admin",
    columns: [
      { key: "uniforms_status", label: "Uniforms" },
    ],
  },
];

export default function OnboardingTable({
  records,
  canWrite,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const allStatusColumns = useMemo(() =>
    COLUMN_GROUPS.flatMap((g) => g.columns),
    []
  );

  const columns = useMemo<ColumnDef<RecordRow>[]>(() => {
    const statusCols: ColumnDef<RecordRow>[] = allStatusColumns.map(
      ({ key, label }) => ({
        id: key,
        accessorKey: key,
        header: label,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue() as OnboardingStatus}
            legacy={LEGACY_FIELDS.has(key)}
          />
        ),
      })
    );

    return [
      {
        id: "id",
        accessorKey: "id",
        header: "ID",
        cell: ({ getValue, row }) =>
          canWrite ? (
            <Link
              href={`/onboarding/${row.original.id}`}
              className="font-mono text-xs text-blue-600 hover:underline"
            >
              {getValue() as string}
            </Link>
          ) : (
            <span className="font-mono text-xs">{getValue() as string}</span>
          ),
      },
      {
        id: "staff_name",
        accessorKey: "staff_name",
        header: "Staff Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-sm">{getValue() as string}</span>
        ),
      },
      {
        id: "officer",
        accessorKey: "officer_profile",
        header: "Officer",
        cell: ({ getValue }) => {
          const p = getValue() as { full_name: string } | null;
          return (
            <span className="text-sm text-gray-600">
              {p?.full_name ?? "—"}
            </span>
          );
        },
      },
      {
        id: "date_onboarding_began",
        accessorKey: "date_onboarding_began",
        header: "Onboarding Began",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return (
            <span className="text-sm text-gray-600">
              {v ? new Date(v).toLocaleDateString("en-AU") : "—"}
            </span>
          );
        },
      },
      {
        id: "date_shift_began",
        accessorKey: "date_shift_began",
        header: "Shift Began",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return (
            <span className="text-sm text-gray-600">
              {v ? new Date(v).toLocaleDateString("en-AU") : "—"}
            </span>
          );
        },
      },
      {
        id: "overall_status",
        header: "Overall",
        cell: ({ row }) => {
          const status = deriveOverallStatus(row.original);
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {status}
            </span>
          );
        },
      },
      ...statusCols,
    ];
  }, [allStatusColumns, canWrite]);

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search staff name, ID…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm w-72 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap",
                        header.column.getCanSort() &&
                          "cursor-pointer select-none hover:text-gray-900"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                        ? " ↓"
                        : ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-8 text-center text-sm text-gray-400"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2.5 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
