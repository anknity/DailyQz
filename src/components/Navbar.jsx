import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getInitials, getAvatarColor } from '../utils/helpers'
import { 
  FiHome, 
  FiAward, 
  FiUser, 
  FiLogOut, 
  FiSun, 
  FiMoon,
  FiMenu,
  FiX,
  FiFileText,
  FiSettings
} from 'react-icons/fi'
import { useState } from 'react'

// Admin email for access control
const ADMIN_EMAIL = 'nityanand666.nk@gmail.com'

/**
 * Navbar Component
 * Main navigation bar with user info and theme toggle
 */
const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check if current user is admin
  const isAdmin = currentUser?.email === ADMIN_EMAIL

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Base nav links for all users
  const baseNavLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/exam', label: 'Exam', icon: FiFileText },
    { path: '/leaderboard', label: 'Leaderboard', icon: FiAward },
    { path: '/profile', label: 'Profile', icon: FiUser },
  ]

  // Add Admin link only for admin users
  const navLinks = isAdmin 
    ? [...baseNavLinks, { path: '/admin', label: 'Admin', icon: FiSettings }]
    : baseNavLinks

  const isActive = (path) => location.pathname === path

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-dark-200/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <img 
                src="/DailiQ.png" 
                alt="DailyQ Logo" 
                className="h-[50px] w-auto"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-100'
                }`}
              >
                <link.icon className="w-4 h-4" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Streak badge */}
            {userProfile?.streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full"
              >
                <span className="fire-animation">🔥</span>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {userProfile.streak}
                </span>
              </motion.div>
            )}

            {/* User avatar */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                      userProfile?.name
                    )}`}
                  >
                    {getInitials(userProfile?.name)}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {userProfile?.name?.split(' ')[0] || 'User'}
                </span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
              >
                <FiLogOut className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400"
            >
              {isMobileMenuOpen ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiMenu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-gray-200 dark:border-dark-100"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-100'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="px-4 py-3 rounded-lg flex items-center gap-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <FiLogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar
