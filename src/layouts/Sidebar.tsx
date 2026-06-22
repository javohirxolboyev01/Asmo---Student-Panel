import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 py-3 transition-all hover:scale-105 duration-200 active:scale-95 ${
      isActive
        ? "bg-primary-container/80 text-on-primary-container rounded-xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]"
        : "text-on-surface-variant hover:text-on-surface"
    }`;

  return (
    <nav className="hidden md:flex fixed h-full w-[280px] left-0 top-0 bg-surface/20 backdrop-blur-xl dark:bg-surface-container/20 border-r border-white/10 backdrop-blur-2xl shadow-[40px_0_60px_-15px_rgba(157,92,255,0.2)] flex-col gap-8 p-6 z-50">
      <div className="flex items-center gap-4 mb-4">
        <img
          alt="Student Profile Picture"
          className="w-12 h-12 rounded-full border-2 border-primary/30"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4QJQVCLmPEmQj0iFUyvW2uPaz9X3iIR6i7sVaXkNl85hzCPMAML33xrKjGaAgk-cp4LvYdu7R23cApqUSFwnTQY11EJX5lfXRPqh-ZO-QB48oZdTIzGzzRGrylt1HC_G7jPr6wgS_T4WWegV30SgWaniXxQrhJZgxh4fxvghXtnn5s4qGp0D-BQA98eKmhyjRFA9L_-fdF3Yb8uYDAZX8OItfnvW9DouJCbjDwQPQH6U2LClljJIJzbbZRM8JFG4dmcjuK-ffQv4"
        />
        <div>
          <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed leading-tight">
            ASMO
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm">
            Learning Center
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-grow">
        <NavLink to="/" className={navLinkClass}>
          <span
            className="material-symbols-outlined fill"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            home
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Home
          </span>
        </NavLink>
        <NavLink to="/payments" className={navLinkClass}>
          <span className="material-symbols-outlined">payments</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Payments
          </span>
        </NavLink>
        <NavLink to="/groups" className={navLinkClass}>
          <span className="material-symbols-outlined">group</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Groups
          </span>
        </NavLink>
        <NavLink to="/analytics" className={navLinkClass}>
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Analytics
          </span>
        </NavLink>
        <NavLink to="/leaderboard" className={navLinkClass}>
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Leaderboard
          </span>
        </NavLink>
        <NavLink to="/shop" className={navLinkClass}>
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Shop
          </span>
        </NavLink>
        <NavLink
          to="/settings"
          className={navLinkClass}
          style={{ marginTop: "auto" }}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            Settings
          </span>
        </NavLink>
      </div>
      <button className="clay-button w-full py-3 px-4 flex items-center justify-center gap-2 mt-4 text-on-primary font-label-sm text-label-sm uppercase tracking-wider">
        <span className="material-symbols-outlined text-[18px]">
          workspace_premium
        </span>
        Upgrade Plan
      </button>
    </nav>
  );
}
