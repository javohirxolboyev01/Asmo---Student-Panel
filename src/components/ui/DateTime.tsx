// src/components/ui/DateTime.tsx
// The app's own date / time pickers, replacing <input type="date|time|
// datetime-local"> (whose popups look different in every browser and phone).
// Drop-in: same string values as the native inputs ("YYYY-MM-DD", "HH:mm",
// "YYYY-MM-DDTHH:mm"), same onChange({ target: { value, name } }), same
// label / error / required / min / max. All three share one calendar and one
// time picker and open in the shared Popover, styled like every other field.
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { FieldFrame, Popover } from "./Popover";

// ── Value helpers (local time, no time zones involved) ──

const pad = (n: number) => String(n).padStart(2, "0");
export const toDateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseDate = (v: string | undefined | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v ?? "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const parseTime = (v: string | undefined | null) => {
  const m = /(\d{2}):(\d{2})/.exec(v ?? "");
  return m ? { h: Number(m[1]), m: Number(m[2]) } : null;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};

type Fire = (value: string) => void;
const fireChange = (onChange: ((e: ChangeEvent<HTMLInputElement>) => void) | undefined, name?: string): Fire => (
  value,
) => onChange?.({ target: { value, name }, currentTarget: { value, name } } as unknown as ChangeEvent<HTMLInputElement>);

/** "26-noyabr 2026" (+ " · Bugun" / "Ertaga" / "Kecha" when it's close). */
const useDateText = () => {
  const { t } = useTranslation();
  return useCallback(
    (d: Date) => {
      const month = t("when.months").split(",")[d.getMonth()] ?? "";
      const text = `${t("when.dayMonth", { d: d.getDate(), month })} ${d.getFullYear()}`;
      const diff = Math.round((addDays(d, 0).getTime() - addDays(new Date(), 0).getTime()) / 86_400_000);
      const near = diff === 0 ? t("when.today") : diff === 1 ? t("when.tomorrow") : diff === -1 ? t("when.yesterday") : "";
      return near ? `${text} · ${near}` : text;
    },
    [t],
  );
};

// ── Calendar ──

