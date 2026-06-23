// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("ali@student.uz");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setLoginError("Email yoki parol noto'g'ri");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100/80 p-6 md:p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <GraduationCap className="w-10 h-10 text-[#2D6BFF]" />
              <span className="text-2xl font-bold text-[#1A1D26]">
                Edu Center
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Student paneliga xush kelibsiz
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1D26] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all bg-gray-50"
                  placeholder="Email manzilingiz"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1D26] mb-1.5">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-2xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all bg-gray-50"
                  placeholder="Parolingiz"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A1D26]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {(loginError || error) && (
              <div className="text-sm text-[#C62828] text-center bg-[#FFEBEE] p-3 rounded-2xl">
                {loginError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-base py-3.5"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kirish...
                </>
              ) : (
                "Kirish"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Demo: ali@student.uz / password123
          </p>
        </div>
      </div>
    </div>
  );
};
