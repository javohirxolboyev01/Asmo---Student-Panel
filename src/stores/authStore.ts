// src/stores/authStore.ts
import { create } from "zustand";
import { User } from "@/types/user";
import { authService } from "@/services/authService";
import { tokenStorage } from "@/services/apiClient";

const extractErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({ user: data.user, isAuthenticated: true });
    } catch (error) {
      set({ error: extractErrorMessage(error, "Email yoki parol noto'g'ri") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(payload);
      set({ user: data.user, isAuthenticated: true });
    } catch (error) {
      set({ error: extractErrorMessage(error, "Ro'yxatdan o'tishda xatolik yuz berdi") });
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
    const token = tokenStorage.getAccessToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.updateProfile(payload);
      set({ user });
    } catch (error) {
      set({ error: extractErrorMessage(error, "Ma'lumotlarni yangilashda xatolik yuz berdi") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateEmail: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updateEmail(email);
      set({ user: data.user });
    } catch (error) {
      set({ error: extractErrorMessage(error, "Emailni yangilashda xatolik yuz berdi") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.updatePassword(currentPassword, newPassword);
    } catch (error) {
      set({ error: extractErrorMessage(error, "Parolni yangilashda xatolik yuz berdi") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
