// src/components/common/Modal.tsx
// Warm sheet of the teacher panel: slides up from the bottom on phones (with
// a grabber), centred card from 640px. Used by the teacher panel only.
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "sm:max-w-[480px]" }: ModalProps) => {
  const { t } = useTranslation();
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] grid items-end sm:items-center sm:p-4">
      <div className="u-overlay absolute inset-0 animate-overlay-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`u-sheet relative w-full max-w-[520px] ${maxWidth} mx-auto rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] overscroll-contain overflow-y-auto animate-modal-in pb-[env(safe-area-inset-bottom,0px)]`}
      >
        <div className="u-sheet-head sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-6 pb-3.5 mb-4">
          {/* Grabber (phones) */}
          <span
            aria-hidden="true"
            className="sm:hidden absolute top-[6px] left-1/2 -translate-x-1/2 w-10 h-[5px] rounded-full bg-u-mu/30"
          />
          <h2 className="font-fd text-[19px] font-extrabold leading-tight text-u-tx min-w-0 break-words">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            title={t("common.close")}
            className="u-hit relative w-9 h-9 flex-none grid place-items-center rounded-full bg-u-sf2 text-u-mu hover:text-u-tx hover:bg-u-prt transition-colors"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
};
