// src/components/ui/Select.tsx
import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, containerClassName, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none bg-ink text-white rounded-xl border outline-none transition-all text-sm px-3.5 py-2 pr-9 sm:px-4 sm:py-2.5 sm:pr-10 md:rounded-2xl",
              "border-transparent focus:border-primary-400 focus:ring-2 focus:ring-primary-500/30",
              "[&>option]:bg-card [&>option]:text-gray-800 dark:[&>option]:bg-card-dark dark:[&>option]:text-gray-100",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="w-4 h-4 text-white/70 absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
