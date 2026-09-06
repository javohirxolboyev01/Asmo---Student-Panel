// src/services/authService.ts
import { apiGet, apiPatch, apiPost, tokenStorage } from "./apiClient";
import { AuthResponse, User } from "@/types/user";

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

// Some endpoints return role/status raw from the DB (UPPERCASE); the rest of the
// app always treats these as lowercase, so every user object funnels through here.
const normalizeUser = (raw: any): User => ({
  ...raw,
  role: raw.role ? String(raw.role).toLowerCase() : raw.role,
  status: raw.status ? String(raw.status).toLowerCase() : raw.status,
});

export const authService = {
  login: async (email: string, password: string) => {
    const data = await apiPost<AuthResponse>(
      "/auth/login",
      { email, password },
      { skipAuth: true },
    );
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return { ...data, user: normalizeUser(data.user) };
  },

  register: async (payload: RegisterPayload) => {
    const data = await apiPost<AuthResponse>("/auth/register", payload, { skipAuth: true });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return { ...data, user: normalizeUser(data.user) };
  },

  getMe: async () => {
    const user = await apiGet<User>("/auth/me");
    return normalizeUser(user);
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const user = await apiPatch<User>("/profile", payload);
    return normalizeUser(user);
  },

  updateEmail: async (email: string) => {
    const data = await apiPatch<{ user: User; message: string }>("/settings/email", { email });
    return { ...data, user: normalizeUser(data.user) };
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    return apiPatch<{ message: string }>("/settings/password", {
      currentPassword,
      newPassword,
    });
  },

  logout: () => {
    tokenStorage.clear();
  },
};
