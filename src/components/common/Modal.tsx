// src/components/common/Modal.tsx
// "Ustoz paneli" sheet: slides up from the bottom on phones, centred card
// from 600px (mock `.modal`). Used by the teacher panel only.
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "sm:max-w-[480px]" }: ModalProps) => {
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
        className={`u-sheet relative w-full max-w-[520px] ${maxWidth} mx-auto border-b-0 sm:border-b rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] overflow-y-auto animate-modal-in pb-[env(safe-area-inset-bottom,0px)]`}
      >
        <div className="u-sheet-head sticky top-0 z-10 flex items-center justify-between gap-3 px-[18px] pt-5 pb-3.5 mb-4">
          <h2 className="font-fd text-xl font-semibold leading-tight text-u-tx">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="×"
            className="w-9 h-9 flex-none grid place-items-center rounded-xl bg-u-sf2 text-u-mu hover:text-u-tx hover:bg-u-ln"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        <div className="px-[18px] pb-[22px]">{children}</div>
      </div>
    </div>
  );
};
