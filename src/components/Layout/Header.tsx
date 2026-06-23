// src/components/Layout/Header.tsx
import { Link } from "react-router-dom";
import { Bell, Coins, Search, X, GraduationCap } from "lucide-react";
import { useState } from "react";
import { User } from "@/types/user";

interface HeaderProps {
  user: User | null;
}

export const Header = ({ user }: HeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-[#2D6BFF]" />
          <span className="text-lg font-bold text-[#1A1D26] hidden sm:inline">
            EduCenter
          </span>
        </Link>

        {/* Search - Desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {isSearchOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          {/* Coins */}
          <Link
            to="/coins"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF8E1] rounded-full"
          >
            <Coins className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-semibold text-[#F59E0B]">150</span>
          </Link>

          {/* User Avatar */}
          {user && (
            <Link to="/profile" className="flex items-center gap-2">
              <img
                src={user.avatar}
                alt={user.firstName}
                className="w-8 h-8 rounded-full border-2 border-gray-200"
              />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all text-sm"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};
