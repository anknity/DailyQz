import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar, LoadingSpinner } from '../components'
import { LeaderboardService } from '../services/firestoreService'
import { useAuth } from '../context/AuthContext'
import { getInitials, getAvatarColor } from '../utils/helpers'
import { FiAward, FiTrendingUp, FiTrendingDown, FiMinus, FiTarget, FiZap, FiFilter, FiChevronDown, FiBookOpen, FiFileText, FiType, FiCode, FiSearch, FiBook } from 'react-icons/fi'
import { CATEGORIES } from '../context/TestContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Leaderboard Page
 * Unified leaderboard with 6 modes: Practice, Exam, DSA, Scheduled, Competitive, Typing
 * With category and subcategory filters for Practice mode
 * OLD backend logic + NEW UI design
 */
const Leaderboard = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('all-time')
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mode toggle: 'practice', 'exam', 'dsa', 'scheduled', 'competitive', 'typing'
  const [mode, setMode] = useState('practice')
  
  // Category filter states
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')

  // Typing-specific filters
  const [typingDifficulty, setTypingDifficulty] = useState('all')
  const [typingType, setTypingType] = useState('all')

  // School-specific filters
  const [schoolClass, setSchoolClass] = useState('all')
  const [schoolSubject, setSchoolSubject] = useState('all')

  const modes = [
    { id: 'practice', label: 'Practice', icon: <FiBookOpen className="w-5 h-5" /> },
    { id: 'exam', label: 'Exams', icon: <FiFileText className="w-5 h-5" /> },
    { id: 'dsa', label: 'DSA', icon: <FiCode className="w-5 h-5" /> },
    { id: 'scheduled', label: 'Scheduled', icon: <span className="text-lg">📅</span> },
    { id: 'competitive', label: 'Competitive', icon: <FiTarget className="w-5 h-5" /> },
    { id: 'school', label: 'School', icon: <FiBook className="w-5 h-5" /> },
    { id: 'typing', label: 'Typing', icon: <FiType className="w-5 h-5" /> }
  ]

  // Get available subcategories for selected category
  const getSubcategories = () => {
    if (selectedCategory === 'all') return []
    const category = CATEGORIES.find(c => c.id === selectedCategory)
    return category?.subcategories || []
  }

  // Refresh user profile on mount (exact old behavior - no guard)
  useEffect(() => {
    refreshUserProfile()
  }, [])

  // Fetch leaderboard on filter changes (exact old behavior - no currentUser dependency)
  useEffect(() => {
    fetchLeaderboard()
  }, [activeTab, selectedCategory, selectedSubcategory, mode, typingDifficulty, typingType, schoolClass, schoolSubject])

  // ====================================================================
  // EXACT OLD fetchLeaderboard - preserves original API response fields
  // ====================================================================
  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let data = []
      const token = await currentUser.getIdToken()
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      
      if (mode === 'exam') {
        // Fetch exam leaderboard
        let url = `${API_URL}/exam/leaderboard`
        if (selectedCategory !== 'all') {
          url += `?category=${selectedCategory}`
        }
        
        const response = await fetch(url, { headers })
        const result = await response.json()
        
        if (result.success) {
          data = (result.data || []).map((entry) => ({
            ...entry,
            uid: entry.id,
            testsCompleted: entry.examsTaken || 0
          }))
        }
      } else if (mode === 'scheduled') {
        // Fetch scheduled exam leaderboard
        const response = await fetch(`${API_URL}/exams/scheduled-leaderboard/overall`, { headers })
        const result = await response.json()
        
        if (result.success) {
          data = (result.data || []).map((entry) => ({
            ...entry,
            uid: entry.id || entry.uid,
            name: entry.name || entry.displayName || 'Anonymous',
            displayName: entry.displayName || entry.name || 'Anonymous',
            totalScore: entry.bestScore || 0,
            bestScore: entry.bestScore || 0,
            avgScore: entry.avgScore || 0,
            testsCompleted: entry.examsCount || entry.testsCompleted || 0,
            testsTaken: entry.examsCount || 0,
            rank: entry.rank
          }))
        }
      } else if (mode === 'dsa') {
        // Fetch DSA leaderboard from the enriched endpoint
        const response = await fetch(`${API_URL}/v2/dsa/leaderboard`, { headers })
        const result = await response.json()
        
        if (result.success) {
          data = (result.data || []).map((entry) => ({
            ...entry,
            uid: entry.id || entry.uid,
            name: entry.name || entry.displayName || 'Anonymous',
            displayName: entry.displayName || entry.name || 'Anonymous'
          }))
        }
      } else if (mode === 'competitive') {
        // Fetch competitive exam leaderboard
        let url = `${API_URL}/v2/competitive/leaderboard`
        const params = new URLSearchParams()
        if (selectedCategory !== 'all') params.append('category', selectedCategory)
        if (params.toString()) url += `?${params.toString()}`
        
        const response = await fetch(url, { headers })
        const result = await response.json()
        
        if (result.success) {
          const entries = result.data?.leaderboard || result.data || []
          data = entries.map((entry) => ({
            ...entry,
            uid: entry.id,
            name: entry.name || 'Anonymous',
            displayName: entry.name || 'Anonymous',
            bestScore: entry.bestScore || entry.score || 0,
            avgScore: entry.totalQuestions > 0 ? Math.round((entry.correctAnswers / entry.totalQuestions) * 100) : 0,
            testsCompleted: 1
          }))
        }
      } else if (mode === 'school') {
        // Fetch school/college leaderboard
        let url = `${API_URL.replace('/api', '')}/api/v2/school-exams/leaderboard`
        const params = new URLSearchParams()
        if (schoolClass !== 'all') params.append('classLevel', schoolClass)
        if (schoolSubject !== 'all') params.append('subject', schoolSubject)
        if (params.toString()) url += `?${params.toString()}`
        
        const response = await fetch(url, { headers })
        const result = await response.json()
        
        if (result.success) {
          const entries = result.data?.leaderboard || result.data || []
          data = entries.map((entry) => ({
            ...entry,
            uid: entry.id,
            name: entry.name || entry.displayName || 'Anonymous',
            displayName: entry.displayName || entry.name || 'Anonymous',
            bestScore: entry.bestScore || entry.score || 0,
            avgScore: entry.avgScore || 0,
            testsCompleted: entry.testsCompleted || 0
          }))
        }
      } else if (mode === 'typing') {
        // Fetch typing test leaderboard
        let url = `${API_URL}/v2/typing/leaderboard`
        const params = new URLSearchParams()
        if (typingDifficulty !== 'all') params.append('difficulty', typingDifficulty)
        if (typingType !== 'all') params.append('type', typingType)
        if (params.toString()) url += `?${params.toString()}`
        
        const response = await fetch(url, { headers })
        const result = await response.json()
        
        if (result.success) {
          data = (result.data || []).map((entry) => ({
            ...entry,
            uid: entry.id || entry.uid,
            name: entry.name || entry.displayName || 'Anonymous',
            displayName: entry.displayName || entry.name || 'Anonymous'
          }))
        }
      } else {
        // Fetch practice test leaderboard
        if (selectedCategory !== 'all') {
          let url = `${API_URL}/leaderboard/by-category?category=${selectedCategory}&period=${activeTab}`
          if (selectedSubcategory !== 'all') {
            url += `&subcategory=${selectedSubcategory}`
          }
          
          const response = await fetch(url, { headers })
          const result = await response.json()
          
          if (result.success) {
            data = result.data.map((entry, idx) => ({
              ...entry,
              rank: idx + 1
            }))
          }
        } else {
          switch (activeTab) {
            case 'daily':
              data = await LeaderboardService.getDailyLeaderboard(20)
              break
            case 'weekly':
              data = await LeaderboardService.getWeeklyLeaderboard(20)
              break
            case 'all-time':
            default:
              data = await LeaderboardService.getAllTimeLeaderboard(20)
              break
          }
        }
      }
      
      // Find user's rank (exact old logic - uses data[userIndex].rank)
      if (currentUser) {
        const userIndex = data.findIndex(entry => 
          entry.uid === currentUser.uid || entry.id === currentUser.uid
        )
        if (userIndex !== -1) {
          setUserRank(data[userIndex].rank || userIndex + 1)
        } else {
          setUserRank(null)
        }
      }
      
      setLeaderboard(data)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory('all')
  }

  // ====================================================================
  // EXACT OLD getColumnHeaders - dynamic column headers based on mode
  // ====================================================================
  const getColumnHeaders = () => {
    switch (mode) {
      case 'typing':
        return { col1: 'WPM', col2: 'Accuracy', col3: 'Tests' }
      case 'dsa':
        return { col1: 'Score', col2: 'Solved', col3: 'Submissions' }
      case 'competitive':
        return { col1: 'Best', col2: 'Correct', col3: 'Accuracy' }
      case 'school':
        return { col1: 'Best', col2: 'Tests', col3: 'Avg' }
      case 'exam':
      case 'scheduled':
        return { col1: 'Best', col2: 'Exams', col3: 'Avg' }
      default:
        return { col1: 'Score', col2: 'Tests', col3: 'Streak' }
    }
  }

  // ====================================================================
  // EXACT OLD getRowData - mode-specific row display (restyled for dark UI)
  // ====================================================================
  const getRowData = (user) => {
    switch (mode) {
      case 'typing':
        return {
          col1: <span className="font-bold text-cyan-400">{user.wpm || user.bestWpm || 0} <span className="text-xs font-normal">WPM</span></span>,
          col2: <span className="text-[#90adcb]">{user.accuracy || 0}%</span>,
          col3: <span className="text-[#90adcb]">{user.testsCompleted || 0}</span>,
          subtitle: `Avg: ${user.avgWpm || 0} WPM`,
          mainScore: user.wpm || user.bestWpm || 0
        }
      case 'dsa':
        return {
          col1: <span className="font-bold text-green-400">{user.score || user.bestScore || 0}</span>,
          col2: (
            <span className="text-[#90adcb] text-xs">
              {user.problemsSolved || 0}
              <span className="hidden sm:inline"> ({user.easy || 0}E/{user.medium || 0}M/{user.hard || 0}H)</span>
            </span>
          ),
          col3: <span className="text-[#90adcb]">{user.totalSubmissions || user.testsCompleted || 0}</span>,
          subtitle: `${user.problemsSolved || 0} problems solved`,
          mainScore: user.score || user.bestScore || 0
        }
      case 'competitive':
        return {
          col1: <span className={`font-bold ${(user.bestScore || 0) >= 70 ? 'text-green-400' : 'text-white'}`}>{user.bestScore || user.score || 0}</span>,
          col2: <span className="text-[#90adcb]">{user.correctAnswers || 0}/{user.totalQuestions || 0}</span>,
          col3: <span className="text-[#90adcb] font-medium">{user.avgScore || 0}%</span>,
          subtitle: user.category ? `Category: ${user.category}` : `Accuracy: ${user.avgScore || 0}%`,
          mainScore: user.bestScore || user.score || 0
        }
      case 'school':
        return {
          col1: <span className={`font-bold ${(user.bestScore || 0) >= 70 ? 'text-green-400' : 'text-white'}`}>{user.bestScore || user.score || 0}%</span>,
          col2: <span className="text-[#90adcb]">{user.testsCompleted || 0}</span>,
          col3: <span className="text-[#90adcb] font-medium">{user.avgScore || 0}%</span>,
          subtitle: user.classLevel ? `Class ${user.classLevel} • ${user.subject || ''}` : `Avg: ${user.avgScore || 0}%`,
          mainScore: user.bestScore || user.score || 0
        }
      case 'exam':
      case 'scheduled':
        return {
          col1: <span className={`font-bold ${(user.bestScore || user.score || 0) >= 70 ? 'text-green-400' : 'text-white'}`}>{user.bestScore || user.score || 0}%</span>,
          col2: <span className="text-[#90adcb]">{user.examsCount || user.testsCompleted || 0}</span>,
          col3: <span className="text-[#90adcb] font-medium">{user.avgScore || 0}%</span>,
          subtitle: `Avg: ${user.avgScore || 0}%`,
          mainScore: user.bestScore || user.score || 0
        }
      default:
        return {
          col1: <span className="font-bold text-white">{user.totalScore || 0}</span>,
          col2: <span className="text-[#90adcb]">{user.testsTaken || 0}</span>,
          col3: (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-900/30 rounded-full text-orange-400 text-sm font-medium">
              🔥 {user.streak || 0}
            </span>
          ),
          subtitle: `Avg: ${user.avgScore || 0}%`,
          mainScore: user.totalScore || user.xp || 0
        }
    }
  }

  // Get score for podium display based on mode
  const getPodiumScore = (user) => {
    switch (mode) {
      case 'typing': return user.wpm || user.bestWpm || 0
      case 'dsa': return user.score || user.bestScore || 0
      case 'competitive': return user.bestScore || user.score || 0
      case 'school': return user.bestScore || user.score || 0
      case 'exam':
      case 'scheduled': return user.bestScore || user.score || 0
      default: return user.totalScore || user.xp || user.score || 0
    }
  }

  // Get podium score label based on mode
  const getPodiumLabel = () => {
    switch (mode) {
      case 'typing': return 'WPM'
      case 'dsa': return 'DSA Score'
      case 'competitive': return 'Best Score'
      case 'school': return 'Best Score'
      case 'exam':
      case 'scheduled': return 'Best Score'
      default: return 'XP Points'
    }
  }

  // Stats cards based on mode (from old version)
  const getStatsCards = () => {
    switch (mode) {
      case 'typing':
        return [
          { icon: <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-cyan-400" />, title: 'Words Per Minute', desc: 'Highest typing speed achieved' },
          { icon: <FiTarget className="w-8 h-8 mx-auto mb-2 text-green-400" />, title: 'Accuracy', desc: 'Typing precision percentage' },
          { icon: <FiZap className="w-8 h-8 mx-auto mb-2 text-orange-400" />, title: 'Tests Taken', desc: 'Total typing tests completed' }
        ]
      case 'dsa':
        return [
          { icon: <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />, title: 'DSA Score', desc: 'Based on problems solved & difficulty' },
          { icon: <FiTarget className="w-8 h-8 mx-auto mb-2 text-blue-400" />, title: 'Problems Solved', desc: 'Easy, Medium, Hard breakdown' },
          { icon: <FiZap className="w-8 h-8 mx-auto mb-2 text-purple-400" />, title: 'Submissions', desc: 'Total accepted solutions' }
        ]
      case 'competitive':
        return [
          { icon: <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-red-400" />, title: 'Best Score', desc: 'Highest score in competitive exams' },
          { icon: <FiTarget className="w-8 h-8 mx-auto mb-2 text-green-400" />, title: 'Correct Answers', desc: 'Questions answered correctly' },
          { icon: <FiZap className="w-8 h-8 mx-auto mb-2 text-orange-400" />, title: 'Accuracy', desc: 'Overall answer accuracy' }
        ]
      case 'school':
        return [
          { icon: <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-400" />, title: 'Best Score', desc: 'Highest school exam score' },
          { icon: <FiTarget className="w-8 h-8 mx-auto mb-2 text-green-400" />, title: 'Tests Taken', desc: 'Total school tests completed' },
          { icon: <FiZap className="w-8 h-8 mx-auto mb-2 text-blue-400" />, title: 'Average Score', desc: 'Average across all school tests' }
        ]
      case 'exam':
      case 'scheduled':
        return [
          { icon: <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />, title: 'Best Score', desc: 'Highest exam score achieved' },
          { icon: <FiTarget className="w-8 h-8 mx-auto mb-2 text-green-400" />, title: 'Average Score', desc: 'Average across all exams' },
          { icon: <FiZap className="w-8 h-8 mx-auto mb-2 text-orange-400" />, title: 'Exams Taken', desc: 'Total completed exams' }
        ]
      default:
        return [
          { icon: <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />, title: 'Total Score', desc: 'Sum of all test scores' },
          { icon: <FiTarget className="w-8 h-8 mx-auto mb-2 text-green-400" />, title: 'Average Score', desc: 'Used as secondary ranking' },
          { icon: <FiZap className="w-8 h-8 mx-auto mb-2 text-orange-400" />, title: 'Daily Streak', desc: 'Consecutive days of tests' }
        ]
    }
  }

  const columnHeaders = getColumnHeaders()
  const statsCards = getStatsCards()

  // Filter leaderboard by search
  const filteredLeaderboard = leaderboard.filter(user => {
    if (!searchQuery) return true
    const name = user.name || user.displayName || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Get top 3 for podium
  const topThree = filteredLeaderboard.slice(0, 3)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101922]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101922] pb-32">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center w-full px-4 sm:px-8 py-8 max-w-[1200px] mx-auto">
        {/* Page Header & Time Period Filters */}
        <div className="w-full mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Global Leaderboard
              </h1>
              <p className="text-[#90adcb] text-base font-normal">
                Compete with the best learners worldwide.
              </p>
              {userRank && (
                <p className="text-sm font-medium text-[#0d7ff2]">
                  Your Rank: #{userRank}
                </p>
              )}
            </div>
            <div className="flex bg-[#223649] p-1 rounded-xl">
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'all-time', label: 'All-time' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                      : 'text-[#90adcb] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Tab Navigation */}
          <div className="border-b border-[#314d68] w-full flex gap-8 overflow-x-auto pb-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative pb-4 px-2 font-bold text-sm flex items-center gap-2 group transition-colors whitespace-nowrap ${
                  mode === m.id ? 'text-[#0d7ff2]' : 'text-[#90adcb] hover:text-white'
                }`}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${
                    mode === m.id ? 'bg-[#0d7ff2]' : 'bg-transparent group-hover:bg-[#314d68]'
                  }`}
                ></span>
              </button>
            ))}
          </div>
        </div>

        {/* Typing-specific Filters */}
        {mode === 'typing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full flex flex-wrap justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#90adcb]">Difficulty:</span>
              <div className="flex gap-1">
                {['all', 'easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTypingDifficulty(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      typingDifficulty === d
                        ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                        : 'bg-[#223649] text-[#90adcb] hover:text-white hover:bg-[#314d68]'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#90adcb]">Type:</span>
              <div className="flex gap-1">
                {['all', 'text', 'code'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypingType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      typingType === t
                        ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                        : 'bg-[#223649] text-[#90adcb] hover:text-white hover:bg-[#314d68]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* School-specific Filters */}
        {mode === 'school' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full flex flex-wrap justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#90adcb]">Class:</span>
              <div className="flex gap-1 flex-wrap">
                {['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSchoolClass(c); setSchoolSubject('all') }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      schoolClass === c
                        ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                        : 'bg-[#223649] text-[#90adcb] hover:text-white hover:bg-[#314d68]'
                    }`}
                  >
                    {c === 'all' ? 'All' : c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#90adcb]">Subject:</span>
              <div className="flex gap-1 flex-wrap">
                {['all', 'Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Computer Science', 'Hindi'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSchoolSubject(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      schoolSubject === s
                        ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                        : 'bg-[#223649] text-[#90adcb] hover:text-white hover:bg-[#314d68]'
                    }`}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Category Filter Toggle - Show for practice, exam, competitive */}
        {(mode === 'practice' || mode === 'exam' || mode === 'competitive') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full mb-8"
          >
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mx-auto flex items-center gap-2 px-4 py-2 bg-[#223649] rounded-lg text-[#90adcb] hover:bg-[#314d68] hover:text-white transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              Filter by Category
              <FiChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-[#16202a] border border-[#223649] rounded-xl p-6"
                >
                  {/* Category Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#90adcb] mb-2">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCategoryChange('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedCategory === 'all'
                            ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                            : 'bg-[#223649] text-[#90adcb] hover:bg-[#314d68] hover:text-white'
                        }`}
                      >
                        All Categories
                      </button>
                      {mode === 'competitive' ? (
                        ['JEE', 'NEET', 'GATE', 'CAT', 'UPSC', 'SSC', 'Banking'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              selectedCategory === cat
                                ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                                : 'bg-[#223649] text-[#90adcb] hover:bg-[#314d68] hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))
                      ) : (
                        CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                              selectedCategory === cat.id
                                ? 'bg-[#0d7ff2] text-white shadow-lg shadow-[#0d7ff2]/20'
                                : 'bg-[#223649] text-[#90adcb] hover:bg-[#314d68] hover:text-white'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            {cat.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Subcategory Selection - Only for practice mode */}
                  {mode === 'practice' && getSubcategories().length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#90adcb] mb-2">
                        Subcategory
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedSubcategory('all')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedSubcategory === 'all'
                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-[#223649] text-[#90adcb] hover:bg-[#314d68] hover:text-white'
                          }`}
                        >
                          All
                        </button>
                        {getSubcategories().map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubcategory(sub.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              selectedSubcategory === sub.id
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-[#223649] text-[#90adcb] hover:bg-[#314d68] hover:text-white'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Active Filter Indicator */}
                  {selectedCategory !== 'all' && (
                    <div className="mt-4 pt-4 border-t border-[#223649]">
                      <p className="text-sm text-[#90adcb]">
                        Showing results for: <span className="font-medium text-[#0d7ff2]">
                          {mode === 'competitive' ? selectedCategory : CATEGORIES.find(c => c.id === selectedCategory)?.name}
                          {selectedSubcategory !== 'all' && ` > ${getSubcategories().find(s => s.id === selectedSubcategory)?.name}`}
                        </span>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <div className="w-full py-12 text-center text-red-400 bg-red-900/10 rounded-xl border border-red-500/20 mb-8">
            <p>{error}</p>
            <button onClick={fetchLeaderboard} className="mt-2 text-sm text-[#0d7ff2] hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && leaderboard.length === 0 && (
          <div className="w-full py-12 text-center text-[#90adcb] mb-8">
            <FiAward className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No data available yet</p>
            <p className="text-sm mt-1">Be the first to compete!</p>
          </div>
        )}

        {/* The Podium (Top 3) */}
        {topThree.length >= 3 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-end justify-center mb-12 min-h-[300px]">
            {/* Rank 2 - Second Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="order-2 md:order-1 flex flex-col items-center justify-end h-full"
            >
              <div className="relative mb-4">
                {topThree[1].photoURL ? (
                  <div
                    className="w-20 h-20 rounded-full border-4 border-[#C0C0C0] bg-cover bg-center shadow-[0_0_20px_rgba(192,192,192,0.3)]"
                    style={{ backgroundImage: `url(${topThree[1].photoURL})` }}
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full border-4 border-[#C0C0C0] flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(192,192,192,0.3)] ${getAvatarColor(topThree[1].name || topThree[1].displayName || 'A')}`}>
                    {getInitials(topThree[1].name || topThree[1].displayName || 'A')}
                  </div>
                )}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-[#101922] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                  <FiAward className="w-3.5 h-3.5" /> 2
                </div>
              </div>
              <div className="bg-[#1e2b38] w-full rounded-t-2xl p-6 flex flex-col items-center border-t-4 border-[#C0C0C0] h-[200px] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#C0C0C0]/5 to-transparent pointer-events-none"></div>
                <h3 className="text-white font-bold text-lg mb-1 truncate max-w-full z-10">
                  {topThree[1].name || topThree[1].displayName || 'Anonymous'}
                </h3>
                <p className="text-[#90adcb] text-sm mb-3 z-10">
                  @{(topThree[1].name || topThree[1].displayName || 'user').toLowerCase().replace(/\s+/g, '_')}
                </p>
                <div className="mt-auto flex flex-col items-center z-10">
                  <span className="text-2xl font-black text-white">
                    {getPodiumScore(topThree[1]).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#90adcb] uppercase tracking-wider font-semibold">
                    {getPodiumLabel()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Rank 1 - First Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="order-1 md:order-2 flex flex-col items-center justify-end h-full z-10 -mt-8 md:-mt-0"
            >
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-[#0d7ff2]/30 rounded-full blur-xl animate-pulse"></div>
                {topThree[0].photoURL ? (
                  <div
                    className="relative w-28 h-28 rounded-full border-4 border-[#FFD700] bg-cover bg-center shadow-[0_0_30px_rgba(255,215,0,0.4)]"
                    style={{ backgroundImage: `url(${topThree[0].photoURL})` }}
                  />
                ) : (
                  <div className={`relative w-28 h-28 rounded-full border-4 border-[#FFD700] flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_30px_rgba(255,215,0,0.4)] ${getAvatarColor(topThree[0].name || topThree[0].displayName || 'A')}`}>
                    {getInitials(topThree[0].name || topThree[0].displayName || 'A')}
                  </div>
                )}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#FFD700] text-4xl">
                  👑
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-[#8B4500] text-sm font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-lg border border-[#ffd700]">
                  <FiAward className="w-4 h-4" /> 1
                </div>
              </div>
              <div className="bg-[#1e2b38] w-full rounded-t-2xl p-6 flex flex-col items-center border-t-4 border-[#FFD700] h-[240px] relative overflow-hidden shadow-2xl shadow-black/50">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#FFD700]/10 to-transparent pointer-events-none"></div>
                <h3 className="text-white font-bold text-xl mb-1 truncate max-w-full z-10">
                  {topThree[0].name || topThree[0].displayName || 'Anonymous'}
                </h3>
                <p className="text-[#90adcb] text-sm mb-4 z-10">
                  @{(topThree[0].name || topThree[0].displayName || 'user').toLowerCase().replace(/\s+/g, '_')}
                </p>
                <div className="mt-auto flex flex-col items-center z-10">
                  <span className="text-3xl font-black text-[#FFD700]">
                    {getPodiumScore(topThree[0]).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#90adcb] uppercase tracking-wider font-semibold">
                    {getPodiumLabel()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Rank 3 - Third Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="order-3 flex flex-col items-center justify-end h-full"
            >
              <div className="relative mb-4">
                {topThree[2].photoURL ? (
                  <div
                    className="w-20 h-20 rounded-full border-4 border-[#CD7F32] bg-cover bg-center shadow-[0_0_20px_rgba(205,127,50,0.3)]"
                    style={{ backgroundImage: `url(${topThree[2].photoURL})` }}
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full border-4 border-[#CD7F32] flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(205,127,50,0.3)] ${getAvatarColor(topThree[2].name || topThree[2].displayName || 'A')}`}>
                    {getInitials(topThree[2].name || topThree[2].displayName || 'A')}
                  </div>
                )}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-[#3E2723] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                  <FiAward className="w-3.5 h-3.5" /> 3
                </div>
              </div>
              <div className="bg-[#1e2b38] w-full rounded-t-2xl p-6 flex flex-col items-center border-t-4 border-[#CD7F32] h-[180px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#CD7F32]/5 to-transparent pointer-events-none"></div>
                <h3 className="text-white font-bold text-lg mb-1 truncate max-w-full z-10">
                  {topThree[2].name || topThree[2].displayName || 'Anonymous'}
                </h3>
                <p className="text-[#90adcb] text-sm mb-3 z-10">
                  @{(topThree[2].name || topThree[2].displayName || 'user').toLowerCase().replace(/\s+/g, '_')}
                </p>
                <div className="mt-auto flex flex-col items-center z-10">
                  <span className="text-2xl font-black text-white">
                    {getPodiumScore(topThree[2]).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#90adcb] uppercase tracking-wider font-semibold">
                    {getPodiumLabel()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* List Header with Search */}
        <div className="w-full flex justify-between items-center mb-4 px-2">
          <h3 className="text-white text-lg font-bold">Top Learners</h3>
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#223649] text-white text-sm rounded-lg border-none focus:ring-1 focus:ring-[#0d7ff2] pl-9 pr-4 py-2 w-48 transition-all focus:w-64 placeholder:text-[#90adcb]"
              placeholder="Find user..."
            />
            <FiSearch className="absolute left-2.5 top-2.5 text-[#90adcb] w-4 h-4" />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="w-full bg-[#16202a] rounded-xl overflow-hidden border border-[#223649] flex flex-col shadow-lg">
          {/* Table Header - Dynamic per mode */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#1e2b38] border-b border-[#223649] text-xs font-bold text-[#90adcb] uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">User</div>
            <div className="col-span-2 text-center">{columnHeaders.col1}</div>
            <div className="col-span-2 text-center hidden sm:block">{columnHeaders.col2}</div>
            <div className="col-span-2 text-center">{columnHeaders.col3}</div>
          </div>

          {/* Table Rows - All users with mode-specific data */}
          <div className="divide-y divide-[#223649]">
            {filteredLeaderboard.length === 0 && searchQuery ? (
              <div className="py-12 text-center text-[#90adcb]">
                No users found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-[#90adcb]">
                <FiAward className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No leaderboard data yet</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredLeaderboard.map((user, index) => {
                  const isCurrentUser = user.uid === currentUser?.uid || user.id === currentUser?.uid
                  const rowData = getRowData(user)
                  const rank = user.rank || index + 1

                  return (
                    <motion.div
                      key={user.id || user.uid || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group ${
                        isCurrentUser
                          ? 'bg-gradient-to-r from-[#0d7ff2]/10 to-transparent'
                          : 'hover:bg-[#1e2b38]/50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 flex items-center justify-center">
                        {rank <= 3 ? (
                          <span className="text-xl">
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="font-bold text-[#90adcb]">#{rank}</span>
                        )}
                      </div>

                      {/* User */}
                      <div className="col-span-5 flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name || user.displayName}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${getAvatarColor(
                              user.name || user.displayName || 'A'
                            )}`}
                          >
                            {getInitials(user.name || user.displayName || 'A')}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-white truncate">
                            {user.name || user.displayName || 'Anonymous'}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-[#0d7ff2] font-medium">(You)</span>
                            )}
                          </span>
                          <span className="text-[#90adcb] text-xs truncate">{rowData.subtitle}</span>
                        </div>
                      </div>

                      {/* Column 1 - Mode-specific */}
                      <div className="col-span-2 text-center">
                        {rowData.col1}
                      </div>

                      {/* Column 2 - Mode-specific */}
                      <div className="col-span-2 text-center hidden sm:block">
                        {rowData.col2}
                      </div>

                      {/* Column 3 - Mode-specific */}
                      <div className="col-span-2 text-center">
                        {rowData.col3}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Stats Explanation Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {statsCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="bg-[#16202a] border border-[#223649] rounded-xl p-6 text-center"
            >
              {card.icon}
              <h4 className="text-white font-bold text-sm mb-1">{card.title}</h4>
              <p className="text-[#90adcb] text-xs">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Sticky Footer for Current User */}
      {userRank && userProfile && (
        <div className="fixed bottom-0 w-full z-40 px-4 pb-4 pointer-events-none">
          <div className="max-w-[1200px] mx-auto pointer-events-auto">
            <div className="bg-[#1e2b38] border-t-2 border-[#0d7ff2] rounded-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-gradient-to-r from-[#0d7ff2]/10 to-transparent">
                <div className="col-span-2 md:col-span-1 text-center font-black text-white text-lg">
                  #{userRank}
                </div>
                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.name || userProfile.displayName}
                      className="w-12 h-12 rounded-full border-2 border-[#0d7ff2] object-cover"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full border-2 border-[#0d7ff2] flex items-center justify-center text-white font-bold ${getAvatarColor(
                        userProfile.name || 'A'
                      )}`}
                    >
                      {getInitials(userProfile.name || userProfile.displayName || 'A')}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">
                      You ({userProfile.name || userProfile.displayName || 'User'})
                    </span>
                    <span className="text-[#0d7ff2] text-xs font-medium">
                      Top {Math.max(1, Math.round((userRank / Math.max(leaderboard.length, 1)) * 100))}%
                    </span>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-2 text-center hidden md:block">
                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">
                    {userProfile.accuracy || userProfile.avgScore || 0}%
                  </span>
                </div>
                <div className="col-span-2 md:col-span-2 text-right font-black text-white text-lg">
                  {(userProfile.totalScore || userProfile.xp || 0).toLocaleString()}
                </div>
                <div className="col-span-2 md:col-span-2 text-center hidden sm:flex justify-center items-center gap-1 text-sm font-bold bg-green-900/20 py-1 px-2 rounded-lg border border-green-500/20">
                  <FiTrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">{userProfile.streak || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leaderboard
