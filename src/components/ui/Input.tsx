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
            className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-gray-50 dark:bg-white/5 rounded-xl border outline-none transition-all text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400",
              "border-gray-200 dark:border-gray-700 focus:border-warning focus:ring-2 focus:ring-warning/20",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
              uiSize === "lg" ? "py-3.5" : "py-2.5",
              leftIcon ? "pl-10 pr-4" : "px-4",
              rightSlot && "pr-10",
              className,
            )}
            {...props}
          />
          {rightSlot && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
