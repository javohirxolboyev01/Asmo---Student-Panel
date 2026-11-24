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

// Warm capsules (classes in css/index.css): terracotta gradient primary,
// white outlined secondary, brick-red danger, soft accent ghost.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "u-b-primary",
  outline: "u-b-outline",
  danger: "u-b-danger",
  ghost: "u-b-ghost",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-[14.5px] px-4 py-1.5 gap-1.5 min-h-[40px]",
  md: "text-[16px] px-5 py-2.5 gap-2 min-h-[46px]",
  lg: "text-[16.5px] px-6 py-3 gap-2 min-h-[52px]",
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
        "u-b inline-flex items-center justify-center whitespace-nowrap rounded-full font-extrabold",
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
