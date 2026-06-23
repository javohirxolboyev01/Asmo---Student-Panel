// src/pages/ProfilePage.tsx
import { useAuthStore } from "@/stores/authStore";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

export const ProfilePage = () => {
  const { user, logout } = useAuthStore();

  if (!user) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">Profil ma'lumotlari topilmadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26]">
          Profil
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          Shaxsiy ma'lumotlaringiz
        </p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="p-5 md:p-6">
          <div className="flex flex-col items-center text-center">
            <img
              src={user.avatar}
              alt={user.firstName}
              className="w-24 h-24 rounded-full border-4 border-[#2D6BFF]/20"
            />
            <h2 className="text-xl font-bold text-[#1A1D26] mt-3">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-500 text-sm">Talaba</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        <button className="card w-full text-left hover:shadow-card-hover transition-shadow">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-[#0D47A1]" />
              </div>
              <div>
                <p className="font-medium text-[#1A1D26]">
                  Ma'lumotlarni tahrirlash
                </p>
                <p className="text-xs text-gray-500">
                  Shaxsiy ma'lumotlarni yangilash
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button className="card w-full text-left hover:shadow-card-hover transition-shadow">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F3E5F5] rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#6A1B9A]" />
              </div>
              <div>
                <p className="font-medium text-[#1A1D26]">Sozlamalar</p>
                <p className="text-xs text-gray-500">
                  Hisob sozlamalarini boshqarish
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button
          onClick={logout}
          className="card w-full text-left hover:shadow-card-hover transition-shadow border-red-100"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFEBEE] rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-[#C62828]" />
              </div>
              <div>
                <p className="font-medium text-[#C62828]">Chiqish</p>
                <p className="text-xs text-[#C62828]/70">Hisobdan chiqish</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>
    </div>
  );
};
