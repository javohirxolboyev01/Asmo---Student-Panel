// src/pages/LoginPage.tsx
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("ali@student.uz");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FA] via-white to-[#EBF0FF] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#F59E0B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F59E0B]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F59E0B]/[0.02] rounded-full blur-2xl" />

      {/* Floating particles */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-[#F59E0B]/30 rounded-full animate-pulse" />
      <div
        className="absolute top-20 right-20 w-3 h-3 bg-[#F59E0B]/30 rounded-full animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-20 left-20 w-2 h-2 bg-[#F59E0B]/30 rounded-full animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-10 right-10 w-3 h-3 bg-[#F59E0B]/30 rounded-full animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#F59E0B]/10 border border-white/50 p-6 md:p-8">
          {/* Logo with Text */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center shadow-lg shadow-[#F59E0B]/30 animate-float">
                  <GraduationCap className="w-8 h-8 text-white" />
                  <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="text-[#1A1D26]">Asmo</span>
                  <span className="text-[#F59E0B]"> Learning</span>
                </h1>
                <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                  Education Center
                </p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Student paneliga xush kelibsiz
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1D26] mb-1.5">
                Email manzil
              </label>
              <div
                className={cn(
                  "relative transition-all duration-300",
                  isFocused && "scale-[1.01]",
                )}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 outline-none transition-all bg-gray-50/50 text-[#1A1D26] placeholder:text-gray-400"
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 outline-none transition-all bg-gray-50/50 text-[#1A1D26] placeholder:text-gray-400"
                  placeholder="Parolingiz"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A1D26] transition-colors p-1 rounded-lg hover:bg-gray-100"
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
              <div className="text-sm text-[#C62828] text-center bg-[#FFEBEE] p-3 rounded-2xl border border-red-200 animate-shake">
                {loginError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3.5 rounded-2xl font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-[#F59E0B]/30 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kirish...
                </>
              ) : (
                <>
                  Kirish
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-[#F59E0B]/5 to-[#D97706]/5 rounded-2xl border border-[#F59E0B]/20">
            <p className="text-center text-xs text-gray-400">
              Demo hisob ma'lumotlari
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-1.5 text-xs">
              <span className="text-gray-500">
                <span className="font-medium text-[#1A1D26]">Email:</span>{" "}
                ali@student.uz
              </span>
              <span className="text-gray-300 hidden xs:inline">|</span>
              <span className="text-gray-500">
                <span className="font-medium text-[#1A1D26]">Parol:</span>{" "}
                password123
              </span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-4">
            © 2026 Asmo Learning. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
