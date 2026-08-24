import { create } from "zustand";
import { User } from "@/lib/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // starts true — we don't know auth state until the initial /me check resolves
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));