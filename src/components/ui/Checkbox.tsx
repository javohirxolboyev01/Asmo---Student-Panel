// src/components/ui/Checkbox.tsx
import { InputHTMLAttributes, forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    return (
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2 cursor-pointer select-none">
        <span className="relative inline-flex items-center justify-center w-5 h-5 flex-shrink-0">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              "peer appearance-none w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-white/5 checked:bg-warning checked:border-warning transition-colors cursor-pointer",
              className,
            )}
            {...props}
          />
          <Check className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100" />
        </span>
        {label && <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
