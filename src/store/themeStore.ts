import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.style.colorScheme = theme
  }
}

export const useThemeStore = create<{ theme: Theme; setTheme: (t: Theme) => void }>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
    }),
    { name: 'skillfit-theme', onRehydrateStorage: () => (state) => state && applyTheme(state.theme) }
  )
)

if (typeof document !== 'undefined') {
  const stored = localStorage.getItem('skillfit-theme')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { theme?: Theme } }
      const theme = parsed?.state?.theme
      if (theme === 'light' || theme === 'dark') applyTheme(theme)
    } catch {}
  }
}
