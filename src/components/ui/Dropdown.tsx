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
            "absolute z-30 mt-2 min-w-[160px] sm:min-w-[180px] u-pop p-1.5 rounded-2xl origin-top animate-pop-in",
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
                "w-full flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl text-sm font-semibold text-left transition-colors focus-visible:outline-none focus-visible:bg-u-sf2",
                item.danger
                  ? "text-u-er hover:bg-u-ert"
                  : "text-u-tx hover:bg-u-sf2",
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
