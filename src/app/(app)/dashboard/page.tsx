import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatsCards from "@/components/onboarding/StatsCards";
import { deriveOverallStatus } from "@/utils/status-utils";
import type { OnboardingRecord } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawRecords } = await supabase
    .from("onboarding_records")
    .select("*")
    .is("archived_at", null);

  const all = (rawRecords ?? []) as OnboardingRecord[];

  // Total actively in onboarding
  const totalInOnboarding = all.filter(
    (r) => deriveOverallStatus(r) === "In Progress"
  ).length;

  // Completed this calendar month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = all.filter((r) => {
    if (deriveOverallStatus(r) !== "Completed") return false;
    return new Date(r.updated_at) >= startOfMonth;
  }).length;

  // Pending NDIS screening (compliance priority)
  const pendingScreening = all.filter(
    (r) =>
      r.ndiswsc_status !== "completed" &&
      r.ndiswsc_status !== "na"
  ).length;

  // Average days to complete onboarding (completed records only)
  const completedRecords = all.filter(
    (r) =>
      deriveOverallStatus(r) === "Completed" && r.date_onboarding_began
  );
  const avgDays =
    completedRecords.length === 0
      ? null
      : Math.round(
          completedRecords.reduce((sum, r) => {
            const start = new Date(r.date_onboarding_began!).getTime();
            const end = new Date(r.updated_at).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
          }, 0) / completedRecords.length
        );

  const cards = [
    {
      label: "In Onboarding",
      value: totalInOnboarding,
      description: "Staff with incomplete checklists",
    },
    {
      label: "Completed This Month",
      value: completedThisMonth,
      description: `Month of ${now.toLocaleString("en-AU", { month: "long" })}`,
    },
    {
      label: "Pending Screening",
      value: pendingScreening,
      description: "NDIS compliance priority",
      highlight: pendingScreening > 0,
    },
    {
      label: "Avg. Days to Complete",
      value: avgDays !== null ? `${avgDays}d` : "—",
      description: "From onboarding began",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Onboarding at a glance
        </p>
      </div>
      <StatsCards cards={cards} />
    </div>
  );
}
