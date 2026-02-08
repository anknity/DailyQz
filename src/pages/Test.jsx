import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, QuestionCard, QuestionPalette } from '../components'
import { useTest, TEST_CONFIG, CATEGORIES, DIFFICULTY_LEVELS } from '../context/TestContext'
import { antiCheat } from '../utils/helpers'
import { FiSend, FiAlertTriangle, FiX, FiMenu } from 'react-icons/fi'

/**
 * Test Page
 * Main test-taking interface with questions, timer, and navigation
 */
const Test = () => {
  const {
    questions,
    isTestActive,
    timeRemaining,
    updateTimer,
    submitTest,
    attemptedCount,
    selectedCategory,
    selectedDifficulty
  } = useTest()
  
  const navigate = useNavigate()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const hasSubmittedRef = useRef(false)

  const category = CATEGORIES.find(c => c.id === selectedCategory)
  const difficulty = DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty)

  // Redirect if no active test (with delay)
  useEffect(() => {
    if (!isTestActive && questions.length === 0 && !hasSubmittedRef.current) {
      navigate('/dashboard')
    }
  }, [isTestActive, questions, navigate])

  // Enable anti-cheat measures
  useEffect(() => {
    antiCheat.disableContextMenu()
    antiCheat.disableSelection()
    antiCheat.disableShortcuts()

    return () => {
      antiCheat.enableAll()
    }
  }, [])

  // Single timer effect
  useEffect(() => {
    if (!isTestActive || hasSubmittedRef.current) return

    const timer = setInterval(() => {
      updateTimer(timeRemaining - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isTestActive, timeRemaining, updateTimer])

  // Auto submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && isTestActive && !hasSubmittedRef.current) {
      handleAutoSubmit()
    }
  }, [timeRemaining, isTestActive])

  const handleAutoSubmit = useCallback(() => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true
    
    console.log('Auto submitting test...')
    const results = submitTest()
    console.log('Test results:', results)
    
    // Small delay to ensure state is set before navigation
    setTimeout(() => {
      navigate('/suspense')
    }, 100)
  }, [submitTest, navigate])

  const handleSubmit = () => {
    setShowSubmitModal(true)
  }

  const confirmSubmit = () => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true
    
    console.log('Manually submitting test...')
    const results = submitTest()
    console.log('Test results:', results)
    
    // Small delay to ensure state is set before navigation
    setTimeout(() => {
      navigate('/suspense')
    }, 100)
  }

  if (!isTestActive || questions.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 no-select">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-200/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Category & Difficulty */}
            <div className="flex items-center gap-3">
              <span className="text-xl">{category?.icon}</span>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {category?.name}
                </p>
                <p className={`text-xs capitalize ${
                  difficulty?.id === 'easy' ? 'text-green-500' :
                  difficulty?.id === 'medium' ? 'text-yellow-500' :
                  difficulty?.id === 'hard' ? 'text-red-500' : 'text-purple-500'
                }`}>
                  {difficulty?.name} Difficulty
                </p>
              </div>
            </div>

            {/* Center - Timer */}
            <Timer timeRemaining={timeRemaining} />

            {/* Right - Progress & Submit */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {attemptedCount}/{TEST_CONFIG.TOTAL_QUESTIONS}
                </p>
                <p className="text-xs text-gray-500">Answered</p>
              </div>
              
              {/* Mobile palette toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPalette(!showPalette)}
                className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400"
              >
                <FiMenu className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
              >
                <FiSend className="w-4 h-4" />
                <span className="hidden sm:inline">Submit</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Question area */}
          <div className="flex-1">
            <QuestionCard />
          </div>

          {/* Desktop Question Palette */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <QuestionPalette />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Question Palette Overlay */}
      <AnimatePresence>
        {showPalette && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPalette(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 max-w-full bg-white dark:bg-dark-200 shadow-xl z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Questions
                  </h3>
                  <button
                    onClick={() => setShowPalette(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <QuestionPalette onQuestionClick={() => setShowPalette(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Submit Test?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  You have answered <span className="font-semibold text-primary-500">{attemptedCount}</span> out of{' '}
                  <span className="font-semibold">{TEST_CONFIG.TOTAL_QUESTIONS}</span> questions.
                </p>
                {attemptedCount < TEST_CONFIG.TOTAL_QUESTIONS && (
                  <p className="text-sm text-orange-500 dark:text-orange-400 mb-4">
                    ⚠️ You still have {TEST_CONFIG.TOTAL_QUESTIONS - attemptedCount} unanswered questions!
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-100 transition-colors"
                >
                  Continue Test
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmSubmit}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                >
                  Submit Now
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Test
