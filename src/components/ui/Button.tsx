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
  // Solid fills (--u-*f) keep white text readable in light and dark.
  // iOS button styles: filled (tint), gray (bordered), destructive, tinted.
  primary: "bg-[rgb(var(--u-prf))] text-white",
  outline: "bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] text-u-pr",
  danger: "bg-[rgb(var(--u-erf))] text-white",
  ghost: "bg-u-prt text-u-pr",
};

// Mobile-first: compact and thumb-friendly on small screens, growing at each
// breakpoint so buttons don't look undersized on larger screens.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  // iOS 26 capsule buttons.
  sm: "text-[15px] px-3.5 py-[7px] gap-1.5 rounded-full",
  md: "text-[17px] px-5 py-[11px] gap-2 rounded-full min-h-[44px]",
  lg: "text-[17px] px-5 py-[14px] gap-2 rounded-full min-h-[50px]",
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
        "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-opacity active:opacity-70 disabled:opacity-55 disabled:cursor-not-allowed disabled:active:opacity-55",
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
