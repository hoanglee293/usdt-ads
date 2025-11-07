import { create } from "zustand"
import { LoginUser } from "@/services/AuthService"

interface AuthState {
  isAuth: boolean
  user: LoginUser | null
  login: (user?: LoginUser) => void
  logout: () => void
}

// Helper functions for localStorage
const STORAGE_KEY = "auth_state"

const getStoredAuthState = (): { isAuth: boolean; user: LoginUser | null } => {
  if (typeof window === "undefined") {
    return { isAuth: false, user: null }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        isAuth: parsed.isAuth === true,
        user: parsed.user || null,
      }
    }
  } catch (error) {
    console.error("Error reading auth state from localStorage:", error)
  }

  return { isAuth: false, user: null }
}

const saveAuthState = (isAuth: boolean, user: LoginUser | null) => {
  if (typeof window === "undefined") return

  try {
    const stateToSave = { isAuth, user }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.error("Error saving auth state to localStorage:", error)
  }
}

const clearAuthState = () => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing auth state from localStorage:", error)
  }
}

// Initialize from localStorage
const initialState = getStoredAuthState()

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: initialState.isAuth,
  user: initialState.user,
  login: (user?: LoginUser) => {
    const authState = { isAuth: true, user: user || null }
    saveAuthState(authState.isAuth, authState.user)
    set(authState)
  },
  logout: () => {
    clearAuthState()
    set({ isAuth: false, user: null })
  },
}))

// Hook để sử dụng trong components
export const useAuth = () => useAuthStore()