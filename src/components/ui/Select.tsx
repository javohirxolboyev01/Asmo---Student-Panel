// src/components/ui/Select.tsx
// Custom-styled dropdown — not a native <select>, since native option-list
// popups are rendered by the OS/browser and can't be recolored to match the
// app's brand. Same external API as a native select (value / onChange /
// <option> children, incl. `disabled` options) so every call site keeps working.
// The list opens in the shared Popover (never clipped by a sheet), works from
// the keyboard (↑ ↓ Home End Enter Esc, type to jump) and gets a search box
// when it's long.
import {
  Children,
  ChangeEvent,
  KeyboardEvent,
  SelectHTMLAttributes,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { FieldFrame, Popover } from "./Popover";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  containerClassName?: string;
  /** Show a search box; by default only for lists longer than 8. */
  searchable?: boolean;
}

interface OptionData {
  value: string;
  label: React.ReactNode;
  text: string;
  disabled: boolean;
}

const textOf = (node: React.ReactNode): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(textOf).join("")
      : isValidElement(node)
        ? textOf((node.props as { children?: React.ReactNode }).children)
        : "";

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      placeholder,
      className,
      containerClassName,
      id,
      children,
      value,
      onChange,
      disabled,
      name,
      searchable,
      required,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const listId = `${selectId}-list`;
    const button = useRef<HTMLButtonElement>(null);
    useImperativeHandle(ref, () => button.current!, []);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);
    const typed = useRef({ text: "", at: 0 });

    const options = useMemo<OptionData[]>(() => {
      const list: OptionData[] = [];
      Children.forEach(children, (child) => {
        if (!isValidElement(child) || child.type !== "option") return;
        const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
        list.push({
          value: String(props.value ?? ""),
          label: props.children,
          text: textOf(props.children),
          disabled: Boolean(props.disabled),
        });
      });
      return list;
    }, [children]);

    const current = String(value ?? "");
    const selected = options.find((o) => o.value === current);
    const withSearch = searchable ?? options.length > 8;
    const shown = useMemo(() => {
      const q = query.trim().toLowerCase();
      return q ? options.filter((o) => o.text.toLowerCase().includes(q)) : options;
    }, [options, query]);

    const close = useCallback(() => {
      setIsOpen(false);
      setQuery("");
    }, []);

    const open = () => {
      if (disabled) return;
      setIsOpen(true);
      setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    };

    const choose = (opt: OptionData | undefined) => {
      if (!opt || opt.disabled) return;
      close();
      button.current?.focus();
      if (opt.value !== current)
        onChange?.({ target: { value: opt.value, name } } as unknown as ChangeEvent<HTMLSelectElement>);
    };

    // Keep the highlighted option in view.
    useEffect(() => {
      if (!isOpen) return;
      listRef.current
        ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }, [active, isOpen, shown]);

    const step = (from: number, dir: 1 | -1) => {
      for (let i = 1; i <= shown.length; i++) {
        const next = (from + dir * i + shown.length) % shown.length;
        if (!shown[next].disabled) return next;
      }
      return from;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
          e.preventDefault();
          open();
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActive((a) => step(a, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActive((a) => step(a, -1));
          break;
        case "Home":
          e.preventDefault();
          setActive(step(-1, 1));
          break;
        case "End":
          e.preventDefault();
          setActive(step(shown.length, -1));
          break;
        case "Enter":
          e.preventDefault();
          choose(shown[active]);
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          close();
          button.current?.focus();
          break;
        case "Tab":
          close();
          break;
        default:
          // Type-ahead on the closed-search list: jump to the first match.
          if (!withSearch && e.key.length === 1) {
            const now = Date.now();
            typed.current = {
              text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(),
              at: now,
            };
            const hit = shown.findIndex((o) => !o.disabled && o.text.toLowerCase().startsWith(typed.current.text));
            if (hit >= 0) setActive(hit);
          }
      }
    };

    return (
      <FieldFrame label={label} htmlFor={selectId} error={error} hint={hint} className={containerClassName}>
        <button
          ref={button}
          type="button"
          id={selectId}
          name={name}
          disabled={disabled}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-label={ariaLabel}
          className={cn(
            "w-full flex items-center justify-between appearance-none rounded-[16px] outline-none text-[16px] font-medium text-left px-4 py-3 min-h-[48px] pr-10",
            "u-field",
            isOpen && "is-open",
            disabled && "opacity-50 cursor-not-allowed",
            error && "is-error",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-u-mu")}>{selected?.label ?? placeholder ?? "—"}</span>
        </button>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-u-mu absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />

        <Popover anchor={button} open={isOpen} onClose={close} maxHeight={320} className="animate-pop-in">
          {withSearch && (
            <div className="sticky top-0 z-10 -m-1.5 mb-1.5 p-1.5 bg-u-sf">
              <label className="u-field flex items-center gap-2 rounded-xl px-3 min-h-[42px]">
                <Search className="w-4 h-4 text-u-mu flex-none" aria-hidden="true" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder={t("picker.search")}
                  aria-label={t("picker.search")}
                  aria-controls={listId}
                  className="w-full bg-transparent outline-none text-[16px] font-medium text-u-tx placeholder:text-u-mu"
                />
              </label>
            </div>
          )}
          <div ref={listRef} id={listId} role="listbox" aria-labelledby={selectId}>
            {shown.length === 0 && (
              <p className="px-3 py-3 text-[14px] font-semibold text-u-mu">{t("picker.noResults")}</p>
            )}
            {shown.map((opt, i) => {
              const isSelected = opt.value === current;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  data-index={i}
                  tabIndex={-1}
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onClick={() => choose(opt)}
                  onMouseMove={() => !opt.disabled && active !== i && setActive(i)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-[15px] font-semibold text-left transition-colors",
                    i === active && !isSelected && "bg-u-sf2",
                    isSelected && "bg-u-prt text-u-pr",
                    opt.disabled && "opacity-45 cursor-not-allowed",
                  )}
                >
                  <Check className={cn("w-4 h-4 flex-shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </Popover>
      </FieldFrame>
    );
  },
);
Select.displayName = "Select";
