import { getStatusMeta } from "@/utils/status-utils";
import type { OnboardingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  status: OnboardingStatus;
  legacy?: boolean;
}

export default function StatusBadge({ status, legacy = false }: Props) {
  const { label, className } = getStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap",
        className,
        legacy && "opacity-40"
      )}
    >
      {label}
    </span>
  );
}
