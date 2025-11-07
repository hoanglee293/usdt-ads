import { create } from "zustand"
import { LoginUser } from "@/services/AuthService"

interface AuthState {
  isAuth: boolean
  user: LoginUser | null
  login: (user?: LoginUser) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isAuth: true, // Default state: not logged in
  user: null,
  login: (user?: LoginUser) => set({ isAuth: true, user: user || null }),
  logout: () => set({ isAuth: false, user: null }),
}))