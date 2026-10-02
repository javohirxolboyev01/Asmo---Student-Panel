// src/student/components/Rocket.tsx
// The dashboard rocket. Its spot on the trail is the group's course progress
// (fuel). On mount it flies there from the home planet along the arc; each
// claimed mission fires a short "turbo" kick, and finishing every mission of
// the day a bigger "launch". Missions never move it permanently — only real
// lessons do.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { burst } from "./ui";

export type RocketBoost = { kind: "turbo" | "launch"; id: number };

const FLIGHT_MS = 1400;

// Rocket rides an arc from the home planet (bottom-left) to the target planet
// (top-right), in the 400×250 viewBox of the dotted trail.
const rocketPosition = (fuel: number): CSSProperties => {
  const t = fuel / 100;
  const x = 60 + (300 - 60) * t;
  const y = 175 - (175 - 85) * t - Math.sin(t * Math.PI) * 60;
  return { left: `${(x / 400) * 100}%`, top: `${(y / 250) * 100}%` };
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Animates from the last shown value (0 on mount) to `target`, frame by frame, so the path follows the arc. */
const useFlight = (target: number) => {
  const [shown, setShown] = useState(() => (reducedMotion() ? target : 0));
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (reducedMotion()) {
      setShown(target);
      return;
    }
    const from = shownRef.current;
    if (from === target) return;
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / FLIGHT_MS);
      setShown(from + (target - from) * easeOut(p));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
};

export const Rocket = ({ fuel, boost }: { fuel: number; boost: RocketBoost | null }) => {
  const shown = useFlight(fuel);
  const bodyRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (boost?.kind === "launch") burst(bodyRef.current, "⭐", 10);
  }, [boost]);

  return (
    <div className="sp-rocket" style={rocketPosition(shown)} aria-hidden="true">
      {/* key restarts the CSS animation on every boost */}
      <span key={boost?.id ?? 0} ref={bodyRef} className={boost ? `sp-rocket-body sp-${boost.kind}` : "sp-rocket-body"}>
        <span className="sp-flame" />
        🚀
      </span>
    </div>
  );
};
