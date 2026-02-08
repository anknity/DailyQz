import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navbar, StatCard } from '../components'
import { useAuth } from '../context/AuthContext'
import { getStreakMessage } from '../utils/helpers'
import { 
  FiAward, 
  FiTarget, 
  FiTrendingUp, 
  FiZap,
  FiBookOpen,
  FiClock,
  FiPlay,
  FiChevronRight,
  FiCode,
  FiType,
  FiCalendar,
  FiHome,
  FiCpu
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Test Categories Configuration
const TEST_CATEGORIES = [
  {
    id: 'daily-practice',
    name: 'Practice',
    subtitle: 'Chapter-wise mock tests',
    icon: FiBookOpen,
    iconColor: 'text-blue-400',
    accentColor: 'from-blue-600/20 to-blue-800/10',
    borderColor: 'border-blue-500/20',
    glowColor: 'hover:shadow-blue-500/10',
    route: '/daily-practice',
    progress: { label: 'Progress', value: '65%', showBar: true, barPercent: 65, barColor: 'bg-blue-500' },
    subcategories: ['Web Dev', 'Data Science', 'Networking', 'GK', 'Sports', 'Aptitude', 'Reasoning', 'NEET']
  },
  {
    id: 'scheduled-exams',
    name: 'Scheduled Exams',
    subtitle: 'Live & upcoming tests',
    icon: FiCalendar,
    iconColor: 'text-emerald-400',
    accentColor: 'from-emerald-600/20 to-emerald-800/10',
    borderColor: 'border-emerald-500/20',
    glowColor: 'hover:shadow-emerald-500/10',
    route: '/exams',
    badge: 'Live',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
    meta: { label: 'Upcoming exams', value: 'View all' },
    subcategories: ['Live', 'Upcoming', 'Completed']
  },
  {
    id: 'schools',
    name: 'Schools & Colleges',
    subtitle: 'Class 1-12 Exams',
    icon: FiHome,
    iconColor: 'text-teal-400',
    accentColor: 'from-teal-600/20 to-teal-800/10',
    borderColor: 'border-teal-500/20',
    glowColor: 'hover:shadow-teal-500/10',
    route: '/schools',
    badge: 'New',
    badgeColor: 'bg-teal-500/20 text-teal-400',
    subcategories: ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'JEE', 'NEET']
  },
  {
    id: 'dsa-coding',
    name: 'DSA',
    subtitle: 'Data Structures & Algo',
    icon: FiCode,
    iconColor: 'text-violet-400',
    accentColor: 'from-violet-600/20 to-violet-800/10',
    borderColor: 'border-violet-500/20',
    glowColor: 'hover:shadow-violet-500/10',
    route: '/dsa',
    progress: { label: 'Solved', value: '142/500', showBar: false },
    subcategories: ['Arrays', 'Strings', 'Trees', 'Graphs', 'DP']
  },
  {
    id: 'competitive-exams',
    name: 'Competitive Exams',
    subtitle: 'Company & Govt Exams',
    icon: FiTarget,
    iconColor: 'text-orange-400',
    accentColor: 'from-orange-600/20 to-orange-800/10',
    borderColor: 'border-orange-500/20',
    glowColor: 'hover:shadow-orange-500/10',
    route: '/competitive-exams',
    badge: 'New',
    badgeColor: 'bg-orange-500/20 text-orange-400',
    subcategories: ['TCS', 'Infosys', 'SSC', 'Banking', 'Bihar Police']
  },
  {
    id: 'typing-test',
    name: 'Typing Speed',
    subtitle: 'Test your WPM now',
    icon: FiType,
    iconColor: 'text-cyan-400',
    accentColor: 'from-cyan-600/30 to-cyan-800/20',
    borderColor: 'border-cyan-500/30',
    glowColor: 'hover:shadow-cyan-500/10',
    highlighted: true,
    route: '/typing-test',
    stats: { best: { label: 'BEST', value: '72', unit: 'WPM' }, avg: { label: 'AVG', value: '65', unit: 'WPM' } },
    subcategories: ['Text', 'Code', 'JavaScript', 'Python']
  }
]

/**
 * Dashboard Page
 * Main landing page after login showing stats and test selection
 */
