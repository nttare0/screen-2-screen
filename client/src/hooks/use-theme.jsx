import { createContext, useContext, useEffect, useState } from 'react'
const storageKey = 's2s-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')
function storedTheme() {
  try {
    const value = localStorage.getItem(storageKey)
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'dark'
  } catch {
    return 'dark'
  }
}
const ThemeContext = createContext(null)
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(storedTheme)
  const [systemDark, setSystemDark] = useState(() => media().matches)
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
  useEffect(() => {
    const query = media()
    const update = () => setSystemDark(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.style.colorScheme = resolvedTheme
    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // The theme still works when storage is unavailable.
    }
  }, [theme, resolvedTheme])
  return <ThemeContext value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext>
}
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme requires ThemeProvider')
  return context
}
