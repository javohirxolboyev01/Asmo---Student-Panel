// src/student/components/DailyChest.tsx
// "Kunlik sovg'a" row (top of the dashboard missions) + box picker. The server decides what
// is inside each box; we only send which one was picked.
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useOpenChestMutation } from "@/hooks/queries/useMissions";
import { getErrorMessage } from "@/lib/toast";
import type { OpenChestResult } from "@/types/mission";
import { Gift, MoonStar, PackageOpen, Wind } from "lucide-react";
import { Modal, Spinner, burst } from "./ui";
import { CoinGlyph, IconTile } from "./icons";

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
      <button
        type="button"
        className={opened ? "sp-row sp-chest sp-off" : "sp-row sp-chest"}
        onClick={() => setIsOpen(true)}
      >
        <div className="sp-ic sp-chest-ic" aria-hidden="true">
          <IconTile icon={opened ? MoonStar : Gift} tint={opened ? "gray" : "yellow"} />
        </div>
        <div className="sp-t">
          <b>{t("space.chest")}</b>
          <small>{opened ? t("home.chestDone") : t("home.chestReady")}</small>
        </div>
        <span className="sp-chest-go" aria-hidden="true">
          {opened ? t("home.chestView") : t("home.chestOpen")}
        </span>
      </button>

      <Modal open={isOpen} onClose={close} labelledBy="sp-chest-title" sheet>
        {showTomorrow ? (
          <>
            <IconTile icon={MoonStar} tint="indigo" size="lg" />
            <h2 id="sp-chest-title">{t("space.chestTomorrowTitle")}</h2>
            <p>{t("space.chestTomorrowText", { reward: reward ?? 0 })}</p>
            <button className="sp-cta" onClick={close}>
              {t("space.ok")}
            </button>
          </>
        ) : (
          <>
            <h2 id="sp-chest-title">
              {result ? (
                <>
                  +{result.reward} <CoinGlyph />
                </>
              ) : (
                t("space.chestPickTitle")
              )}
            </h2>
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
                    <span className="sp-cap-ic" aria-hidden="true">
                      {result ? isPicked ? <PackageOpen /> : <Wind /> : <Gift />}
                    </span>
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
