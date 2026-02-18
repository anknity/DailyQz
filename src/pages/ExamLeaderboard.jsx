import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { LoadingSpinner } from '../components'
import { useAuth } from '../context/AuthContext'
import {
  FiAward,
  FiTrendingUp,
  FiClock,
  FiTarget,
  FiChevronLeft,
  FiFilter
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const BASE_URL = API_URL.replace('/api', '')

// All categories including competitive exams
const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'tcs', name: 'TCS' },
  { id: 'infosys', name: 'Infosys' },
  { id: 'wipro', name: 'Wipro' },
  { id: 'cognizant', name: 'Cognizant' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'google', name: 'Google' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'ssc', name: 'SSC' },
  { id: 'banking', name: 'Banking' },
  { id: 'railway', name: 'Railway' },
  { id: 'upsc', name: 'UPSC' },
  { id: 'dsa', name: 'DSA' },
  { id: 'web-development', name: 'Web Development' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'aptitude', name: 'Aptitude' },
  { id: 'neet', name: 'NEET' }
]

/**
 * Exam Leaderboard Page
 * Shows top performers in exams
 * Can show exam-specific leaderboard when examId is provided in URL
 */
const ExamLeaderboard = () => {
  const { examId } = useParams()
  const { currentUser, userProfile } = useAuth()
  
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [userRank, setUserRank] = useState(null)
  const [examTitle, setExamTitle] = useState(null)

  useEffect(() => {
    if (examId) {
      fetchExamSpecificLeaderboard()
    } else {
      fetchLeaderboard()
    }
  }, [selectedCategory, examId])

  const getAuthHeaders = async () => {
    const token = await currentUser.getIdToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchExamSpecificLeaderboard = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${API_URL}/exams/scheduled/${examId}/leaderboard`, { headers })
      const data = await response.json()
      
      if (data.success) {
        const entries = (data.data?.leaderboard || []).map(entry => ({
          ...entry,
          id: entry.id || entry.userId,
          displayName: entry.displayName || entry.name || 'Anonymous',
          bestScore: entry.bestScore || entry.score || 0,
          avgScore: entry.avgScore || entry.score || 0,
          examsCount: entry.examsCount || 1
        }))
        setLeaderboard(entries)
        setExamTitle(data.data?.examTitle || null)
        
        // Find user's rank - match by firebase uid (entry.id) or supabase id (entry.userId)
        const userEntry = entries.find(entry => entry.id === currentUser?.uid)
        if (userEntry) {
          setUserRank({
            rank: userEntry.rank,
            score: userEntry.score,
            bestScore: userEntry.bestScore,
            examsCount: userEntry.examsCount
          })
        }
      }
    } catch (error) {
      console.error('Error fetching exam leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      // Fetch from both regular exam and competitive leaderboards
      const [examRes, competitiveRes] = await Promise.allSettled([
        fetch(`${API_URL}/exam/leaderboard${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`, { headers }),
        fetch(`${BASE_URL}/api/v2/competitive/leaderboard${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`, { headers })
      ])

      let combinedLeaderboard = []
      let userRankData = null

      // Process exam leaderboard
      if (examRes.status === 'fulfilled' && examRes.value.ok) {
        const examData = await examRes.value.json()
        if (examData.success && examData.data?.leaderboard) {
          combinedLeaderboard = [...examData.data.leaderboard]
          if (examData.data.userRank) {
            userRankData = examData.data.userRank
          }
        }
      }

      // Process competitive leaderboard
      if (competitiveRes.status === 'fulfilled' && competitiveRes.value.ok) {
        const competitiveData = await competitiveRes.value.json()
        if (competitiveData.success && competitiveData.data?.leaderboard) {
          // Merge competitive results (avoid duplicates by user ID)
          const existingIds = new Set(combinedLeaderboard.map(u => u.id))
          for (const entry of competitiveData.data.leaderboard) {
            if (!existingIds.has(entry.id)) {
              combinedLeaderboard.push(entry)
            } else {
              // Update existing entry if competitive score is higher
              const idx = combinedLeaderboard.findIndex(u => u.id === entry.id)
              if (idx >= 0 && entry.score > combinedLeaderboard[idx].score) {
                combinedLeaderboard[idx] = { ...combinedLeaderboard[idx], ...entry }
              }
            }
          }
          // Update user rank if competitive is better
          if (competitiveData.data.userRank && (!userRankData || competitiveData.data.userRank.score > userRankData.score)) {
            userRankData = competitiveData.data.userRank
          }
        }
      }

      // Sort by score and assign ranks
      combinedLeaderboard.sort((a, b) => (b.bestScore || b.score || 0) - (a.bestScore || a.score || 0))
      combinedLeaderboard = combinedLeaderboard.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
        displayName: entry.displayName || entry.name || 'Anonymous',
        bestScore: entry.bestScore || entry.score || 0,
        avgScore: entry.avgScore || entry.score || 0,
        examsCount: entry.examsTaken || entry.examsCount || 1
      }))

      setLeaderboard(combinedLeaderboard.slice(0, 20))
      setUserRank(userRankData)
    } catch (error) {
      console.error('Error fetching exam leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '🥇' }
    if (rank === 2) return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '🥈' }
    if (rank === 3) return { bg: 'bg-orange-100', text: 'text-orange-600', icon: '🥉' }
    return { bg: 'bg-gray-100', text: 'text-gray-600', icon: rank }
  }

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to={examId ? `/exam/${examId}/result` : "/competitive-exams"}
            className="p-2 rounded-lg bg-white dark:bg-dark-200 shadow hover:shadow-md transition-shadow"
          >
            <FiChevronLeft className="w-5 h-5" />
          </Link>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">
              🏆 {examId ? 'Exam Leaderboard' : 'Leaderboard'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {examId ? `Top performers in this exam` : 'Top performers in competitive exams'}
            </p>
          </div>
        </div>

        {/* Category Filter - Only show for general leaderboard */}
        {!examId && (
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <FiFilter className="w-5 h-5 text-primary-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Filter by Category
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </motion.div>
        )}

        {/* User's Rank Card */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl p-4 shadow-lg mb-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  #{userRank.rank}
                </div>
                <div>
                  <p className="font-bold">Your Ranking</p>
                  <p className="text-white/80 text-sm">
                    {examId ? `Score: ${userRank.score}%` : `Best Score: ${userRank.bestScore}% • Exams: ${userRank.examsCount}`}
                  </p>
                </div>
              </div>
              <FiAward className="w-8 h-8 text-white/80" />
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-200 rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-8">
              <LoadingSpinner text="Loading leaderboard..." />
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-dark-100">
              {/* Header */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-dark-100 grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Player</div>
                <div className="col-span-2 text-center">Best Score</div>
                <div className="col-span-2 text-center">Avg Score</div>
                <div className="col-span-2 text-center">Exams</div>
              </div>
              
              {/* Entries */}
              {leaderboard.map((entry, index) => {
                const rank = index + 1
                const badge = getRankBadge(rank)
                const isCurrentUser = entry.id === currentUser?.uid || entry.userId === currentUser?.uid
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`px-6 py-4 grid grid-cols-12 gap-4 items-center ${
                      isCurrentUser 
                        ? 'bg-primary-50 dark:bg-primary-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-dark-100'
                    } transition-colors`}
                  >
                    {/* Rank */}
                    <div className="col-span-1">
                      <span className={`w-8 h-8 rounded-full ${badge.bg} ${badge.text} flex items-center justify-center text-sm font-bold dark:bg-opacity-20`}>
                        {typeof badge.icon === 'string' ? badge.icon : rank}
                      </span>
                    </div>
                    
                    {/* User */}
                    <div className="col-span-5 flex items-center gap-3">
                      {entry.photoURL ? (
                        <img
                          src={entry.photoURL}
                          alt={entry.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {entry.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${
                          isCurrentUser 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {entry.displayName}
                          {isCurrentUser && ' (You)'}
                        </p>
                        {rank <= 3 && (
                          <p className="text-xs text-gray-500">Top Performer</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Best Score */}
                    <div className="col-span-2 text-center">
                      <span className={`font-bold ${
                        entry.bestScore >= 90 ? 'text-green-600' :
                        entry.bestScore >= 70 ? 'text-blue-600' :
                        entry.bestScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {entry.bestScore}%
                      </span>
                    </div>
                    
                    {/* Average Score */}
                    <div className="col-span-2 text-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        {entry.avgScore}%
                      </span>
                    </div>
                    
                    {/* Exams Count */}
                    <div className="col-span-2 text-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        {entry.examsCount}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FiAward className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No exam results yet for this category
              </p>
              <Link
                to="/competitive-exams"
                className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600"
              >
                <FiTarget /> Take an exam to get on the leaderboard
              </Link>
            </div>
          )}
        </motion.div>

        {/* Stats Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg text-center">
            <FiTarget className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Exam Format</p>
            <p className="font-bold text-gray-900 dark:text-white">50 Questions</p>
          </div>
          
          <div className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg text-center">
            <FiClock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Time Limit</p>
            <p className="font-bold text-gray-900 dark:text-white">60 Minutes</p>
          </div>
          
          <div className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg text-center">
            <FiTrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Difficulty</p>
            <p className="font-bold text-gray-900 dark:text-white">Medium Level</p>
          </div>
        </motion.div>
      </main>
    </Layout>
  )
}

export default ExamLeaderboard
