// src/components/ui/IconButton.tsx
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type IconButtonVariant = "default" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "w-9 h-9",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "default", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "danger"
          ? "bg-u-ert text-u-er hover:bg-[rgb(var(--u-erf))] hover:text-white"
          : "bg-u-sf2 text-u-tx hover:bg-u-prt hover:text-u-pr",
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
