// src/services/apiClient.ts
import { isTelegram } from "@/lib/telegram";
// Fetch-based client for the real Asmo backend (Authorization: Bearer <accessToken>).
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  /** Machine-readable error code from the server, e.g. "TELEGRAM_ONLY". */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const toApiError = async (response: Response): Promise<ApiError> => {
  try {
    const data = await response.json();
    return new ApiError(
      data.message || data.error || `So'rov xatoligi (${response.status})`,
      response.status,
      typeof data.code === "string" ? data.code : undefined,
    );
  } catch {
    return new ApiError(`So'rov xatoligi (${response.status})`, response.status);
  }
};

// Backend qayta ishga tushirilganda ko'p so'rov bir vaqtda 401 qaytarsa, faqat bitta refresh chaqiruvi yuboriladi.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        const accessToken: string | undefined = data.accessToken ?? data.token;
        if (!accessToken) return null;
        tokenStorage.setTokens(accessToken, data.refreshToken);
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

export const apiRequest = async <T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { method = "GET", body, skipAuth = false, skipRefresh = false } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!skipAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    tokenStorage.clear();
    // Inside Telegram there is no login page: a reload signs in again from initData.
    if (isTelegram()) window.location.replace("/");
    else if (window.location.pathname !== "/login") window.location.href = "/login";
    throw new ApiError("Sessiya muddati tugagan", 401);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const apiGet = <T = unknown>(path: string) => apiRequest<T>(path);

export const apiPost = <T = unknown>(
  path: string,
  body?: unknown,
  options?: Partial<RequestOptions>,
) => apiRequest<T>(path, { ...options, method: "POST", body });

export const apiPatch = <T = unknown>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "PATCH", body });

export const apiPut = <T = unknown>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "PUT", body });

export const apiDelete =<T = unknown>(path: string) => apiRequest<T>(path, { method: "DELETE" });
