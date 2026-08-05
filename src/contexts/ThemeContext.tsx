import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber'

type ThemeMode = 'light' | 'dark'

interface ThemeState {
  color: ThemeColor
  mode: ThemeMode
  setColor: (c: ThemeColor) => void
  toggleMode: () => void
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeState | null>(null)

export const themeColors: { id: ThemeColor; label: string; swatch: string }[] = [
  { id: 'indigo',  label: 'Indigo',  swatch: '#6670F5' },
  { id: 'emerald', label: 'Emerald', swatch: '#10B981' },
  { id: 'rose',    label: 'Rose',    swatch: '#E11D48' },
  { id: 'amber',   label: 'Amber',   swatch: '#D97706' },
]

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>(() => {
    return (localStorage.getItem('linkit-theme-color') as ThemeColor) || 'indigo'
  })
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('linkit-theme-mode') as ThemeMode) || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('linkit-theme-mode', mode)
  }, [mode])

  useEffect(() => {
    const root = document.documentElement
    if (color === 'indigo') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', color)
    localStorage.setItem('linkit-theme-color', color)
  }, [color])

  function setColor(c: ThemeColor) { setColorState(c) }
  function toggleMode() { setMode(m => m === 'dark' ? 'light' : 'dark') }

  return (
    <ThemeContext.Provider value={{ color, mode, setColor, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeColor() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeColor must be used within ThemeProvider')
  return ctx
}
