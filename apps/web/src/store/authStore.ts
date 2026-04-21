import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  setAuth: (accessToken: string, refreshToken: string, user: any) => void;
  clearAuth: () => void;
  setUser: (user: any) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      clearAuth: () => {
        localStorage.removeItem("accessToken");
        set({ accessToken: null, refreshToken: null, user: null });
      },
      setUser: (user) => set({ user }),
    }),
    { name: "puendoung-auth" }
  )
);
