// src/components/Common/StatusBadge.tsx
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const statusMap: Record<string, string> = {
  present: "badge-present",
  absent: "badge-absent",
  submitted: "badge-submitted",
  not_submitted: "badge-not_submitted",
  pending: "badge-pending",
  graded: "badge-graded",
};

export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const { t } = useTranslation();
  const colorClass = statusMap[status] || "badge-pending";
  const displayLabel = label || t(`status.${status}`);

  return (
    <span className={cn("badge", colorClass, className)}>{displayLabel}</span>
  );
};
