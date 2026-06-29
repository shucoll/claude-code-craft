import { createContext, useCallback, useContext, useLayoutEffect, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storageKeys'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setStoredTheme] = useLocalStorage<Theme>(STORAGE_KEYS.theme, getSystemTheme())

  // Layout effect (not useEffect) so the `dark` class is applied before the
  // browser paints, avoiding a flash of the wrong theme on first render.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(
    () => setStoredTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [setStoredTheme],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme: setStoredTheme, toggleTheme }),
    [theme, setStoredTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
