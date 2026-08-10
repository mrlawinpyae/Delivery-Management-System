// src/store/useAuthStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserRole } from "@/types"

interface User {
  userId: string
  name: string
  role: UserRole
  image?: string
  img?: string
  phone?: string
  email?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (userData: User, token: string) => void
  logout: () => void
  updateUser: (partialUser: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, token) =>
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
    }),
    {
      name: "auth-storage", 
    }
  )
)
