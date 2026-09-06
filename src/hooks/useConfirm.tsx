// src/hooks/useConfirm.tsx
import { useCallback, useState } from "react";
import { ConfirmModal } from "@/components/common/ConfirmModal";

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
}

interface ConfirmState extends ConfirmOptions {
  message: string;
  resolve: (result: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((message: string, titleOrOptions?: string | ConfirmOptions) => {
    const options: ConfirmOptions =
      typeof titleOrOptions === "string" ? { title: titleOrOptions } : titleOrOptions ?? {};
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve, ...options });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const confirmModal = (
    <ConfirmModal
      isOpen={!!state}
      title={state?.title}
      message={state?.message ?? ""}
      confirmLabel={state?.confirmLabel}
      tone={state?.tone}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, confirmModal };
}
