// src/components/ui/Dropdown.tsx
import { ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface DropdownItem {
  label: ReactNode;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export const Dropdown = ({ trigger, items, align = "right", className }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-2 min-w-[160px] sm:min-w-[180px] py-1.5 bg-white dark:bg-[#151822] rounded-xl sm:rounded-2xl shadow-card-hover border border-gray-100 dark:border-gray-800 origin-top animate-modal-in",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm text-left transition-colors focus-visible:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-white/5",
                item.danger
                  ? "text-danger hover:bg-red-50 dark:hover:bg-red-500/10"
                  : "text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/5",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
