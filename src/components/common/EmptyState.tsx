// src/components/Common/EmptyState.tsx
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-[84px] h-[84px] bg-u-sf2 rounded-full flex items-center justify-center mb-3.5">
        <Icon className="w-7 h-7 text-u-mu" strokeWidth={2} />
      </div>
      <h3 className="font-fd text-[17px] font-semibold text-u-tx mb-1">{title}</h3>
      <p className="text-u-mu max-w-sm">{description}</p>
    </div>
  );
};