const Dashboard = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth()
  const navigate = useNavigate()
  const [liveExams, setLiveExams] = useState([])
  const [upcomingExams, setUpcomingExams] = useState([])
  const [examsLoading, setExamsLoading] = useState(true)

  // Refresh user profile only if not already loaded
  useEffect(() => {
    const loadProfile = async () => {
      if (!userProfile) {
        await refreshUserProfile()
      }
    }
    loadProfile()
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const token = currentUser ? await currentUser.getIdToken() : null
      const response = await fetch(`${API_URL}/exams/scheduled`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await response.json()

      if (data.success) {
        const now = new Date()
        const live = []
        const upcoming = []

        ;(data.data || []).forEach(exam => {
          const start = new Date(exam.startTime)
          const end = new Date(exam.endTime)

          if (now >= start && now <= end) {
            live.push({ ...exam, status: 'live' })
          } else if (now < start) {
            upcoming.push({ ...exam, status: 'upcoming' })
          }
        })

        // Sort upcoming by start time
        upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

        setLiveExams(live)
        setUpcomingExams(upcoming.slice(0, 3)) // Show max 3 upcoming
      }
    } catch (error) {
      // Silent fail
    } finally {
      setExamsLoading(false)
    }
  }

  const getTimeUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    if (diff <= 0) return 'Now'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300">
      <Navbar />
      
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Welcome section */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {getStreakMessage(userProfile?.streak || 0)}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FiZap className="w-6 h-6" />}
            label="Current Streak"
            value={`${userProfile?.streak || 0} days`}
            color="orange"
            delay={0.1}
          />
          <StatCard
            icon={<FiTarget className="w-6 h-6" />}
            label="Tests Taken"
            value={userProfile?.testsTaken || 0}
            color="blue"
            delay={0.2}
          />
          <StatCard
            icon={<FiTrendingUp className="w-6 h-6" />}
            label="Avg Score"
            value={`${userProfile?.avgScore || 0}%`}
            color="green"
            delay={0.3}
          />
          <StatCard
            icon={<FiAward className="w-6 h-6" />}
            label="Total Score"
            value={userProfile?.totalScore || 0}
            color="purple"
            delay={0.4}
          />
        </motion.div>

        {/* Live & Upcoming Exams Section */}
        {!examsLoading && (liveExams.length > 0 || upcomingExams.length > 0) && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <FiClock className="w-4 h-4 text-purple-400" />
                </div>
                Live & Upcoming Exams
              </h2>
              <Link to="/exams" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-400 flex items-center gap-1 transition-colors">
                View All <FiChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Live Exams */}
              {liveExams.map(exam => (
                <motion.div
                  key={exam.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/exam/${exam.id}/waiting-room`)}
                  className="relative bg-[#0f1923] dark:bg-[#0f1923] rounded-2xl p-5 cursor-pointer border border-green-500/30 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 overflow-hidden group"
                >
                  {/* Glowing background accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />
                  
                  <div className="relative z-10">
                    {/* Header with icon + badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <FiPlay className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        LIVE
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-white text-lg mb-1">{exam.title}</h3>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">{exam.questionCount} Qs</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span>{exam.durationMinutes} min</span>
                      {exam.isProctored && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-600" />
                          <span className="text-yellow-400">Proctored</span>
                        </>
                      )}
                    </div>
                    
                    {/* Action button */}
                    <button className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-600/20">
                      <FiPlay className="w-4 h-4" /> Join Now
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Upcoming Exams */}
              {upcomingExams.map(exam => (
                <motion.div
                  key={exam.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/exam/${exam.id}/waiting-room`)}
                  className="relative bg-[#0f1923] dark:bg-[#0f1923] rounded-2xl p-5 cursor-pointer border border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden group"
                >
                  {/* Glowing background accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                  
                  <div className="relative z-10">
                    {/* Header with icon + badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <FiCalendar className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Starts in</p>
                        <p className="text-lg font-bold text-white">{getTimeUntil(exam.startTime)}</p>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-white text-lg mb-1">{exam.title}</h3>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">{exam.questionCount} Qs</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span>{exam.durationMinutes} min</span>
                      {exam.isProctored && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-600" />
                          <span className="text-yellow-400">Proctored</span>
                        </>
                      )}
                    </div>
                    
                    {/* Upcoming tag */}
                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium">
                      UPCOMING
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Exam Categories Grid */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <FiCpu className="w-4 h-4 text-primary-400" />
            </div>
            Exam Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEST_CATEGORIES.map((category, index) => {
              const IconComponent = category.icon
              return (
                <Link key={category.id} to={category.route}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                    className={`relative bg-[#0f1923] dark:bg-[#0f1923] rounded-2xl p-5 cursor-pointer border ${
                      category.highlighted ? 'border-cyan-500/40' : category.borderColor
                    } hover:shadow-2xl ${category.glowColor} transition-all duration-300 overflow-hidden group h-full`}
                  >
                    {/* Subtle gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.accentColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                    {/* Decorative glow orb */}
                    <div className={`absolute -top-10 -right-10 w-36 h-36 ${category.iconColor.replace('text-', 'bg-').replace('400', '500')}/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500`} />

                    <div className="relative z-10">
                      {/* Top row: Icon + Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-11 h-11 rounded-xl bg-gray-800/80 flex items-center justify-center ${category.iconColor} ring-1 ring-white/5`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {category.badge && (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${category.badgeColor || 'bg-white/10 text-gray-300'}`}>
                            {category.badge}
                          </span>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="font-bold text-white text-[17px] mb-0.5 tracking-tight">{category.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">{category.subtitle}</p>

                      {/* Bottom section - context-specific content */}
                      {category.progress && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-gray-500 font-medium text-xs">{category.progress.label}</span>
                            <span className="text-white font-bold text-sm">{category.progress.value}</span>
                          </div>
                          {category.progress.showBar && (
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${category.progress.barPercent}%` }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                className={`h-full ${category.progress.barColor} rounded-full`}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {category.meta && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">{category.meta.label}</span>
                          <span className="text-gray-400 text-xs">{category.meta.value}</span>
                        </div>
                      )}

                      {category.stats && (
                        <div className="flex items-center gap-5">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium block">{category.stats.best.label}</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-extrabold text-white">{category.stats.best.value}</span>
                              <span className="text-xs text-gray-500 font-medium">{category.stats.best.unit}</span>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-gray-700" />
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium block">{category.stats.avg.label}</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-extrabold text-white">{category.stats.avg.value}</span>
                              <span className="text-xs text-gray-500 font-medium">{category.stats.avg.unit}</span>
                            </div>
                          </div>
                          <div className="ml-auto">
                            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                              <FiPlay className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}

                      {!category.progress && !category.meta && !category.stats && (
                        <div className="flex flex-wrap gap-1.5">
                          {category.subcategories.slice(0, 3).map(sub => (
                            <span key={sub} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[11px] text-gray-400">
                              {sub}
                            </span>
                          ))}
                          {category.subcategories.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[11px] text-gray-400">
                              +{category.subcategories.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      </motion.main>
    </div>
  )
}

export default Dashboard