const Calendar = ({
  value,
  min,
  max,
  onPick,
  autoFocus,
}: {
  value: Date | null;
  min: Date | null;
  max: Date | null;
  onPick: (d: Date) => void;
  autoFocus?: boolean;
}) => {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const [focus, setFocus] = useState<Date>(() => value ?? (min && min > today ? min : today));
  const [view, setView] = useState(() => new Date(focus.getFullYear(), focus.getMonth(), 1));
  const grid = useRef<HTMLDivElement>(null);
  const moved = useRef(Boolean(autoFocus));

  // All dates here are local midnights, so plain comparisons are by day.
  const blocked = (d: Date) => Boolean((min && d < min) || (max && d > max));

  // Keyboard focus follows the focused day (only once the user is in the grid).
  useEffect(() => {
    if (!moved.current) return;
    grid.current?.querySelector<HTMLElement>('[data-focus="1"]')?.focus();
  }, [focus]);

  const go = (d: Date) => {
    moved.current = true;
    setFocus(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear())
      setView(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
      Home: () => addDays(focus, -((focus.getDay() + 6) % 7)),
      End: () => addDays(focus, 6 - ((focus.getDay() + 6) % 7)),
    };
    if (map[e.key]) {
      e.preventDefault();
      go(map[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!blocked(focus)) onPick(focus);
    }
  };

  const months = t("picker.months").split(",");
  const weekdays = t("picker.weekdays").split(",");
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7)); // weeks start on Monday
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const prevOk = !min || new Date(view.getFullYear(), view.getMonth(), 0) >= min;
  const nextOk = !max || new Date(view.getFullYear(), view.getMonth() + 1, 1) <= max;

  return (
    <div className="u-cal">
      <div className="u-cal-head">
        <button
          type="button"
          className="u-cal-nav"
          onClick={() => setView(addMonths(view, -1))}
          disabled={!prevOk}
          aria-label={t("picker.prevMonth")}
        >
          <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.4} />
        </button>
        <b aria-live="polite">
          {months[view.getMonth()]} {view.getFullYear()}
        </b>
        <button
          type="button"
          className="u-cal-nav"
          onClick={() => setView(addMonths(view, 1))}
          disabled={!nextOk}
          aria-label={t("picker.nextMonth")}
        >
          <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.4} />
        </button>
      </div>
      <div className="u-cal-week" aria-hidden="true">
        {weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div ref={grid} className="u-cal-grid" role="grid" onKeyDown={onKey}>
        {days.map((d) => {
          const outside = d.getMonth() !== view.getMonth();
          const isSel = value && sameDay(d, value);
          const isFocus = sameDay(d, focus);
          const off = blocked(d);
          return (
            <button
              key={d.toDateString()}
              type="button"
              role="gridcell"
              tabIndex={isFocus ? 0 : -1}
              data-focus={isFocus ? "1" : undefined}
              aria-selected={Boolean(isSel)}
              aria-current={sameDay(d, today) ? "date" : undefined}
              aria-label={`${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`}
              disabled={off}
              onClick={() => {
                setFocus(d);
                onPick(d);
              }}
              className={cn(
                "u-cal-day",
                outside && "out",
                isSel && "sel",
                sameDay(d, today) && "today",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Time columns ──

const TimeColumns = ({
  value,
  step,
  onPick,
}: {
  value: { h: number; m: number } | null;
  step: number;
  onPick: (h: number, m: number, part: "h" | "m") => void;
}) => {
  const { t } = useTranslation();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = useMemo(() => {
    const list = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
    if (value && !list.includes(value.m)) list.push(value.m); // keep an exact saved minute
    return list.sort((a, b) => a - b);
  }, [step, value]);
  const box = useRef<HTMLDivElement>(null);

  // Open with the chosen hour / minute in the middle of each column.
  useEffect(() => {
    box.current?.querySelectorAll<HTMLElement>("[aria-selected='true']").forEach((el) => {
      const col = el.parentElement!;
      const offset = el.getBoundingClientRect().top - col.getBoundingClientRect().top;
      col.scrollTop += offset - col.clientHeight / 2 + el.clientHeight / 2;
    });
  }, [value?.h, value?.m]);

  const col = (items: number[], part: "h" | "m", label: string) => (
    <div className="u-time-col" role="listbox" aria-label={label}>
      {items.map((n) => {
        const sel = value ? (part === "h" ? value.h === n : value.m === n) : false;
        return (
          <button
            key={n}
            type="button"
            role="option"
            aria-selected={sel}
            className={cn("u-time-opt", sel && "sel")}
            onClick={() =>
              part === "h" ? onPick(n, value?.m ?? 0, "h") : onPick(value?.h ?? 9, n, "m")
            }
          >
            {pad(n)}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={box} className="u-time">
      <div className="u-time-labels" aria-hidden="true">
        <span>{t("picker.hours")}</span>
        <span>{t("picker.minutes")}</span>
      </div>
      <div className="u-time-cols">
        {col(hours, "h", t("picker.hours"))}
        <b className="u-time-sep" aria-hidden="true">
          :
        </b>
        {col(minutes, "m", t("picker.minutes"))}
      </div>
    </div>
  );
};

// ── Shared field shell ──

interface BaseProps {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  containerClassName?: string;
  className?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-label"?: string;
}

const Shell = forwardRef<
  HTMLButtonElement,
  BaseProps & {
    icon: ReactNode;
    text: string | null;
    open: boolean;
    setOpen: (v: boolean) => void;
    popover: ReactNode;
    popoverWidth: number;
  }
>(({ label, error, hint, id, required, disabled, placeholder, containerClassName, className, icon, text, open, setOpen, popover, popoverWidth, value, name, "aria-label": ariaLabel }, ref) => {
  const generated = useId();
  const fieldId = id ?? generated;
  const button = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => button.current!, []);
  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <FieldFrame label={label} htmlFor={fieldId} error={error} hint={hint} className={containerClassName}>
      <button
        ref={button}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            setOpen(false);
          }
        }}
        className={cn(
          "w-full flex items-center gap-3 rounded-[16px] outline-none text-[16px] font-medium text-left px-4 py-3 min-h-[48px]",
          "u-field",
          open && "is-open",
          error && "is-error",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <span className="text-u-mu flex-none" aria-hidden="true">
          {icon}
        </span>
        <span className={cn("truncate", !text && "text-u-mu")}>{text ?? placeholder ?? "—"}</span>
      </button>
      {/* Keeps the browser's own "required" check on form submit. */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        required={required}
        value={value ?? ""}
        onChange={() => undefined}
        onFocus={() => button.current?.focus()}
        className="absolute bottom-0 left-4 h-px w-px opacity-0 pointer-events-none"
      />
      <Popover
        anchor={button}
        open={open}
        onClose={close}
        matchWidth={false}
        minWidth={popoverWidth}
        maxHeight={520}
        role="dialog"
        label={typeof label === "string" ? label : undefined}
        sheet
        className="animate-pop-in !p-3"
      >
        {popover}
      </Popover>
    </FieldFrame>
  );
});
Shell.displayName = "PickerShell";

const Footer = ({ children }: { children: ReactNode }) => <div className="u-pick-foot">{children}</div>;

// ── DateField ──

export const DateField = forwardRef<HTMLButtonElement, BaseProps>((props, ref) => {
  const { t } = useTranslation();
  const { value, onChange, name, min, max, required } = props;
  const [open, setOpen] = useState(false);
  const fire = fireChange(onChange, name);
  const date = parseDate(value);
  const minD = parseDate(min);
  const maxD = parseDate(max);
  const dateText = useDateText();
  const today = new Date();
  const todayOk = (!minD || today >= minD || sameDay(today, minD)) && (!maxD || today <= maxD);

  return (
    <Shell
      {...props}
      ref={ref}
      icon={<CalendarDays className="w-[18px] h-[18px]" strokeWidth={2} />}
      text={date ? dateText(date) : null}
      open={open}
      setOpen={setOpen}
      popoverWidth={300}
      popover={
        <>
          <Calendar
            value={date}
            min={minD}
            max={maxD}
            onPick={(d) => {
              fire(toDateValue(d));
              setOpen(false);
            }}
          />
          <Footer>
            {!required && value ? (
              <button type="button" className="u-pick-link muted" onClick={() => (fire(""), setOpen(false))}>
                {t("picker.clear")}
              </button>
            ) : (
              <span />
            )}
            {todayOk && (
              <button type="button" className="u-pick-link" onClick={() => (fire(toDateValue(today)), setOpen(false))}>
                {t("when.today")}
              </button>
            )}
          </Footer>
        </>
      }
    />
  );
});
DateField.displayName = "DateField";

// ── TimeField ──

export const TimeField = forwardRef<HTMLButtonElement, BaseProps & { step?: number }>(
  ({ step = 5, ...props }, ref) => {
    const { t } = useTranslation();
    const { value, onChange, name, required } = props;
    const [open, setOpen] = useState(false);
    const fire = fireChange(onChange, name);
    const time = parseTime(value);

    return (
      <Shell
        {...props}
        ref={ref}
        icon={<Clock className="w-[18px] h-[18px]" strokeWidth={2} />}
        text={time ? `${pad(time.h)}:${pad(time.m)}` : null}
        open={open}
        setOpen={setOpen}
        popoverWidth={220}
        popover={
          <>
            <TimeColumns
              value={time}
              step={step}
              onPick={(h, m, part) => {
                fire(`${pad(h)}:${pad(m)}`);
                if (part === "m") setOpen(false);
              }}
            />
            <Footer>
              {!required && value ? (
                <button type="button" className="u-pick-link muted" onClick={() => (fire(""), setOpen(false))}>
                  {t("picker.clear")}
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="u-pick-link" onClick={() => setOpen(false)}>
                {t("picker.done")}
              </button>
            </Footer>
          </>
        }
      />
    );
  },
);
TimeField.displayName = "TimeField";

// ── DateTimeField ──

export const DateTimeField = forwardRef<
  HTMLButtonElement,
  BaseProps & { step?: number; /** Time used when a day is picked first. */ defaultTime?: string }
>(({ step = 5, defaultTime = "09:00", ...props }, ref) => {
  const { t } = useTranslation();
  const { value, onChange, name, min, max, required } = props;
  const [open, setOpen] = useState(false);
  const fire = fireChange(onChange, name);
  const date = parseDate(value);
  const time = parseTime(value?.slice(11));
  const dateText = useDateText();
  const fallback = parseTime(defaultTime) ?? { h: 9, m: 0 };

  const set = (d: Date | null, tm: { h: number; m: number } | null) => {
    const day = d ?? date ?? new Date();
    const at = tm ?? time ?? fallback;
    fire(`${toDateValue(day)}T${pad(at.h)}:${pad(at.m)}`);
  };

  return (
    <Shell
      {...props}
      ref={ref}
      icon={<CalendarDays className="w-[18px] h-[18px]" strokeWidth={2} />}
      text={date ? `${dateText(date)}, ${time ? `${pad(time.h)}:${pad(time.m)}` : "—"}` : null}
      open={open}
      setOpen={setOpen}
      popoverWidth={window.innerWidth >= 560 ? 500 : 300}
      popover={
        <>
          <div className="u-dt">
            <Calendar value={date} min={parseDate(min)} max={parseDate(max)} onPick={(d) => set(d, null)} />
            <TimeColumns value={date ? time : null} step={step} onPick={(h, m) => set(null, { h, m })} />
          </div>
          <Footer>
            {!required && value ? (
              <button type="button" className="u-pick-link muted" onClick={() => (fire(""), setOpen(false))}>
                {t("picker.clear")}
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="u-pick-btn" onClick={() => setOpen(false)} disabled={!value}>
              {t("picker.done")}
            </button>
          </Footer>
        </>
      }
    />
  );
});
DateTimeField.displayName = "DateTimeField";
