// src/stores/authStore.ts
import { create } from "zustand";
import { User } from "@/types/user";
import { authService } from "@/services/authService";
import { ApiError, tokenStorage } from "@/services/apiClient";
import { clearSessionCache, readCachedUser, startSessionCache, writeCachedUser } from "@/lib/sessionCache";

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
  saveCharacter: (config: unknown, svg: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// A returning user starts signed in from the cached profile; checkAuth then
// re-validates it in the background instead of blocking the first render.
const cachedUser = tokenStorage.getAccessToken() ? readCachedUser() : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: cachedUser,
  isAuthenticated: !!cachedUser,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      startSessionCache(data.user);
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
      startSessionCache(data.user);
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
    clearSessionCache();
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
      await startSessionCache(user);
      set({ user, isAuthenticated: true });
    } catch (error) {
      // A network hiccup shouldn't sign out someone who is already in from
      // the cached profile; only a rejected session does.
      const rejected = error instanceof ApiError && [401, 403, 404].includes(error.status);
      if (rejected || !get().isAuthenticated) {
        tokenStorage.clear();
        clearSessionCache();
        set({ user: null, isAuthenticated: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.updateProfile(payload);
      writeCachedUser(user);
      set({ user });
    } catch (error) {
      set({ error: extractErrorMessage(error, "Ma'lumotlarni yangilashda xatolik yuz berdi") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  saveCharacter: async (config: unknown, svg: string) => {
    const user = await authService.saveCharacter(config, svg);
    writeCachedUser(user);
    set({ user });
  },

  updateEmail: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updateEmail(email);
      writeCachedUser(data.user);
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
