// src/components/common/AvatarPickerModal.tsx
import { useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { AVATAR_OPTIONS, avatarSvgToDataUri } from "@/components/common/avatars";

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar: string | null | undefined;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (dataUri: string) => void;
}

export const AvatarPickerModal = ({ isOpen, currentAvatar, isSaving, onClose, onSave }: AvatarPickerModalProps) => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = AVATAR_OPTIONS.find((a) => a.id === selectedId);

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  const handleSave = () => {
    if (!selected) return;
    onSave(avatarSvgToDataUri(selected.svg));
  };

  const renderGroup = (gender: "boy" | "girl", heading: string) => (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        {heading}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
        {AVATAR_OPTIONS.filter((a) => a.gender === gender).map((avatar) => {
          const dataUri = avatarSvgToDataUri(avatar.svg);
          const isSelected = selectedId === avatar.id;
          const isCurrent = !selectedId && currentAvatar === dataUri;
          const isActive = isSelected || isCurrent;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setSelectedId(avatar.id)}
              aria-label={avatar.label}
              aria-pressed={isActive}
              className="group flex items-center justify-center"
            >
              <span
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-offset-2 dark:ring-offset-card-dark transition-all duration-200 overflow-hidden shadow-sm",
                  isActive
                    ? "ring-warning scale-105 shadow-md shadow-warning/20"
                    : "ring-transparent group-hover:ring-gray-200 dark:group-hover:ring-gray-700 group-hover:scale-105 group-active:scale-95",
                )}
              >
                <img src={dataUri} alt="" className="w-full h-full" />
                {isActive && (
                  <span className="absolute inset-0 flex items-end justify-end p-1">
                    <span className="w-5 h-5 rounded-full bg-warning text-white flex items-center justify-center ring-2 ring-white dark:ring-card-dark">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("profile.chooseAvatar")} maxWidth="max-w-xl">
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1 mb-5">{t("profile.chooseAvatarDesc")}</p>
      <div className="space-y-6">
        {renderGroup("boy", t("profile.avatarBoys"))}
        {renderGroup("girl", t("profile.avatarGirls"))}
      </div>
      <div className="flex items-center gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={handleClose} disabled={isSaving} fullWidth>
          {t("common.cancel")}
        </Button>
        <Button size="sm" onClick={handleSave} isLoading={isSaving} disabled={!selected} fullWidth>
          {t("common.save")}
        </Button>
      </div>
    </Modal>
  );
};
