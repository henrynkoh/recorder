'use client'

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Local Storage key
const THEME_KEY = 'voice_recorder_theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  
  // Load theme from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check local storage first
      const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null
      
      if (storedTheme) {
        setTheme(storedTheme)
      } else {
        // If no theme in local storage, check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'dark' : 'light')
      }
    }
  }, [])
  
  // Update document class when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Save to local storage
      localStorage.setItem(THEME_KEY, theme)
      
      // Apply theme to document
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
} 