import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTest, CATEGORIES, DIFFICULTY_LEVELS } from '../context/TestContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getGrade, formatTimeHuman } from '../utils/helpers'
import { 
  FiCheck, FiX, FiMinus, FiClock, FiTarget, FiTrendingUp, FiAward,
  FiHome, FiRepeat, FiChevronDown, FiChevronUp, FiShare2, FiEye, FiBarChart2
} from 'react-icons/fi'

const Result = () => {
  const { testResult, resetTest } = useTest()
  const { userProfile } = useAuth()
  const { isDark: isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!testResult) {
      const timer = setTimeout(() => navigate('/dashboard'), 1500)
      return () => clearTimeout(timer)
    }
  }, [testResult, navigate])

  if (!testResult) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    )
  }

  const { score, correct, wrong, unattempted, timeTaken, category, difficulty, questionResults } = testResult
  const total = correct + wrong + unattempted
  const grade = getGrade(score)
  const categoryInfo = CATEGORIES.find(c => c.id === category)
  const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.id === difficulty)
  const avgTimePerQ = total > 0 ? Math.round(timeTaken / total) : 0
  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0

  const handleNewTest = () => { resetTest(); navigate('/daily-practice') }
  const handleGoHome = () => { resetTest(); navigate('/dashboard') }

  const getScoreMessage = (s) => {
    if (s >= 90) return 'Outstanding Performance!'
    if (s >= 80) return 'Excellent Work!'
    if (s >= 70) return 'Great Job!'
    if (s >= 60) return 'Good Effort!'
    if (s >= 50) return 'Keep Practicing!'
    return 'More Practice Needed'
  }

  const getScoreColor = (s) => {
    if (s >= 80) return '#22c55e'
    if (s >= 60) return '#3b82f6'
    if (s >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const scoreColor = getScoreColor(score)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${score >= 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {score >= 50 ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{categoryInfo?.name || 'Practice'} - {difficultyInfo?.name || 'Test'}</h1>
            <p className="text-gray-400 text-sm mt-1">Completed just now &bull; {formatTimeHuman(timeTaken)} Duration</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-2 px-4 py-2.5 bg-[#111d2e] border border-gray-700/50 text-gray-300 rounded-xl hover:bg-[#162435] transition-colors text-sm font-medium">
              <FiEye className="w-4 h-4" /> Review Answers
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors text-sm font-medium">
              <FiShare2 className="w-4 h-4" /> Share Result
            </button>
          </div>
        </motion.div>

        {/* Score Card + Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative flex-shrink-0">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
                  <motion.circle cx="80" cy="80" r={radius} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-4xl font-extrabold text-white">{score * 10}</motion.span>
                  <span className="text-gray-500 text-sm">/ {total * 10} TOTAL</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">{getScoreMessage(score)}</h2>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">You scored in the top {score >= 80 ? '10%' : score >= 60 ? '30%' : '50%'}. {score >= 70 ? 'Your understanding has improved significantly.' : 'Keep practicing to improve.'}</p>
                <div className="grid grid-cols-3 gap-6">
                  <div><span className="text-gray-500 text-xs block mb-1">Percentile</span><span className="text-xl font-bold text-white">{Math.min(99, Math.max(1, score))}nd</span></div>
                  <div><span className="text-gray-500 text-xs block mb-1">Correct</span><span className="text-xl font-bold text-green-400">{correct}<span className="text-gray-500 text-sm">/{total}</span></span></div>
                  <div><span className="text-gray-500 text-xs block mb-1">Incorrect</span><span className="text-xl font-bold text-red-400">{wrong}</span></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🔥</span><h3 className="text-xl font-bold text-white">{userProfile?.streak || 0} Day Streak!</h3></div>
              <p className="text-gray-500 text-sm">Keep the momentum going</p>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">+{score >= 50 ? 50 : 20} XP</span>
                {score >= 80 && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">+20% Bonus</span>}
              </div>
              <div className="flex gap-1 mt-3">{[...Array(7)].map((_, i) => (<div key={i} className={`flex-1 h-2 rounded-full ${i < (userProfile?.streak || 1) % 7 + 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />))}</div>
              <p className="text-gray-500 text-xs mt-2">{7 - ((userProfile?.streak || 0) % 7)} days until <strong className="text-gray-300">Weekly Badge</strong></p>
            </div>
          </motion.div>
        </div>

        {/* Accuracy / Pacing / Topic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><FiTarget className="w-4 h-4 text-blue-400" /></div><span className="text-white font-semibold">Accuracy</span></div>
              <span className={`text-xs font-semibold flex items-center gap-1 ${accuracy >= 70 ? 'text-green-400' : 'text-red-400'}`}><FiTrendingUp className="w-3 h-3" /> {accuracy >= 50 ? '+' : ''}{accuracy - 50}%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-extrabold text-white">{accuracy}%</span><span className="text-gray-500 text-sm">Average</span></div>
            <div className="w-full h-2 bg-gray-800 rounded-full mt-3 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${accuracy}%` }} transition={{ delay: 0.6, duration: 1 }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" /></div>
            <p className="text-gray-500 text-xs mt-2">You were more accurate than {Math.min(95, accuracy)}% of users.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><FiClock className="w-4 h-4 text-amber-400" /></div><span className="text-white font-semibold">Pacing</span></div>
              <span className={`text-xs font-semibold flex items-center gap-1 ${avgTimePerQ <= 60 ? 'text-green-400' : 'text-red-400'}`}><FiTrendingUp className="w-3 h-3" /> {avgTimePerQ <= 45 ? '-' : '+'}{Math.abs(avgTimePerQ - 45)}s</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-extrabold text-white">{avgTimePerQ}s</span><span className="text-gray-500 text-sm">per question</span></div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5"><span>Your Avg: {avgTimePerQ}s</span><span>Community: 57s</span></div>
              <div className="flex gap-1.5 h-2.5"><div className="bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (avgTimePerQ / 90) * 100)}%` }} /><div className="flex-1 bg-blue-900/40 rounded-full" /></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><FiBarChart2 className="w-4 h-4 text-purple-400" /></div><span className="text-white font-semibold">Topic Analysis</span></div>
            <div className="space-y-3">
              {[{ name: 'Correct', pct: total > 0 ? Math.round((correct / total) * 100) : 0, color: 'bg-green-500' },
                { name: 'Incorrect', pct: total > 0 ? Math.round((wrong / total) * 100) : 0, color: 'bg-red-500' },
                { name: 'Unattempted', pct: total > 0 ? Math.round((unattempted / total) * 100) : 0, color: 'bg-gray-500' }
              ].map((topic, i) => (
                <div key={i}><div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-400">{topic.name}</span><span className="text-white font-semibold">{topic.pct}%</span></div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${topic.pct}%` }} transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }} className={`h-full ${topic.color} rounded-full`} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Performance Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30 mb-5">
          <div className="flex items-center justify-between mb-6">
            <div><h3 className="text-lg font-bold text-white">Performance vs. Community</h3><p className="text-gray-500 text-sm">Comparing your results with other students</p></div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-[#1a2940] border border-gray-700/50 text-white rounded-lg text-xs font-medium">Score</button>
              <button className="px-3 py-1.5 bg-transparent border border-gray-700/50 text-gray-500 rounded-lg text-xs font-medium hover:text-gray-300">Time</button>
            </div>
          </div>
          <div className="flex items-end gap-2 sm:gap-3 h-40 mb-4 px-2">
            {[15, 25, 20, 35, 45, 60, 75, 55, 30, 20].map((h, i) => {
              const isYou = i === Math.min(9, Math.floor(score / 10))
              const barHeight = h + (isYou ? 25 : 0)
              return (<div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                {isYou && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">You</span>}
                <motion.div initial={{ height: 0 }} animate={{ height: `${barHeight}%` }} transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }} style={{ minHeight: '4px' }} className={`w-full rounded-t-md ${isYou ? 'bg-blue-500' : 'bg-blue-500/20'}`} />
              </div>)
            })}
          </div>
          <div className="flex justify-between px-2 text-xs text-gray-600"><span>0</span><span>200</span><span>400</span><span>600</span><span>800</span><span>1000</span></div>
        </motion.div>

        {/* Review Answers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <button onClick={() => setShowDetails(!showDetails)} className="w-full bg-[#111d2e] border border-gray-700/30 rounded-2xl p-4 flex items-center justify-between hover:bg-[#162435] transition-colors">
            <div className="flex items-center gap-3"><FiEye className="w-5 h-5 text-blue-400" /><span className="font-semibold text-white">Review Answers</span><span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{total} questions</span></div>
            {showDetails ? <FiChevronUp className="w-5 h-5 text-gray-500" /> : <FiChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          <AnimatePresence>
            {showDetails && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-3">
                  {questionResults.map((q, index) => (
                    <motion.div key={q.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                      className={`bg-[#111d2e] border rounded-xl p-4 border-l-4 ${q.isCorrect ? 'border-green-500/50 border-l-green-500' : q.isAttempted ? 'border-red-500/50 border-l-red-500' : 'border-gray-700/50 border-l-gray-600'}`}>
                      <div className="flex items-start gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${q.isCorrect ? 'bg-green-500/20 text-green-400' : q.isAttempted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                          {q.isCorrect ? <FiCheck /> : q.isAttempted ? <FiX /> : '-'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-500 text-xs font-medium">Q{index + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.isCorrect ? 'bg-green-500/20 text-green-400' : q.isAttempted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                              {q.isCorrect ? 'Correct' : q.isAttempted ? 'Wrong' : 'Skipped'}
                            </span>
                          </div>
                          <p className="text-white font-medium mb-3">{q.question}</p>
                          <div className="space-y-2">
                            {q.options.map((option, optIndex) => {
                              const isUserAnswer = q.userAnswer === option.index
                              const isCorrectAnswer = q.correctAnswer === option.index
                              return (
                                <div key={optIndex} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${isCorrectAnswer ? 'bg-green-500/10 border border-green-500/30 text-green-300' : isUserAnswer && !q.isCorrect ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-gray-800/50 text-gray-400'}`}>
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isCorrectAnswer ? 'bg-green-500 text-white' : isUserAnswer && !q.isCorrect ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>{String.fromCharCode(65 + optIndex)}</span>
                                  <span className="flex-1">{option.text}</span>
                                  {isCorrectAnswer && <FiCheck className="w-4 h-4 text-green-400" />}
                                  {isUserAnswer && !isCorrectAnswer && <FiX className="w-4 h-4 text-red-400" />}
                                </div>
                              )
                            })}
                          </div>
                          {q.explanation && (<div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"><p className="text-sm text-blue-300">💡 {q.explanation}</p></div>)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col sm:flex-row gap-4 mt-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#111d2e] border border-gray-700/30 text-gray-300 rounded-xl font-semibold hover:bg-[#162435] transition-colors">
            <FiHome className="w-5 h-5" /> Back to Dashboard
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNewTest}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors">
            <FiRepeat className="w-5 h-5" /> Take Another Test
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default Result