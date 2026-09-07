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
            className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
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
              "w-full flex items-center justify-between appearance-none bg-gray-50 dark:bg-white/5 rounded-xl border outline-none transition-all text-sm text-left text-gray-800 dark:text-gray-100 px-3.5 py-2 pr-9 sm:px-4 sm:py-2.5 sm:pr-10 md:rounded-2xl",
              "border-gray-200 dark:border-gray-700 focus:border-warning focus:ring-2 focus:ring-warning/20",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
              className,
            )}
          >
            <span className="truncate">{selected?.label}</span>
          </button>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />

          {isOpen && (
            <div
              role="listbox"
              className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto py-1.5 bg-white dark:bg-[#151822] rounded-xl shadow-card-hover border border-gray-100 dark:border-gray-800 origin-top animate-modal-in"
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
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left text-gray-800 dark:text-gray-100 transition-colors hover:bg-warning hover:text-white"
                  >
                    <Check className={cn("w-4 h-4 flex-shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
