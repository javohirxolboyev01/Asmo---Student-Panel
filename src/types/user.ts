// src/types/user.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "teacher" | "admin";
  avatar: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
