// src/components/Layout/BottomNav.tsx
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { NavItem } from "./navigation";

export const BottomNav = ({ items, more = [] }: { items: NavItem[]; more?: NavItem[] }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const moreActive = more.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

  // Close on navigation and on Escape.
  useEffect(() => setSheetOpen(false), [pathname]);
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  return (
    <>
      <nav className="tb-nav" aria-label="Asosiy navigatsiya">
        <div className="tb-inner">
          {items.map(({ path, icon: Icon, labelKey }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                cn("tb-item", isActive && "tb-item--on")
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon */}
                  <span className="tb-icon">
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2 : 1.6}
                      aria-hidden="true"
                    />
                  </span>

                  {/* Label */}
                  <span className="tb-label">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
          {more.length > 0 && (
            <button
              type="button"
              className={cn("tb-item tb-more", (moreActive || sheetOpen) && "tb-item--on")}
              aria-expanded={sheetOpen}
              aria-haspopup="dialog"
              onClick={() => setSheetOpen((open) => !open)}
            >
              <span className="tb-icon">
                <LayoutGrid size={24} strokeWidth={moreActive || sheetOpen ? 2 : 1.6} aria-hidden="true" />
              </span>
              <span className="tb-label">{t("nav.more")}</span>
            </button>
          )}
        </div>
      </nav>

      {sheetOpen && (
        <div className="tb-sheet-backdrop" onClick={() => setSheetOpen(false)}>
          <div
            className="tb-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.more")}
            onClick={(e) => e.stopPropagation()}
          >
            {more.map(({ path, icon: Icon, labelKey }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSheetOpen(false)}
                className={({ isActive }) => cn("tb-sheet-item", isActive && "tb-sheet-item--on")}
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .dark .tb-nav {
          background: rgba(18, 20, 27, 0.94);
          border-top-color: rgba(255, 255, 255, 0.08);
        }
        .dark .tb-badge {
          border-color: rgba(18, 20, 27, 0.94);
        }
        .dark .tb-icon {
          color: #6b7280;
        }
        .dark .tb-label {
          color: #6b7280;
        }
        /* ── iOS Tab Bar: pastga yopishadi ── */
        .tb-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;

          /* iOS frosted glass — native tab bar bilan 1:1 */
          background: rgba(53, 73, 109, 0.96); /* #35496D */
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          backdrop-filter: blur(20px) saturate(180%);

          /* iOS hairline separator */
          border-top: 0.33px solid rgba(255, 255, 255, 0.14);

          /* iPhone X+ home indicator uchun */
          padding-bottom: env(safe-area-inset-bottom, 0px);
          padding-left: 4px;
          padding-right: 4px;
        }

        /* ── Items row: iOS default height = 49px ── */
        .tb-inner {
          display: flex;
          align-items: stretch;
          justify-content: space-around;
          height: 49px;
        }

        /* ── Single tab item ── */
        .tb-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 0 2px;
          text-decoration: none;
          position: relative;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.12s ease;
          /* min tap target */
          min-width: 44px;
        }

        .tb-item:active {
          transform: scale(0.86);
        }

        /* ── Badge ── */
        .tb-badge {
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(4px);
          min-width: 16px;
          height: 16px;
          background: #FF3B30;
          border: 1.5px solid rgba(53, 73, 109, 0.96);
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          line-height: 1;
          font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          z-index: 1;
        }

        /* ── Icon ── */
        .tb-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          line-height: 1;
          transition:
            color 0.18s ease,
            transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

          .tb-item--on .tb-icon {
            color: #F59E0B;
            transform: scale(1.08) translateY(-1px);
          }

        /* ── Label ── */
        .tb-label {
          font-size: 10px;
          font-weight: 400;
          color: #ffffff;
          letter-spacing: -0.1px;
          line-height: 1;
          white-space: nowrap;
          transition: color 0.18s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
        }

        .tb-item--on .tb-label {
          color: #F59E0B;
          font-weight: 500;
        }

        /* ── "More" sheet: slides up above the tab bar ── */
        .tb-more {
          border: 0;
          background: transparent;
          font: inherit;
          cursor: pointer;
        }
        .tb-sheet-backdrop {
          position: fixed;
          inset: 0;
          z-index: 49;
          background: rgba(0, 0, 0, 0.35);
        }
        .tb-sheet {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: calc(57px + env(safe-area-inset-bottom, 0px));
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 10px;
          border-radius: 18px;
          background: rgba(53, 73, 109, 0.98);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          animation: tb-sheet-in 0.18s ease-out;
        }
        .dark .tb-sheet {
          background: rgba(28, 31, 40, 0.98);
        }
        @keyframes tb-sheet-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
        }
        .tb-sheet-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 4px;
          border-radius: 12px;
          color: #ffffff;
          font-size: 12px;
          text-align: center;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
        }
        .tb-sheet-item:active {
          background: rgba(255, 255, 255, 0.08);
        }
        .tb-sheet-item--on {
          color: #F59E0B;
        }
      `}</style>
    </>
  );
};
