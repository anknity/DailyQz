import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  FiCheck, FiX, FiClock, FiTarget, FiAward, FiHome, FiRotateCcw,
  FiTrendingUp, FiChevronDown, FiChevronUp, FiEye, FiShare2, FiBarChart2
} from 'react-icons/fi'

const ExamResult = () => {
  const { refreshUserProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { result, questions, answers, category } = location.state || {}
  const [showAnswers, setShowAnswers] = useState(false)

  useEffect(() => {
    if (!result) { navigate('/exam'); return }
    refreshUserProfile()
  }, [result, navigate])

  if (!result) return null

  const formatTime = (seconds) => { const m = Math.floor(seconds / 60); return `${m}m ${seconds % 60}s` }
  const accuracy = (result.correctAnswers + result.incorrectAnswers) > 0 ? Math.round((result.correctAnswers / (result.correctAnswers + result.incorrectAnswers)) * 100) : 0
  const avgTimePerQ = result.totalQuestions > 0 ? Math.round(result.timeSpent / result.totalQuestions) : 0
  const completionRate = Math.round(((result.correctAnswers + result.incorrectAnswers) / result.totalQuestions) * 100)

  const getScoreColor = (s) => { if (s >= 80) return '#22c55e'; if (s >= 60) return '#3b82f6'; if (s >= 40) return '#f59e0b'; return '#ef4444' }
  const getScoreMessage = (s) => { if (s >= 90) return 'Outstanding Performance!'; if (s >= 80) return 'Excellent Work!'; if (s >= 70) return 'Great Job!'; if (s >= 60) return 'Good Effort!'; if (s >= 50) return 'Keep Practicing!'; return 'More Practice Needed' }

  const scoreColor = getScoreColor(result.score)
  const radius = 70, circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (result.score / 100) * circumference

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.score >= 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{result.score >= 50 ? 'PASSED' : 'FAILED'}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400">Grade: {result.grade}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{category || 'Competitive Exam'}</h1>
            <p className="text-gray-400 text-sm mt-1">Completed just now &bull; {formatTime(result.timeSpent)} Duration</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAnswers(!showAnswers)} className="flex items-center gap-2 px-4 py-2.5 bg-[#111d2e] border border-gray-700/50 text-gray-300 rounded-xl hover:bg-[#162435] transition-colors text-sm font-medium"><FiEye className="w-4 h-4" /> Review Answers</button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors text-sm font-medium"><FiShare2 className="w-4 h-4" /> Share Result</button>
          </div>
        </motion.div>

        {/* Score Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative flex-shrink-0">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
                  <motion.circle cx="80" cy="80" r={radius} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-4xl font-extrabold text-white">{result.score}%</motion.span>
                  <span className="text-gray-500 text-sm">{result.correctAnswers}/{result.totalQuestions}</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">{getScoreMessage(result.score)}</h2>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">{result.score >= 70 ? 'Excellent work! Your preparation is paying off.' : 'Keep practicing to improve your competitive edge.'}</p>
                <div className="grid grid-cols-3 gap-6">
                  <div><span className="text-gray-500 text-xs block mb-1">Correct</span><span className="text-xl font-bold text-green-400">{result.correctAnswers}</span></div>
                  <div><span className="text-gray-500 text-xs block mb-1">Incorrect</span><span className="text-xl font-bold text-red-400">{result.incorrectAnswers}</span></div>
                  <div><span className="text-gray-500 text-xs block mb-1">Skipped</span><span className="text-xl font-bold text-gray-400">{result.unanswered || 0}</span></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1"><FiAward className="w-5 h-5 text-amber-400" /><h3 className="text-lg font-bold text-white">Exam Stats</h3></div>
              <p className="text-gray-500 text-sm mb-4">{category} Performance</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">Completion</span><span className="text-white font-bold">{completionRate}%</span></div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ delay: 0.5, duration: 1 }} className="h-full bg-blue-500 rounded-full" /></div>
              <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">Avg Time</span><span className="text-white font-bold">{avgTimePerQ}s/q</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">Time Used</span><span className="text-white font-bold">{Math.round((result.timeSpent / 3600) * 100)}%</span></div>
            </div>
          </motion.div>
        </div>

        {/* Accuracy / Pacing / Topic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><FiTarget className="w-4 h-4 text-blue-400" /></div><span className="text-white font-semibold">Accuracy</span></div>
              <span className={`text-xs font-semibold flex items-center gap-1 ${accuracy >= 70 ? 'text-green-400' : 'text-red-400'}`}><FiTrendingUp className="w-3 h-3" /> {accuracy}%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-extrabold text-white">{accuracy}%</span></div>
            <div className="w-full h-2 bg-gray-800 rounded-full mt-3 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${accuracy}%` }} transition={{ delay: 0.6, duration: 1 }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" /></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><FiClock className="w-4 h-4 text-amber-400" /></div><span className="text-white font-semibold">Pacing</span></div>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-extrabold text-white">{avgTimePerQ}s</span><span className="text-gray-500 text-sm">per question</span></div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5"><span>Your Avg</span><span>Total: {formatTime(result.timeSpent)}</span></div>
              <div className="flex gap-1.5 h-2.5"><div className="bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (avgTimePerQ / 120) * 100)}%` }} /><div className="flex-1 bg-amber-900/40 rounded-full" /></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><FiBarChart2 className="w-4 h-4 text-purple-400" /></div><span className="text-white font-semibold">Breakdown</span></div>
            <div className="space-y-3">
              {[{ name: 'Correct', pct: Math.round((result.correctAnswers / result.totalQuestions) * 100), color: 'bg-green-500' },
                { name: 'Incorrect', pct: Math.round((result.incorrectAnswers / result.totalQuestions) * 100), color: 'bg-red-500' },
                { name: 'Skipped', pct: Math.round(((result.unanswered || 0) / result.totalQuestions) * 100), color: 'bg-gray-500' }
              ].map((t, i) => (
                <div key={i}><div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-400">{t.name}</span><span className="text-white font-semibold">{t.pct}%</span></div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }} transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }} className={`h-full ${t.color} rounded-full`} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Review Answers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <button onClick={() => setShowAnswers(!showAnswers)} className="w-full bg-[#111d2e] border border-gray-700/30 rounded-2xl p-4 flex items-center justify-between hover:bg-[#162435] transition-colors">
            <div className="flex items-center gap-3"><FiEye className="w-5 h-5 text-blue-400" /><span className="font-semibold text-white">Detailed Answers</span><span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{result.totalQuestions} questions</span></div>
            {showAnswers ? <FiChevronUp className="w-5 h-5 text-gray-500" /> : <FiChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          <AnimatePresence>
            {showAnswers && result.results && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-3">
                  {result.results.map((item, index) => {
                    const options = item.options || questions?.find(q => q.id === item.questionId)?.options || []
                    const userAnswer = item.selectedOption
                    const isCorrect = item.isCorrect
                    const isAnswered = userAnswer !== undefined && userAnswer !== null
                    return (
                      <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                        className={`bg-[#111d2e] border rounded-xl p-4 border-l-4 ${isCorrect ? 'border-green-500/50 border-l-green-500' : isAnswered ? 'border-red-500/50 border-l-red-500' : 'border-gray-700/50 border-l-gray-600'}`}>
                        <div className="flex items-start gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-green-500/20 text-green-400' : isAnswered ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                            {isCorrect ? <FiCheck /> : isAnswered ? <FiX /> : '-'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-gray-500 text-xs font-medium">Q{index + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCorrect ? 'bg-green-500/20 text-green-400' : isAnswered ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                {isCorrect ? 'Correct' : isAnswered ? 'Wrong' : 'Skipped'}
                              </span>
                            </div>
                            <p className="text-white font-medium mb-3">{item.question}</p>
                            <div className="space-y-2">
                              {options.length > 0 ? options.map((option, optIndex) => {
                                const isCorrectOpt = optIndex === item.correctAnswer
                                const isUserAns = userAnswer === optIndex
                                return (
                                  <div key={optIndex} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${isCorrectOpt ? 'bg-green-500/10 border border-green-500/30 text-green-300' : isUserAns && !isCorrect ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-gray-800/50 text-gray-400'}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isCorrectOpt ? 'bg-green-500 text-white' : isUserAns && !isCorrect ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>{String.fromCharCode(65 + optIndex)}</span>
                                    <span className="flex-1">{option}</span>
                                    {isCorrectOpt && <FiCheck className="w-4 h-4 text-green-400" />}
                                    {isUserAns && !isCorrectOpt && <FiX className="w-4 h-4 text-red-400" />}
                                  </div>
                                )
                              }) : (
                                <div className="p-3 bg-gray-800/50 rounded-lg text-sm text-gray-400">
                                  Your answer: <span className={isCorrect ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>Option {String.fromCharCode(65 + userAnswer)}</span>
                                  {!isCorrect && <span className="ml-2">| Correct: <span className="text-green-400 font-medium">Option {String.fromCharCode(65 + item.correctAnswer)}</span></span>}
                                </div>
                              )}
                            </div>
                            {item.explanation && (<div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"><p className="text-sm text-blue-300">💡 {item.explanation}</p></div>)}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Link to="/dashboard" className="flex items-center justify-center gap-2 py-4 bg-[#111d2e] border border-gray-700/30 text-gray-300 rounded-xl font-semibold hover:bg-[#162435] transition-colors"><FiHome className="w-4 h-4" /> Dashboard</Link>
          <Link to="/exam" className="flex items-center justify-center gap-2 py-4 bg-[#111d2e] border border-gray-700/30 text-gray-300 rounded-xl font-semibold hover:bg-[#162435] transition-colors"><FiRotateCcw className="w-4 h-4" /> New Exam</Link>
          <Link to="/exam/leaderboard" className="flex items-center justify-center gap-2 py-4 bg-[#111d2e] border border-gray-700/30 text-gray-300 rounded-xl font-semibold hover:bg-[#162435] transition-colors"><FiAward className="w-4 h-4" /> Leaderboard</Link>
          <Link to="/profile" className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors"><FiTrendingUp className="w-4 h-4" /> Progress</Link>
        </motion.div>
      </div>
    </div>
  )
}

export default ExamResult
