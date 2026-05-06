import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import api from '../lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  password2: string
  first_name: string
  last_name: string
  level?: string
  language?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login/', { email, password })
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        set({ user: data.user, isAuthenticated: true })
      },

      register: async (formData) => {
        const { data } = await api.post('/auth/register/', formData)
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        set({ user: data.user, isAuthenticated: true })
      },

      logout: async () => {
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          try { await api.post('/auth/logout/', { refresh }) } catch {}
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        const { data } = await api.get('/auth/me/')
        set({ user: data, isAuthenticated: true })
      },

      updateProfile: async (profileData) => {
        const { data } = await api.patch('/auth/me/', profileData)
        set({ user: data })
      },
    }),
    { name: 'auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
)
