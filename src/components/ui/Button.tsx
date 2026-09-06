// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-warning to-[#D97706] text-white shadow-sm hover:shadow-lg hover:shadow-warning/30 hover:scale-[1.02]",
  outline:
    "border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-warning hover:text-warning bg-transparent",
  danger: "bg-danger text-white hover:bg-red-600 shadow-sm",
  ghost:
    "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-warning",
};

// Mobile-first: compact and thumb-friendly on small screens, growing at each
// breakpoint so buttons don't look undersized on larger screens.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1 rounded-lg sm:px-3 sm:py-1.5 sm:gap-1.5 sm:rounded-xl md:text-sm",
  md: "text-xs px-4 py-2 gap-1.5 rounded-xl sm:text-sm sm:px-5 sm:py-2.5 md:px-6 md:py-3 md:gap-2 md:rounded-2xl",
  lg: "text-sm px-5 py-2.5 gap-1.5 rounded-xl sm:px-6 sm:py-3 sm:gap-2 md:py-3.5 md:rounded-2xl lg:px-7",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  ),
);
Button.displayName = "Button";
