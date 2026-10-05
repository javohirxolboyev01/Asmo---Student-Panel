// src/components/ui/Textarea.tsx
import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, containerClassName, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[13.5px] font-bold text-u-mu mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-4 py-3 rounded-[14px] border-2 outline-none transition-[border-color,box-shadow] text-base font-medium min-h-[100px]",
            "u-field",
            error && "is-error",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[13px] font-bold text-u-er">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
