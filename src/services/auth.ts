import { api } from "@/lib/api";
import type { AuthSession, User } from "@/types/auth";

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<User>("/auth/register", payload),

  login: (payload: LoginPayload) => api.post<User>("/auth/login", payload),

  adminLogin: (payload: LoginPayload) =>
    api.post<User>("/admin/auth/login", payload),

  logout: () => api.post<null>("/auth/logout"),

  adminLogout: () => api.post<null>("/admin/auth/logout"),

  me: () => api.get<User>("/me"),

  updateProfile: (payload: Partial<Pick<User, "name" | "email" | "phone">>) =>
    api.patch<User>("/me", payload),

  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.patch<null>("/me/password", payload),

  forgotPassword: (email: string) =>
    api.post<null>("/auth/forgot-password", { email }),

  resetPassword: (payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => api.post<null>("/auth/reset-password", payload),

  resendVerification: () => api.post<null>("/auth/email/resend"),

  sessions: () => api.get<{ items: AuthSession[] }>("/me/sessions"),

  revokeSession: (id: string) => api.delete<null>(`/me/sessions/${id}`),
};
