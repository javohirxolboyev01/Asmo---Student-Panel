// src/student/components/DailyChest.tsx
// Floating "Kunlik sandiq" button + capsule picker. The server decides what
// is inside each capsule; we only send which one was picked.
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useOpenChestMutation } from "@/hooks/queries/useMissions";
import { getErrorMessage } from "@/lib/toast";
import type { OpenChestResult } from "@/types/mission";
import { Modal, Spinner, burst } from "./ui";

export const DailyChest = ({ opened, reward }: { opened: boolean; reward: number | null }) => {
  const { t } = useTranslation();
  const open = useOpenChestMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<OpenChestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setResult(null);
    setError(null);
    open.reset();
  };

  const pick = (index: number, el: HTMLElement) => {
    if (open.isPending || result) return;
    setError(null);
    open.mutate(index, {
      onSuccess: (r) => {
        setResult(r);
        burst(el, "💎", 8);
      },
      onError: (e) => setError(getErrorMessage(e, t("common.error"))),
    });
  };

  // Already opened today (and not the reveal we just showed) → "come back tomorrow".
  const showTomorrow = opened && !result;

  return (
    <>
      <button className={opened ? "sp-box sp-off" : "sp-box"} onClick={() => setIsOpen(true)}>
        <span aria-hidden="true">🛸</span>
        {t("space.chest")}
      </button>

      <Modal open={isOpen} onClose={close} labelledBy="sp-chest-title">
        {showTomorrow ? (
          <>
            <div className="text-5xl" aria-hidden="true">
              🌙
            </div>
            <h2 id="sp-chest-title">{t("space.chestTomorrowTitle")}</h2>
            <p>{t("space.chestTomorrowText", { reward: reward ?? 0 })}</p>
            <button className="sp-cta" onClick={close}>
              {t("space.ok")}
            </button>
          </>
        ) : (
          <>
            <h2 id="sp-chest-title">{result ? `+${result.reward} 💎` : t("space.chestPickTitle")}</h2>
            <p>{result ? t("space.chestAdded") : t("space.chestPickText")}</p>
            <div className="sp-three">
              {[0, 1, 2].map((i) => {
                const isPicked = result?.pick === i;
                const cls = result ? (isPicked ? "sp-cap sp-shown" : "sp-cap sp-dim") : "sp-cap";
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={open.isPending || Boolean(result)}
                    onClick={(e) => pick(i, e.currentTarget)}
                    aria-label={t("space.capsule", { n: i + 1 })}
                  >
                    <span aria-hidden="true">{result ? (isPicked ? "🎁" : "💨") : "🛸"}</span>
                    {result ? `+${result.rewards[i]}` : open.isPending && open.variables === i ? <Spinner /> : "?"}
                  </button>
                );
              })}
            </div>
            {error && <p className="sp-msg sp-err">{error}</p>}
            {result && (
              <button className="sp-cta" onClick={close}>
                {t("space.awesome")}
              </button>
            )}
          </>
        )}
      </Modal>
    </>
  );
};
