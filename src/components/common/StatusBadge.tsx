// src/components/Common/StatusBadge.tsx
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const statusMap: Record<string, string> = {
  present: "badge-present",
  absent: "badge-absent",
  late: "badge-late",
  excused: "badge-excused",
  submitted: "badge-submitted",
  not_submitted: "badge-not_submitted",
  pending: "badge-pending",
  graded: "badge-graded",
};

export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const colorClass = statusMap[status] || "badge-pending";
  const displayLabel =
    label ||
    status.replace("_", " ").charAt(0).toUpperCase() +
      status.replace("_", " ").slice(1);

  return (
    <span className={cn("badge", colorClass, className)}>{displayLabel}</span>
  );
};
