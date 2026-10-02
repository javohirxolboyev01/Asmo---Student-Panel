// src/pages/auth/AuthShell.tsx
// Shared chrome for Login/Register: space background, theme toggle, logo,
// role switch and the password-visibility field.
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, ChevronDown, Eye, EyeOff, Globe, GraduationCap, Moon, Sun, User, Users } from "lucide-react";
import type { Language } from "@/i18n/translations";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import "./auth.css";

export type AuthRole = "student" | "teacher";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export const AuthShell = ({ subtitle, children }: { subtitle: string; children: ReactNode }) => {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  return (
    <div className="au">
      <div className="au-top">
        <LanguageMenu />
        <button type="button" className="au-tt" onClick={toggleTheme} aria-label={t("auth.toggleTheme")}>
          {theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}
        </button>
      </div>
      <div className="au-stars" />
      <span className="au-dc au-d1" aria-hidden="true">🪐</span>
      <span className="au-dc au-d2" aria-hidden="true">🚀</span>
      <span className="au-dc au-d3" aria-hidden="true">☄️</span>

      <div className="au-ab">
        <div className="au-ac">
          <div className="au-logo">
            <span className="au-lg">
              <GraduationCap className="ic" />
            </span>
            <div>
              <b>
                Asmo <em>Learning</em>
              </b>
              <small>{t("auth.educationCenter")}</small>
            </div>
          </div>
          <p className="au-sub">{subtitle}</p>
          {children}
          <p className="au-copy">{t("auth.footer")}</p>
        </div>
      </div>
    </div>
  );
};

const LanguageMenu = () => {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (value: Language) => {
    setLanguage(value);
    setOpen(false);
  };

  return (
    <div className="au-lang" ref={ref}>
      <button
        type="button"
        className="au-lang-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("auth.language")}
      >
        <Globe className="ic" />
        {current.label}
        <ChevronDown className={open ? "ic au-lang-chev on" : "ic au-lang-chev"} />
      </button>
      {open && (
        <ul className="au-lang-menu" role="listbox" aria-label={t("auth.language")}>
          {LANGUAGES.map((l) => (
            <li key={l.value}>
              <button
                type="button"
                role="option"
                aria-selected={l.value === language}
                className={l.value === language ? "on" : ""}
                onClick={() => choose(l.value)}
              >
                {l.label}
                {l.value === language && <Check className="ic" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const RoleSwitch = ({ role, onChange }: { role: AuthRole; onChange: (r: AuthRole) => void }) => {
  const { t } = useTranslation();
  return (
    <div className="au-roles">
      <button type="button" className={role === "student" ? "on" : ""} onClick={() => onChange("student")}>
        <User className="ic" /> {t("auth.roleStudent")}
      </button>
      <button type="button" className={role === "teacher" ? "on" : ""} onClick={() => onChange("teacher")}>
        <Users className="ic" /> {t("auth.roleTeacher")}
      </button>
    </div>
  );
};

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  icon?: ReactNode;
  /** Adds the eye button that toggles the input between password and text. */
  revealable?: boolean;
};

export const AuthField = ({ label, icon, revealable, type, ...input }: FieldProps) => {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  return (
    <label className="au-fl">
      {label}
      <span className="au-fi">
        <i>{icon}</i>
        <input type={revealable && shown ? "text" : type} {...input} />
        {revealable && (
          <button
            type="button"
            className="au-eye"
            onClick={() => setShown((v) => !v)}
            aria-label={t("auth.showPassword")}
            aria-pressed={shown}
          >
            {shown ? <EyeOff className="ic" /> : <Eye className="ic" />}
          </button>
        )}
      </span>
    </label>
  );
};
