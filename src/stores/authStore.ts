import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BusinessInfo } from '@/types'

interface AuthState {
  token: string | null
  expiresIn: string | null
  userId: string | null
  roles: string[]           // all roles the user has for the current business
  business: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (data: {
    token: string
    expiresIn: number
    userId: string
    role?: string      // fallback for when roles array isn't present
    roles?: string[]
  }) => void
  setBusiness: (business: string) => void
  setBusinessInfo: (info: BusinessInfo) => void
  logout: () => void
  checkAuthExpiry: () => boolean
  hasRole: (...check: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresIn: null,
      userId: null,
      roles: [],
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
          roles: data.roles?.length ? data.roles : (data.role ? [data.role] : []),
          isAuthenticated: true,
        })
      },

      setBusiness: (business) => {
        set({ business })
      },

      setBusinessInfo: (info) => {
        set({
          business: info.business,
          roles: info.roles?.length ? info.roles : (info.role ? [info.role] : []),
        })
      },

      logout: () => {
        set({
          token: null,
          expiresIn: null,
          userId: null,
          roles: [],
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

      // True if the user has ANY of the given roles
      hasRole: (...check) => {
        const { roles } = get()
        return check.some((r) => roles.includes(r))
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        expiresIn: state.expiresIn,
        userId: state.userId,
        roles: state.roles,
        business: state.business,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
