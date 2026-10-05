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
  primary:
    "bg-[linear-gradient(135deg,rgb(var(--u-prf)),rgb(var(--u-prf2)))] text-white shadow-[0_8px_18px_-8px_rgb(var(--u-prf))] hover:brightness-[1.06]",
  outline:
    "bg-transparent text-u-tx shadow-[inset_0_0_0_2px_rgb(var(--u-fieldln))] hover:shadow-[inset_0_0_0_2px_rgb(var(--u-pr))]",
  danger: "bg-[rgb(var(--u-erf))] text-white shadow-[0_8px_18px_-8px_rgb(var(--u-erf))] hover:brightness-[1.06]",
  ghost: "bg-u-prt text-u-pr hover:brightness-[1.08]",
};

// Mobile-first: compact and thumb-friendly on small screens, growing at each
// breakpoint so buttons don't look undersized on larger screens.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-sm px-3.5 py-2 gap-1.5 rounded-xl",
  md: "text-[15px] px-5 py-3 gap-2 rounded-[14px]",
  lg: "text-base px-5 py-[15px] gap-2 rounded-[14px]",
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
        "inline-flex items-center justify-center whitespace-nowrap font-bold transition-[transform,box-shadow] active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100",
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
