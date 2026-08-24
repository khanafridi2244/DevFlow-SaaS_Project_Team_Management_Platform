import { api, ApiResponse } from "./api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Every function here maps 1:1 to a real backend route from
// auth.routes.js — nothing invented, nothing guessed.

export async function register(payload: RegisterPayload) {
  const res = await api.post<ApiResponse<{ user: User }>>("/auth/register", payload);
  return res.data.data.user;
}

export async function login(payload: LoginPayload) {
  const res = await api.post<ApiResponse<{ user: User }>>("/auth/login", payload);
  return res.data.data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function getCurrentUser() {
  const res = await api.get<ApiResponse<{ user: User }>>("/auth/me");
  return res.data.data.user;
}

export async function forgotPassword(email: string) {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string) {
  await api.post("/auth/reset-password", { token, newPassword });
}