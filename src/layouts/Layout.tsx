import { Outlet, NavLink } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center transition-transform active:scale-90 ${
      isActive
        ? "bg-primary text-on-primary rounded-full w-12 h-12 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4)]"
        : "text-on-surface-variant opacity-60 hover:opacity-100"
    }`;

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar />
      <Topbar />
      <main className="md:ml-[280px] p-margin-mobile md:p-margin-desktop pb-32 md:pb-margin-desktop max-w-container-max mx-auto w-full min-h-screen flex flex-col gap-gutter">
        <Outlet />
      </main>
      <nav className="flex justify-around items-center px-4 py-3 h-20 fixed bottom-0 w-full z-50 rounded-t-3xl md:hidden bg-surface-container/90 backdrop-blur-2xl dark:bg-surface-container-highest/90 shadow-[0_-10px_40px_rgba(157,92,255,0.3)]">
        <NavLink to="/" className={mobileNavLinkClass}>
          <span className="material-symbols-outlined fill" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        </NavLink>
        <NavLink to="/groups" className={mobileNavLinkClass}>
          <span className="material-symbols-outlined">groups</span>
        </NavLink>
        <NavLink to="/shop" className={mobileNavLinkClass}>
          <span className="material-symbols-outlined">shopping_bag</span>
        </NavLink>
        <NavLink to="/leaderboard" className={mobileNavLinkClass}>
          <span className="material-symbols-outlined">military_tech</span>
        </NavLink>
        <NavLink to="/settings" className={mobileNavLinkClass}>
          <span className="material-symbols-outlined">settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
