// src/types/user.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
  phone?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}
