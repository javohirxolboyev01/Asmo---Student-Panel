// src/components/Layout/Header.tsx
import { User } from "@/types/user";
import { Bell } from "lucide-react";
import Logo from "@/images/logo.png";
import { Link } from "react-router-dom";

interface HeaderProps {
  user: User | null;
}

export const Header = ({ user }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={Logo}
            alt="ASMO Learning Platform"
            className="w-[260px] md:w-[300px] h-auto object-contain -ml-12 text-[#F59E0B]"
          />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center  gap-2 md:gap-4">
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          {user && (
            <Link to="/profile" className="flex items-center gap-2">
              <img
                src={user.avatar}
                alt={user.firstName}
                className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-[#2D6BFF] transition-colors"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
