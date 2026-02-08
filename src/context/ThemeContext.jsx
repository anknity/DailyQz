import { createContext, useContext, useState, useEffect } from 'react'

export const ThemeContext = createContext()

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  // Permanent dark mode - always dark
  const [theme] = useState('dark')

  // Apply dark theme to document
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.add('dark')
    localStorage.setItem('dailyq-theme', 'dark')
  }, [])

  // Toggle theme (no-op, always dark)
  const toggleTheme = () => {}

  // Set specific theme (no-op, always dark)
  const setSpecificTheme = () => {}

  const value = {
    theme: 'dark',
    isDark: true,
    toggleTheme,
    setTheme: setSpecificTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
