// src/components/common/ConfirmModal.tsx
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, ButtonVariant } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  isLoading?: boolean;
  confirmLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  isLoading,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const confirmVariant: ButtonVariant = tone === "danger" ? "danger" : "primary";

  return (
    <div className="fixed inset-0 z-[200] grid items-end sm:items-center sm:p-4">
      <div className="u-overlay absolute inset-0 animate-overlay-in" onClick={onCancel} />
      <div className="u-sheet relative w-[calc(100%-16px)] sm:w-full sm:max-w-sm mx-auto mb-[calc(8px+env(safe-area-inset-bottom,0px))] sm:mb-0 rounded-[28px] px-5 pt-6 pb-5 animate-modal-in" role="alertdialog" aria-modal="true" aria-label={title ?? t("common.deleteTitle")}>
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              tone === "danger" ? "bg-u-ert" : "bg-u-gdt",
            )}
          >
            <AlertTriangle
              className={cn("w-7 h-7", tone === "danger" ? "text-u-er" : "text-u-gdx")}
            />
          </div>
          <h3 className="font-fd text-[20px] font-extrabold leading-tight text-u-tx">
            {title ?? t("common.deleteTitle")}
          </h3>
          <p className="text-[15px] text-u-mu">{message}</p>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} fullWidth>
            {t("common.cancel")}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading} fullWidth>
            {confirmLabel ?? t("common.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
};
