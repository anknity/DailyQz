import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const CompetitiveTest = () => {
  const { category, subject } = useParams()
  const [searchParams] = useSearchParams()
  const { currentUser } = useAuth()
  const { isDark: isDarkMode } = useTheme()
  const navigate = useNavigate()  
  const [authToken, setAuthToken] = useState(null)

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [results, setResults] = useState(null)

  const count = parseInt(searchParams.get('count')) || 10
  const timePerQuestion = 90 // seconds per question

  // Get auth token on mount
  useEffect(() => {
    const loadToken = async () => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken()
          setAuthToken(token)
        } catch (e) {
          console.warn('Could not get auth token:', e)
        }
      }
    }
    loadToken()
  }, [currentUser])

  // Fetch questions
  useEffect(() => {
    fetchQuestions()
  }, [category, subject, count])

  // Timer
  useEffect(() => {
    if (!loading && questions.length > 0 && !testCompleted && timeLeft === null) {
      setTimeLeft(questions.length * timePerQuestion)
    }

    if (timeLeft > 0 && !testCompleted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [loading, questions, testCompleted, timeLeft])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
      
      // Get fresh token if available
      let headers = { 'Content-Type': 'application/json' }
      if (currentUser) {
        try {
          const freshToken = await currentUser.getIdToken()
          headers['Authorization'] = `Bearer ${freshToken}`
        } catch (e) {
          console.warn('Auth token not available')
        }
      }

      const response = await fetch(
        `${BASE_URL}/api/v2/competitive/questions/random?category=${category}&subject=${subject}&count=${count}`,
        { headers }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // If no questions available, try to generate some or show message
        if (response.status === 404) {
          throw new Error(errorData.error || 'No questions available for this category yet. Please try again later.')
        }
        throw new Error(errorData.error || 'Failed to fetch questions')
      }

      const data = await response.json()
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No questions available for this category. Questions will be added soon!')
      }

      // Map the response to expected format
      const formattedQuestions = data.data.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        category: q.category,
        subject: q.subject
      }))

      setQuestions(formattedQuestions)
    } catch (err) {
      console.error('Fetch questions error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
      
      // Calculate results
      const answeredQuestions = questions.map(q => ({
        questionId: q.id,
        userAnswer: answers[q.id] ?? -1,
        isCorrect: answers[q.id] === q.correctAnswer
      }))

      const correct = answeredQuestions.filter(a => a.isCorrect).length
      const attempted = Object.keys(answers).length
      const score = Math.round((correct / questions.length) * 100)
      const timeTaken = (questions.length * timePerQuestion) - (timeLeft || 0)

      // Save results to backend
      try {
        // Get fresh token for saving results
        let saveHeaders = { 'Content-Type': 'application/json' }
        if (currentUser) {
          try {
            const freshToken = await currentUser.getIdToken()
            saveHeaders['Authorization'] = `Bearer ${freshToken}`
          } catch (e) {
            console.warn('Auth token not available for saving results')
          }
        }

        const response = await fetch(`${BASE_URL}/api/v2/competitive/submit-result`, {
          method: 'POST',
          headers: saveHeaders,
          body: JSON.stringify({
            category,
            subject,
            score,
            totalQuestions: questions.length,
            correctAnswers: correct,
            timeTaken,
            answers: answeredQuestions
          })
        })
        
        if (response.ok) {
          // Update streak on server
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
            const streakToken = currentUser ? await currentUser.getIdToken() : null
            if (streakToken) {
              await fetch(`${API_URL}/users/update-streak`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${streakToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityType: 'competitive' })
              })
            }
          } catch (e) { /* streak update is non-blocking */ }
        }
      } catch (saveError) {
        console.warn('Could not save result to server:', saveError)
      }

      setResults({
        score,
        correct,
        total: questions.length,
        attempted,
        timeSpent: timeTaken,
        answers: answeredQuestions
      })

      setTestCompleted(true)

    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const containerClasses = isDarkMode 
    ? 'min-h-screen bg-gray-900 text-white' 
    : 'min-h-screen bg-gray-50 text-gray-900'

  const cardClasses = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200'

  // Loading state
  if (loading) {
    return (
      <div className={`${containerClasses} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Loading questions...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`${containerClasses} flex items-center justify-center`}>
        <div className={`${cardClasses} border rounded-2xl p-8 max-w-md text-center`}>
          <span className="text-6xl mb-4 block">😔</span>
          <h2 className="text-xl font-bold mb-2">Oops!</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => navigate('/competitive-exams')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Results view
  if (testCompleted && results) {
    return (
      <div className={containerClasses}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${cardClasses} border rounded-2xl p-8 text-center mb-8`}
          >
            <h1 className="text-3xl font-bold mb-4">Test Completed! 🎉</h1>
            
            {/* Score Circle */}
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${
              results.score >= 70 ? 'bg-green-500' : results.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            } text-white`}>
              <div>
                <div className="text-4xl font-bold">{results.score}%</div>
                <div className="text-sm">Score</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4`}>
                <div className="text-2xl font-bold text-green-500">{results.correct}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Correct</div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4`}>
                <div className="text-2xl font-bold text-red-500">{results.total - results.correct}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wrong</div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4`}>
                <div className="text-2xl font-bold text-blue-500">{results.attempted}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Attempted</div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4`}>
                <div className="text-2xl font-bold text-purple-500">{formatTime(results.timeSpent)}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setTestCompleted(false)
                  setResults(null)
                  setAnswers({})
                  setCurrentIndex(0)
                  setTimeLeft(null)
                  fetchQuestions()
                }}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => navigate('/exam/leaderboard')}
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => navigate('/competitive-exams')}
                className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} px-6 py-3 rounded-lg font-medium hover:opacity-80 transition-opacity`}
              >
                📚 More Exams
              </button>
            </div>
          </motion.div>

          {/* Review Questions */}
          <div className={`${cardClasses} border rounded-2xl p-6`}>
            <h2 className="text-xl font-bold mb-4">Review Answers</h2>
            <div className="space-y-4">
              {questions.map((q, index) => {
                const userAnswer = answers[q.id]
                const isCorrect = userAnswer === q.correctAnswer
                
                return (
                  <div 
                    key={q.id} 
                    className={`p-4 rounded-xl border ${
                      userAnswer === undefined 
                        ? isDarkMode ? 'border-gray-600' : 'border-gray-300'
                        : isCorrect 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-red-500 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`${
                        userAnswer === undefined ? 'bg-gray-500' : isCorrect ? 'bg-green-500' : 'bg-red-500'
                      } text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium mb-2">{q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {q.options.map((opt, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`px-3 py-2 rounded-lg ${
                                optIndex === q.correctAnswer 
                                  ? 'bg-green-500 text-white'
                                  : optIndex === userAnswer && optIndex !== q.correctAnswer
                                    ? 'bg-red-500 text-white'
                                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main test view
  const currentQuestion = questions[currentIndex]

  return (
    <div className={containerClasses}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Header */}
        <div className={`${cardClasses} border rounded-xl p-4 mb-4 flex items-center justify-between`}>
          <div>
            <h1 className="font-bold capitalize">{category.replace('-', ' ')} - {subject}</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-green-500'}`}>
            ⏱️ {formatTime(timeLeft || 0)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`${cardClasses} border rounded-2xl p-6 mb-6`}
          >
            <p className="text-lg font-medium mb-6">{currentQuestion.question}</p>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion.id, index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentQuestion.id] === index
                      ? 'border-blue-500 bg-blue-500/10'
                      : isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                    answers[currentQuestion.id] === index
                      ? 'bg-blue-500 text-white'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-lg font-medium ${
              currentIndex === 0 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            ← Previous
          </button>

          {/* Question Palette */}
          <div className="hidden md:flex gap-2 flex-wrap justify-center max-w-md">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  index === currentIndex
                    ? 'bg-blue-500 text-white'
                    : answers[q.id] !== undefined
                      ? 'bg-green-500 text-white'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test ✓'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Next →
            </button>
          )}
        </div>

        {/* Mobile Question Palette */}
        <div className="md:hidden mt-6 flex gap-2 flex-wrap justify-center">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                index === currentIndex
                  ? 'bg-blue-500 text-white'
                  : answers[q.id] !== undefined
                    ? 'bg-green-500 text-white'
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CompetitiveTest
