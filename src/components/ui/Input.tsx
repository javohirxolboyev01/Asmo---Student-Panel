// src/components/ui/Input.tsx
import { InputHTMLAttributes, ReactNode, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  uiSize?: "md" | "lg";
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, leftIcon, rightSlot, uiSize = "md", className, containerClassName, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13.5px] font-bold text-u-mu mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-[15px] top-1/2 -translate-y-1/2 text-u-mu pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-[14px] border-2 outline-none transition-[border-color,box-shadow] text-base font-medium",
              "u-field",
              error && "is-error",
              uiSize === "lg" ? "py-3.5" : "py-[11px]",
              leftIcon ? "pl-[46px] pr-4" : "px-4",
              rightSlot && "pr-10",
              className,
            )}
            {...props}
          />
          {rightSlot && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>}
        </div>
        {error && <p className="mt-1.5 text-[13px] font-bold text-u-er">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
