import { useState, useEffect } from 'react'
import { getSetting, setSetting } from '../utils/storage'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    getSetting<Theme>('theme').then((saved) => {
      if (saved) {
        setThemeState(saved)
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setThemeState(prefersDark ? 'dark' : 'light')
      }
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    await setSetting('theme', newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return { theme, setTheme, toggleTheme }
}
