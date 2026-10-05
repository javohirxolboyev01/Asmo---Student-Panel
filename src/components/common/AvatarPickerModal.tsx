// src/components/common/AvatarPickerModal.tsx
import { useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { AVATAR_OPTIONS } from "@/components/common/avatars";

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar: string | null | undefined;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (avatarPath: string) => void;
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
    onSave(selected.path);
  };

  const renderGroup = (gender: "boy" | "girl", heading: string) => (
    <div>
      <h3 className="mb-3">{heading}</h3>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {AVATAR_OPTIONS.filter((a) => a.gender === gender).map((avatar) => {
          const isSelected = selectedId === avatar.id;
          const isCurrent = !selectedId && !!currentAvatar && currentAvatar.endsWith(avatar.path);
          const isActive = isSelected || isCurrent;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setSelectedId(avatar.id)}
              aria-label={avatar.label}
              aria-pressed={isActive}
              className="grid place-items-center"
            >
              <span
                className="relative block aspect-square w-full max-w-[76px] overflow-hidden rounded-full bg-u-sf2 transition-shadow"
                style={{ boxShadow: `0 0 0 3px ${isActive ? "var(--pr)" : "var(--ln)"}` }}
              >
                <img src={avatar.path} alt="" className="h-full w-full" />
                {isActive && (
                  <span
                    className="absolute bottom-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full"
                    style={{ background: "var(--prf)", color: "#fff", boxShadow: "0 0 0 2px var(--sf)" }}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t("profile.chooseAvatar")} maxWidth="sm:max-w-[520px]">
      <div className="u-stack" style={{ gap: 20 }}>
        <p className="u-sub" style={{ marginTop: -6 }}>{t("profile.chooseAvatarDesc")}</p>
        {renderGroup("boy", t("profile.avatarBoys"))}
        {renderGroup("girl", t("profile.avatarGirls"))}
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" onClick={handleSave} isLoading={isSaving} disabled={!selected}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
