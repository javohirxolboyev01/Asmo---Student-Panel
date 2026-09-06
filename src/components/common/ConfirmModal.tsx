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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-card-dark rounded-2xl shadow-xl p-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              tone === "danger" ? "bg-[#FFEBEE] dark:bg-[#C62828]/15" : "bg-primary-50 dark:bg-primary-500/15",
            )}
          >
            <AlertTriangle className={cn("w-6 h-6", tone === "danger" ? "text-red-500" : "text-primary-500")} />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            {title ?? t("common.deleteTitle")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading} fullWidth>
            {t("common.cancel")}
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm} isLoading={isLoading} fullWidth>
            {confirmLabel ?? t("common.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
};
