// src/student/components/ProgressRing.tsx
// Dashboard course-progress ring (iOS Fitness style). On mount it fills from
// 0 to the group's course progress; each claimed mission gives it a short
// "turbo" pulse, finishing every mission of the day a bigger "launch" with a
// star burst. Missions never move it permanently — only real lessons do.
import { useEffect, useRef, useState } from "react";
import { burst } from "./ui";

export type RingBoost = { kind: "turbo" | "launch"; id: number };

const R = 52;
const C = 2 * Math.PI * R;

export const ProgressRing = ({
  value,
  boost,
  label,
}: {
  /** 0–100 */
  value: number;
  boost: RingBoost | null;
  label: string;
}) => {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Let the first paint show an empty ring, then animate to the value.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  useEffect(() => {
    if (boost?.kind === "launch") burst(ref.current, "⭐", 10);
  }, [boost]);

  const pct = Math.min(100, Math.max(0, shown));
  return (
    <div
      ref={ref}
      key={boost?.id ?? 0}
      className={boost ? `sp-ring sp-ring-${boost.kind}` : "sp-ring"}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="sp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sp-ring-a)" />
            <stop offset="100%" stopColor="var(--sp-ring-b)" />
          </linearGradient>
        </defs>
        <circle className="sp-ring-track" cx="60" cy="60" r={R} />
        <circle
          className="sp-ring-bar"
          cx="60"
          cy="60"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          stroke="url(#sp-ring-grad)"
        />
      </svg>
      <span className="sp-ring-val">
        {Math.round(value)}
        <small>%</small>
      </span>
    </div>
  );
};
