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
  sm: "p-1.5 md:p-2",
  md: "p-2 md:p-2.5",
  lg: "p-2.5 md:p-3",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "default", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/40",
        variant === "danger" ? "hover:text-danger" : "hover:text-warning",
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
