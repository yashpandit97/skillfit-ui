import { useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'

/** Keeps html class/data-theme in sync with Zustand theme for Chakra semantic tokens. */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.style.colorScheme = theme
  }, [theme])

  return null
}
