/**
 * Utility functions for the DailyQ application
 */

// Format time in MM:SS format
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Format time in human readable format
export const formatTimeHuman = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  
  if (mins === 0) {
    return `${secs} second${secs !== 1 ? 's' : ''}`
  }
  
  if (secs === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }
  
  return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`
}

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return 'N/A'
  
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format date with time
export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (date) => {
  if (!date) return 'N/A'
  
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  
  return formatDate(d)
}

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// Get grade based on score
export const getGrade = (score) => {
  if (score >= 90) return { grade: 'A+', color: 'text-green-500', message: 'Excellent!' }
  if (score >= 80) return { grade: 'A', color: 'text-green-500', message: 'Great job!' }
  if (score >= 70) return { grade: 'B', color: 'text-blue-500', message: 'Good work!' }
  if (score >= 60) return { grade: 'C', color: 'text-yellow-500', message: 'Keep practicing!' }
  if (score >= 50) return { grade: 'D', color: 'text-orange-500', message: 'Needs improvement' }
  return { grade: 'F', color: 'text-red-500', message: 'Try again!' }
}

// Get streak message
export const getStreakMessage = (streak) => {
  if (streak === 0) return 'Start your streak today!'
  if (streak === 1) return 'Great start! Keep going!'
  if (streak < 7) return `${streak}-day streak! Building momentum!`
  if (streak < 30) return `${streak}-day streak! You're on fire! 🔥`
  if (streak < 100) return `${streak}-day streak! Incredible dedication! 🏆`
  return `${streak}-day streak! You're a legend! 👑`
}

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export const validatePassword = (password) => {
  const errors = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Get initials from name
export const getInitials = (name) => {
  if (!name) return 'U'
  
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Generate random color for avatar
export const getAvatarColor = (name) => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500'
  ]
  
  if (!name) return colors[0]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }
}

// Anti-cheat helpers
export const antiCheat = {
  // Disable right-click
  disableContextMenu: () => {
    document.addEventListener('contextmenu', (e) => e.preventDefault())
  },
  
  // Disable text selection
  disableSelection: () => {
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
  },
  
  // Disable keyboard shortcuts
  disableShortcuts: () => {
    document.addEventListener('keydown', (e) => {
      // Disable Ctrl+C, Ctrl+V, Ctrl+U, F12
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u')) ||
        e.key === 'F12'
      ) {
        e.preventDefault()
      }
    })
  },
  
  // Enable all (for non-test pages)
  enableAll: () => {
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }
}

/**
 * Production-safe logger - only logs in development mode
 */
export const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) console.log(...args)
  },
  warn: (...args) => {
    if (import.meta.env.DEV) console.warn(...args)
  },
  error: (...args) => {
    // Always log errors
    console.error(...args)
  },
  debug: (...args) => {
    if (import.meta.env.DEV) console.debug(...args)
  },
  info: (...args) => {
    if (import.meta.env.DEV) console.info(...args)
  }
}

export default {
  formatTime,
  formatTimeHuman,
  formatDate,
  formatDateTime,
  getRelativeTime,
  calculatePercentage,
  getGrade,
  getStreakMessage,
  isValidEmail,
  validatePassword,
  truncateText,
  getInitials,
  getAvatarColor,
  debounce,
  storage,
  antiCheat,
  logger
}
