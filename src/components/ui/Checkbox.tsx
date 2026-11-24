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
      <label htmlFor={checkboxId} className="inline-flex min-h-[44px] items-center gap-2.5 cursor-pointer select-none">
        <span className="relative inline-flex items-center justify-center w-[22px] h-[22px] flex-shrink-0">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              "u-field peer appearance-none w-[22px] h-[22px] rounded-[7px] transition-colors cursor-pointer",
              className,
            )}
            {...props}
          />
          <Check strokeWidth={3} className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100" />
        </span>
        {label && <span className="text-[15px] font-semibold text-u-tx">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
