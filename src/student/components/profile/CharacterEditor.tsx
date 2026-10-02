// src/student/components/profile/CharacterEditor.tsx
// "Qahramoningni yarat" — full-screen character editor from the profile mock.
// Paid items are bought with real coins (server prices + ownership check);
// saving stores the rendered face as the user's avatar.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useAvatarItemsQuery, usePurchaseAvatarItemMutation } from "@/hooks/queries/useAvatarItems";
import { getErrorMessage } from "@/lib/toast";
import {
  BACKGROUNDS,
  DEFAULT_CHARACTER,
  characterFromAvatar,
  EYE_COLORS,
  FACE_VB,
  FULL_VB,
  HAIR_COLORS,
  OUTFIT_VB,
  SKIN,
  avatarSvg,
  encodeCharacter,
  faceIcon,
  isOwned,
  itemKey,
  itemsOf,
  nameOf,
  priceOf,
  randomCharacter,
  renderCharacter,
  type Character,
  type Category,
  type ItemCategory,
} from "../../lib/character";
import { Spinner } from "../ui";

const host = () => document.querySelector(".sp") ?? document.body;

/** Emoji confetti from the middle of the screen (mock's `confetti()`). */
export const confetti = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = host();
  for (let i = 0; i < 22; i++) {
    const s = document.createElement("span");
    s.className = "sp-ce-cf";
    s.textContent = ["⭐", "✨", "🎉", "💎"][i % 4];
    root.appendChild(s);
    s.animate(
      [
        { transform: "translate(0,0) scale(.5)", opacity: 1 },
        {
          transform: `translate(${(Math.random() - 0.5) * 360}px,${(Math.random() - 0.8) * 320}px) rotate(${Math.random() * 360}deg) scale(1.2)`,
          opacity: 0,
        },
      ],
      { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.4,1)" },
    ).onfinish = () => s.remove();
  }
};

