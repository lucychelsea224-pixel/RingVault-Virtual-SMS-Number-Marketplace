'use client'
import { createContext, useContext, useState, useEffect } from 'react'
const ThemeCtx = createContext({ dark: true, toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true)
  useEffect(() => { document.body.classList.toggle('light', !dark) }, [dark])
  return <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>{children}</ThemeCtx.Provider>
}
