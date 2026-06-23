// src/stores/authStore.ts
import { create } from "zustand";
import { User } from "@/types/user";
import { authService } from "@/services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (_email: string, _password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login();
      localStorage.setItem("token", data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (error) {
      set({ error: "Login failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
