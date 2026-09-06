// src/components/common/Modal.tsx
import { X } from "lucide-react";
import { ReactNode } from "react";
import { IconButton } from "@/components/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-card-dark rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="sticky top-0 bg-white dark:bg-card-dark flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 rounded-t-2xl">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <IconButton size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
