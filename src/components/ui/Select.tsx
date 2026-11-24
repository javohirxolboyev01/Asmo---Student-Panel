// src/components/ui/Select.tsx
// Custom-styled dropdown — not a native <select>, since native option-list
// popups are rendered by the OS/browser and can't be recolored to match the
// app's brand (see the blue native highlight this replaces). Same external
// API as a native select (value/onChange/<option> children) so every call
// site across the app keeps working unchanged.
import {
  Children,
  ChangeEvent,
  SelectHTMLAttributes,
  forwardRef,
  isValidElement,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

interface OptionData {
  value: string;
  label: React.ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ label, error, className, containerClassName, id, children, value, onChange, disabled, name }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, () => setIsOpen(false), isOpen);

    const options = useMemo<OptionData[]>(() => {
      const list: OptionData[] = [];
      Children.forEach(children, (child) => {
        if (!isValidElement(child) || child.type !== "option") return;
        const props = child.props as { value?: string | number; children?: React.ReactNode };
        list.push({ value: String(props.value ?? ""), label: props.children });
      });
      return list;
    }, [children]);

    const selected = options.find((o) => o.value === String(value ?? ""));

    const handleSelect = (optValue: string) => {
      setIsOpen(false);
      onChange?.({ target: { value: optValue, name } } as unknown as ChangeEvent<HTMLSelectElement>);
    };

    return (
      <div className={cn("w-full", containerClassName)} ref={containerRef}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[14px] font-bold text-u-tx mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <button
            ref={ref}
            type="button"
            id={selectId}
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={cn(
              "w-full flex items-center justify-between appearance-none rounded-[16px] outline-none text-[16px] font-medium text-left px-4 py-3 min-h-[48px] pr-10",
              "u-field",
              disabled && "opacity-50 cursor-not-allowed",
              error && "is-error",
              className,
            )}
          >
            <span className="truncate">{selected?.label}</span>
          </button>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-u-mu absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />

          {isOpen && (
            <div
              role="listbox"
              className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto u-pop p-1.5 rounded-2xl origin-top animate-pop-in"
            >
              {options.map((opt) => {
                const isSelected = opt.value === String(value ?? "");
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={cn("w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-[15px] font-semibold text-left transition-colors hover:bg-u-sf2", isSelected && "bg-u-prt text-u-pr hover:bg-u-prt")}
                  >
                    <Check className={cn("w-4 h-4 flex-shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-[13px] font-bold text-u-er">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
