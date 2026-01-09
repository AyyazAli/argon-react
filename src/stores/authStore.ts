import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BusinessInfo } from '@/types'

interface AuthState {
  token: string | null
  expiresIn: string | null
  userId: string | null
  role: string | null
  business: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (data: {
    token: string
    expiresIn: number
    userId: string
    role: string
  }) => void
  setBusiness: (business: string) => void
  setBusinessInfo: (info: BusinessInfo) => void
  logout: () => void
  checkAuthExpiry: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresIn: null,
      userId: null,
      role: null,
      business: null,
      isAuthenticated: false,

      setAuth: (data) => {
        const expirationDate = new Date(
          Date.now() + data.expiresIn * 1000
        ).toISOString()

        set({
          token: data.token,
          expiresIn: expirationDate,
          userId: data.userId,
          role: data.role,
          isAuthenticated: true,
        })
      },

      setBusiness: (business) => {
        set({ business })
      },

      setBusinessInfo: (info) => {
        set({
          business: info.business,
          role: info.role,
        })
      },

      logout: () => {
        set({
          token: null,
          expiresIn: null,
          userId: null,
          role: null,
          business: null,
          isAuthenticated: false,
        })
      },

      checkAuthExpiry: () => {
        const { expiresIn, logout } = get()
        if (!expiresIn) return false

        const expirationDate = new Date(expiresIn)
        const now = new Date()

        if (expirationDate.getTime() <= now.getTime()) {
          logout()
          return false
        }

        return true
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        expiresIn: state.expiresIn,
        userId: state.userId,
        role: state.role,
        business: state.business,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

