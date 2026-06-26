// src/components/Layout/BottomNav.tsx
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Coins,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Bosh" },
  { path: "/groups", icon: BookOpen, label: "Guruh" },
  { path: "/attendance", icon: Calendar, label: "Davomat" },
  { path: "/shop", icon: ShoppingBag, label: "Do'kon" },
  { path: "/coins", icon: Coins, label: "Coin" },
  { path: "/payments", icon: CreditCard, label: "To'lov" },
];

export const BottomNav = () => {
  return (
    <>
      <nav className="tb-nav" aria-label="Asosiy navigatsiya">
        <div className="tb-inner">
          {navItems.map(({ path, icon: Icon, label }) => (
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
                  <span className="tb-label">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <style>{`
        /* ── iOS Tab Bar: pastga yopishadi ── */
        .tb-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;

          /* iOS frosted glass — native tab bar bilan 1:1 */
          background: rgba(249, 249, 249, 0.94);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          backdrop-filter: blur(20px) saturate(180%);

          /* iOS hairline separator */
          border-top: 0.33px solid rgba(0, 0, 0, 0.22);

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
          border: 1.5px solid rgba(249, 249, 249, 0.94);
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
          color: #8E8E93;
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
          color: #8E8E93;
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
      `}</style>
    </>
  );
};
