import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTest, TEST_CONFIG } from '../context/TestContext'
import { useAuth } from '../context/AuthContext'
import { UserService, StreakService, LeaderboardService, TestResultService } from '../services/firestoreService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Suspense Page
 * Shows animated suspense screen for 60 seconds before showing results
 * Updates Firebase with test results during this time
 */
const SuspensePage = () => {
  const { testResult, isTestSubmitted } = useTest()
  const { currentUser, userProfile, refreshUserProfile } = useAuth()
  const navigate = useNavigate()
  
  const [countdown, setCountdown] = useState(TEST_CONFIG.SUSPENSE_DURATION)
  const [isProcessing, setIsProcessing] = useState(true)
  const [processingStep, setProcessingStep] = useState(0)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [error, setError] = useState(null)
  const processedRef = useRef(false)
  const mountedRef = useRef(true)

  const processingSteps = [
    'Calculating your score...',
    'Analyzing your performance...',
    'Updating your statistics...',
    'Checking your streak...',
    'Preparing your results...'
  ]

  // Check if we have valid data on mount
  useEffect(() => {
    console.log('Suspense mounted - testResult:', testResult, 'isTestSubmitted:', isTestSubmitted)
    
    // Give a bit more time for state to propagate
    const timer = setTimeout(() => {
      if (!testResult && !isTestSubmitted) {
        console.log('No test result found, redirecting to dashboard')
        navigate('/dashboard')
      }
    }, 1000)
    
    return () => {
      clearTimeout(timer)
      mountedRef.current = false
    }
  }, [])

  // Countdown timer - navigate when countdown finishes
  useEffect(() => {
    // Navigate to result when countdown reaches 0
    if (countdown <= 0) {
      console.log('Countdown finished, navigating to result. Processing complete:', processingComplete)
      navigate('/result')
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        const newVal = prev - 1
        console.log('Countdown:', newVal)
        return newVal
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown, navigate])

  // Processing steps animation
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setProcessingStep(prev => (prev + 1) % processingSteps.length)
    }, 3000)

    return () => clearInterval(stepInterval)
  }, [])

  // Process results and update Firebase
  useEffect(() => {
    const processResults = async () => {
      // Prevent duplicate processing
      if (processedRef.current) return
      if (!currentUser || !testResult) return
      
      processedRef.current = true

      try {
        // Save test result
        await TestResultService.saveTestResult(currentUser.uid, {
          score: testResult.score,
          correct: testResult.correct,
          wrong: testResult.wrong,
          unattempted: testResult.unattempted,
          timeTaken: testResult.timeTaken,
          category: testResult.category,
          difficulty: testResult.difficulty,
          totalQuestions: testResult.totalQuestions
        })

        // Update user stats
        const updatedStats = await UserService.updateUserStats(currentUser.uid, testResult)

        // Update streak (server-side for accuracy)
        let newStreak = 0
        try {
          const token = await currentUser.getIdToken()
          const streakRes = await fetch(`${API_URL}/users/update-streak`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ activityType: 'practice' })
          })
          const streakData = await streakRes.json()
          if (streakData.success) {
            newStreak = streakData.data?.currentStreak || 0
          }
        } catch (e) {
          // Fallback to client-side streak
          newStreak = await StreakService.updateStreak(currentUser.uid)
        }

        // Update leaderboard
        await LeaderboardService.updateLeaderboard(currentUser.uid, {
          name: userProfile?.name || currentUser.displayName || 'User',
          totalScore: updatedStats.totalScore,
          avgScore: updatedStats.avgScore,
          testsTaken: updatedStats.testsTaken,
          streak: newStreak
        })

        // Refresh user profile
        await refreshUserProfile()

        if (mountedRef.current) {
          setIsProcessing(false)
          setProcessingComplete(true)
        }
      } catch (error) {
        console.error('Error processing results:', error)
        setError(error.message)
        if (mountedRef.current) {
          setIsProcessing(false)
          setProcessingComplete(true) // Still allow navigation even on error
        }
      }
    }

    processResults()
  }, [currentUser, testResult, userProfile, refreshUserProfile])

  // Prevent navigation during suspense
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Show loading while waiting for test result
  if (!testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-purple-900 to-dark-300 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-purple-900 to-dark-300 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Animated circles */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-4 border-primary-400/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut'
              }}
            />
          ))}
          
          {/* Center countdown */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-white"
            >
              {countdown}
            </motion.div>
          </div>
        </div>

        {/* Main text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          Preparing Your Result...
        </motion.h1>

        {/* Processing step */}
        <motion.p
          key={processingStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xl text-primary-300 mb-8"
        >
          {processingSteps[processingStep]} 
          {isProcessing && <span className="animate-pulse">⏳</span>}
        </motion.p>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-400 to-purple-400"
              initial={{ width: '0%' }}
              animate={{ 
                width: `${((TEST_CONFIG.SUSPENSE_DURATION - countdown) / TEST_CONFIG.SUSPENSE_DURATION) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Suspense emoji animation */}
        <motion.div
          className="mt-12 text-6xl"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          😎
        </motion.div>

        {/* Fun message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/60 text-sm mt-4"
        >
          Building suspense... Just like a good movie! 🎬
        </motion.p>

        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary-400/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 20
              }}
              animate={{
                y: -20,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SuspensePage
