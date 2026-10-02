// src/student/components/Missions.tsx
// "Bugungi missiyalar": READY → tap claims the coins (server re-verifies),
// PENDING → tap explains what to do and links there, CLAIMED → done.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useClaimMissionMutation } from "@/hooks/queries/useMissions";
import { getErrorMessage } from "@/lib/toast";
import type { MissionType, MissionsToday, StudentMission } from "@/types/mission";
import { EmptyState, Modal, Skel, Spinner, burst } from "./ui";

const GOAL: Record<MissionType, { path: string; hintKey: string; actionKey: string }> = {
  SUBMIT_HOMEWORK: { path: "/groups", hintKey: "space.missionHintHomework", actionKey: "space.missionGoHomework" },
  ATTEND_LESSON: { path: "/attendance", hintKey: "space.missionHintAttend", actionKey: "space.missionGoAttend" },
  GOOD_GRADE: { path: "/groups", hintKey: "space.missionHintGrade", actionKey: "space.missionGoHomework" },
  PASS_QUIZ: { path: "/", hintKey: "space.missionHintQuiz", actionKey: "space.missionGoQuiz" },
};

/** Where a mission's "go do it" button leads. */
const goalPath = (m: StudentMission) => (m.type === "PASS_QUIZ" && m.quizId ? `/quiz/${m.quizId}` : GOAL[m.type].path);

export const MissionsSkeleton = () => (
  <>
    <Skel className="h-[70px] mb-2.5" />
    <Skel className="h-[70px] mb-2.5" />
    <Skel className="h-[70px] mb-2.5" />
  </>
);

export const Missions = ({
  data,
  onClaimed,
}: {
  data: MissionsToday;
  /** After a successful claim; `allDone` = that was the day's last mission. */
  onClaimed?: (allDone: boolean) => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const claim = useClaimMissionMutation();
  const [pending, setPending] = useState<StudentMission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const allDoneTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(allDoneTimer.current), []);

  const describe = (m: StudentMission) =>
    m.description || t(GOAL[m.type].hintKey, { target: m.target ?? 80 });

  const onTap = (m: StudentMission, el: HTMLElement) => {
    if (m.status === "CLAIMED" || claim.isPending) return;
    if (m.status === "PENDING") {
      // A test is the task itself — open it right away.
      if (m.type === "PASS_QUIZ" && m.quizId) navigate(goalPath(m));
      else setPending(m);
      return;
    }
    claim.mutate(m.id, {
      onSuccess: () => {
        burst(el.querySelector(".sp-rw"), "💎", 5);
        const allDoneNow = data.completed + 1 === data.total;
        onClaimed?.(allDoneNow);
        if (allDoneNow) allDoneTimer.current = window.setTimeout(() => setAllDone(true), 1500);
      },
      onError: (e) => setError(getErrorMessage(e, t("common.error"))),
    });
  };

  if (data.total === 0) {
    return <EmptyState emoji="🛸" title={t("space.noMissions")} text={t("space.noMissionsHint")} />;
  }

  return (
    <>
      {data.missions.map((m) => {
        const busy = claim.isPending && claim.variables === m.id;
        const cls = m.status === "CLAIMED" ? "sp-row sp-done" : m.status === "READY" ? "sp-row sp-ready" : "sp-row";
        return (
          <button
            key={m.id}
            className={cls}
            onClick={(e) => onTap(m, e.currentTarget)}
            aria-disabled={m.status === "CLAIMED"}
            aria-label={`${m.title}. ${t(`space.missionStatus${m.status}`)}`}
          >
            <div className="sp-ic" aria-hidden="true">
              {m.emoji}
            </div>
            <div className="sp-t">
              <b>{m.title}</b>
              <small>{m.status === "READY" ? t("space.missionReady") : describe(m)}</small>
            </div>
            <span className="sp-rw">+{m.coinReward}💎</span>
            <span className="sp-ck" aria-hidden="true">
              {busy ? <Spinner /> : "✓"}
            </span>
          </button>
        );
      })}

      <Modal open={Boolean(pending)} onClose={() => setPending(null)} labelledBy="sp-mission-title">
        {pending && (
          <>
            <div className="text-5xl" aria-hidden="true">
              {pending.emoji}
            </div>
            <h2 id="sp-mission-title">{pending.title}</h2>
            <p>{describe(pending)}</p>
            <p>{t("space.missionNotYet", { coins: pending.coinReward })}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="sp-cta sp-ghost" onClick={() => setPending(null)}>
                {t("nav.close")}
              </button>
              <button
                className="sp-cta"
                onClick={() => {
                  const path = goalPath(pending);
                  setPending(null);
                  navigate(path);
                }}
              >
                {t(GOAL[pending.type].actionKey)}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={Boolean(error)} onClose={() => setError(null)}>
        <div className="text-5xl" aria-hidden="true">
          🛰
        </div>
        <h2>{t("common.error")}</h2>
        <p>{error}</p>
        <button className="sp-cta" onClick={() => setError(null)}>
          {t("space.ok")}
        </button>
      </Modal>

      <Modal open={allDone} onClose={() => setAllDone(false)}>
        <div className="text-5xl" aria-hidden="true">
          🚀
        </div>
        <h2>{t("space.allDoneTitle")}</h2>
        <p>{t("space.allDoneText")}</p>
        <button className="sp-cta" onClick={() => setAllDone(false)}>
          {t("space.awesome")}
        </button>
      </Modal>
    </>
  );
};
