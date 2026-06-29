import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    { name: 'auth' }
  )
)

/** Wait for persisted auth state before routing decisions. */
export function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) return Promise.resolve()
  return new Promise((resolve) => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}

const AUTH_BOOT_ERROR_KEY = 'authBootError'

export function setAuthBootError(message: string) {
  sessionStorage.setItem(AUTH_BOOT_ERROR_KEY, message)
}

export function consumeAuthBootError(): string | null {
  const message = sessionStorage.getItem(AUTH_BOOT_ERROR_KEY)
  if (message) sessionStorage.removeItem(AUTH_BOOT_ERROR_KEY)
  return message
}