const Svg = ({ html, className }: { html: string; className?: string }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const BgSwatch = ({ v }: { v: number }) => (
  <span className="sp-ce-bgtile" style={{ background: `linear-gradient(${BACKGROUNDS[v][0]},${BACKGROUNDS[v][1]})` }} />
);

interface Props {
  /** The user's current avatar; its saved character (if any) is the starting point. */
  avatar: string | null | undefined;
  onClose: () => void;
  onToast: (message: string) => void;
}

type Tab = Category;

export const CharacterEditor = ({ avatar, onClose, onToast }: Props) => {
  const { t } = useTranslation();
  const saveCharacter = useAuthStore((s) => s.saveCharacter);
  const items = useAvatarItemsQuery();
  const purchase = usePurchaseAvatarItemMutation();
  const owned = items.data?.owned ?? [];
  const coins = items.data?.coinBalance ?? 0;

  const saved = useMemo(() => characterFromAvatar(avatar), [avatar]);
  const [d, setD] = useState<Character>(saved ?? DEFAULT_CHARACTER);
  const [tab, setTab] = useState<Tab>("hair");
  const [say, setSay] = useState(() => t("space.ce.hello"));
  const [jump, setJump] = useState(0);
  const [pending, setPending] = useState<{ cat: ItemCategory; v: number } | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const [arrows, setArrows] = useState({ left: false, right: true });

  const nameFor = (cat: ItemCategory, v: number) => {
    const key = `space.ce.n.${itemKey(cat, v, d.g)}`;
    const text = t(key);
    return text === key ? nameOf(cat, v, d.g) : text;
  };

  const praise = () => {
    const list = t("space.ce.praise").split("|");
    return list[Math.floor(Math.random() * list.length)];
  };

  const update = (next: Character, message: string) => {
    setD(next);
    setSay(message);
    setJump((j) => j + 1);
  };

  // ── Tabs ──
  const tabs = useMemo(() => {
    const list: [Tab, string, boolean][] = [
      ["skin", faceIcon(d.skin), true],
      ["hair", "💇", false],
      ["eyes", "👀", false],
      ...(d.g === "m" ? ([["beard", "🧔", false]] as [Tab, string, boolean][]) : []),
      ["outfit", "👕", false],
      ["hat", "🎩", false],
      ["glasses", "👓", false],
      ["bg", "🌈", false],
    ];
    return list;
  }, [d.g, d.skin]);

  useEffect(() => {
    if (!tabs.some(([k]) => k === tab)) setTab("hair");
  }, [tabs, tab]);

  const updateArrows = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const left = el.scrollLeft >= 4;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
    // Same values → same object, so scrolling doesn't re-render the whole editor.
    setArrows((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows, tabs]);

  // Mouse drag + vertical wheel scroll the category strip (mock behaviour).
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    let x0 = 0;
    let s0 = 0;
    let down = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      x0 = e.clientX;
      s0 = el.scrollLeft;
      dragged.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) dragged.current = true;
      el.scrollLeft = s0 - dx;
    };
    const onUp = () => {
      down = false;
      window.setTimeout(() => (dragged.current = false), 60);
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = 0;
  }, [tab]);

  // ── Overlay behaviour: lock page scroll, Escape, initial focus ──
  const closeBuy = () => {
    setPending(null);
    setBuyError(null);
  };
  const close = () => {
    if (!saving) onClose();
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const escRef = useRef<() => void>(() => {});
  escRef.current = () => (pending ? closeBuy() : close());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && escRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Actions ──
  const pick = (key: Category | "hc", v: number) => {
    if (dragged.current) return;
    if (key !== "hc" && key !== "skin" && key !== "eyes" && priceOf(key, v, d.g) > 0 && !isOwned(owned, key, v, d.g)) {
      setBuyError(null);
      setPending({ cat: key, v });
      return;
    }
    update({ ...d, [key]: v }, praise());
  };

  const switchGender = (g: Character["g"]) => {
    if (g === d.g) return;
    update(
      { ...d, g, hair: 0, outfit: 0, beard: 0, hat: g === "f" ? 6 : 1 },
      g === "f" ? t("space.ce.helloGirl") : t("space.ce.helloBoy"),
    );
  };

  const buy = async () => {
    if (!pending) return;
    const { cat, v } = pending;
    const price = priceOf(cat, v, d.g);
    setBuyError(null);
    try {
      await purchase.mutateAsync(itemKey(cat, v, d.g));
      closeBuy();
      onToast(t("space.ce.bought", { n: price }));
      confetti();
      update({ ...d, [cat]: v }, t("space.ce.newItem"));
    } catch (err) {
      setBuyError(getErrorMessage(err, t("common.error")));
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveCharacter(d, avatarSvg(d));
      onToast(t("space.ce.saved"));
      confetti();
      onClose();
    } catch (err) {
      setSaveError(getErrorMessage(err, t("common.error")));
      setSaving(false);
    }
  };

  const unchanged = !!saved && encodeCharacter(saved) === encodeCharacter(d);
  const bg = BACKGROUNDS[d.bg];

  // ── Area (swatches / item grid) ──
  const swatches = (colors: string[], key: "skin" | "eyes" | "hc", cur: number) => (
    <div className="sp-ce-colors">
      {colors.map((c, i) => (
        <button
          key={c}
          type="button"
          className={cur === i ? "sp-ce-sw sel" : "sp-ce-sw"}
          style={{ background: c }}
          onClick={() => pick(key, i)}
          aria-label={t("space.ce.color", { n: i + 1 })}
          aria-pressed={cur === i}
        />
      ))}
    </div>
  );

  const grid = (cat: ItemCategory) => (
    <div className="sp-ce-grid">
      {itemsOf(cat, d.g).map((v) => {
        const price = priceOf(cat, v, d.g);
        const locked = price > 0 && !isOwned(owned, cat, v, d.g);
        const none = (cat === "beard" || cat === "hat" || cat === "glasses") && v === 0;
        const sel = d[cat] === v;
        const cls = ["sp-ce-tile", sel && "sel", none && "none", locked && "locked"].filter(Boolean).join(" ");
        return (
          <button
            key={v}
            type="button"
            className={cls}
            onClick={() => pick(cat, v)}
            aria-label={locked ? `${nameFor(cat, v)} — 💎 ${price}` : nameFor(cat, v)}
            aria-pressed={sel}
          >
            {cat === "bg" ? <BgSwatch v={v} /> : <Svg html={renderCharacter({ ...d, [cat]: v }, cat === "outfit" ? OUTFIT_VB : FACE_VB)} />}
            <span className="sp-ce-ck" aria-hidden="true">
              ✓
            </span>
            {locked && <span className="sp-ce-pr">🔒 💎{price}</span>}
          </button>
        );
      })}
    </div>
  );

  const area =
    tab === "skin" ? (
      swatches(SKIN, "skin", d.skin)
    ) : tab === "eyes" ? (
      swatches(EYE_COLORS, "eyes", d.eyes)
    ) : (
      <>
        {tab === "hair" && swatches(HAIR_COLORS, "hc", d.hc)}
        {grid(tab)}
      </>
    );

  const pendingPrice = pending ? priceOf(pending.cat, pending.v, d.g) : 0;
  const short = pendingPrice - coins;

  return createPortal(
    <>
      <div className="sp-ce-ov" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="sp-ce-sheet" role="dialog" aria-modal="true" aria-labelledby="sp-ce-title" ref={sheetRef} tabIndex={-1}>
          <div className="sp-ce-eh">
            <h2 id="sp-ce-title">{t("space.ce.title")}</h2>
            <div className="sp-ce-chip">💎 {items.isLoading ? "…" : coins}</div>
          </div>

          <div className="sp-ce-stage" style={{ background: `linear-gradient(${bg[0]},${bg[1]})` }}>
            <span key={jump} className={jump ? "sp-ce-chw jump" : "sp-ce-chw"}>
              <Svg html={renderCharacter(d, FULL_VB, { nobg: true, anim: true })} className="sp-ce-ch" />
            </span>
            <div className="sp-ce-bub" aria-live="polite">
              {say}
            </div>
            <button
              type="button"
              className="sp-ce-dice"
              aria-label={t("space.ce.randomLabel")}
              onClick={() => update(randomCharacter(d, owned), t("space.ce.random"))}
            >
              🎲
            </button>
          </div>

          <div className="sp-ce-gen">
            <button type="button" className={d.g === "m" ? "sp-ce-gb on" : "sp-ce-gb"} onClick={() => switchGender("m")} aria-pressed={d.g === "m"}>
              {t("space.ce.boy")}
            </button>
            <button type="button" className={d.g === "f" ? "sp-ce-gb on" : "sp-ce-gb"} onClick={() => switchGender("f")} aria-pressed={d.g === "f"}>
              {t("space.ce.girl")}
            </button>
          </div>

          <div className="sp-ce-tabwrap">
            <button
              type="button"
              className="sp-ce-arr"
              aria-label={t("space.ce.left")}
              disabled={!arrows.left}
              onClick={() => tabsRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
            >
              ‹
            </button>
            <div className="sp-ce-tabs" ref={tabsRef} onScroll={updateArrows}>
              {tabs.map(([key, ico, isSvg]) => (
                <button
                  key={key}
                  type="button"
                  className={key === tab ? "sp-ce-tab on" : "sp-ce-tab"}
                  onClick={() => !dragged.current && setTab(key)}
                  aria-pressed={key === tab}
                >
                  {isSvg ? <Svg html={ico} className="sp-ce-tabico" /> : <span className="sp-ce-tabico">{ico}</span>}
                  {t(`space.ce.tab.${key}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="sp-ce-arr"
              aria-label={t("space.ce.right")}
              disabled={!arrows.right}
              onClick={() => tabsRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
            >
              ›
            </button>
          </div>

          <div className="sp-ce-area" ref={areaRef}>
            {items.isError && <p className="sp-ce-err">{t("space.ce.loadFailed")}</p>}
            {area}
          </div>

          {saveError && (
            <p className="sp-ce-err" role="alert">
              {saveError}
            </p>
          )}
          <div className="sp-ce-btns">
            <button type="button" className="sp-ce-btn ghost" onClick={close} disabled={saving}>
              {t("common.cancel")}
            </button>
            <button type="button" className="sp-ce-btn go" onClick={save} disabled={unchanged || saving}>
              {saving && <Spinner />}
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>

      {pending && (
        <div className="sp-ce-ov sp-ce-buy" onClick={(e) => e.target === e.currentTarget && closeBuy()}>
          <div className="sp-ce-mod" role="dialog" aria-modal="true" aria-labelledby="sp-ce-mname">
            <div className="sp-ce-mprev">
              {pending.cat === "bg" ? (
                <BgSwatch v={pending.v} />
              ) : (
                <Svg html={renderCharacter({ ...d, [pending.cat]: pending.v }, pending.cat === "outfit" ? OUTFIT_VB : FACE_VB)} />
              )}
            </div>
            <h3 id="sp-ce-mname">{nameFor(pending.cat, pending.v)}</h3>
            <div className="sp-ce-mprice">💎 {pendingPrice}</div>
            <p className="sp-ce-mbal">{t("space.ce.balance", { n: coins })}</p>
            {buyError && (
              <p className="sp-ce-err" role="alert">
                {buyError}
              </p>
            )}
            <div className="sp-ce-btns">
              <button type="button" className="sp-ce-btn ghost" onClick={closeBuy} disabled={purchase.isPending}>
                {t("space.ce.later")}
              </button>
              <button type="button" className="sp-ce-btn go" onClick={buy} disabled={short > 0 || purchase.isPending || items.isLoading}>
                {purchase.isPending && <Spinner />}
                {short > 0 ? t("space.ce.notEnough", { n: short }) : t("space.ce.buy")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    host(),
  );
};
