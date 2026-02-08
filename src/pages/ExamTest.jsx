import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, QuestionPalette } from '../components'
import { 
  FiClock, 
  FiChevronLeft, 
  FiChevronRight,
  FiFlag,
  FiCheck,
  FiAlertCircle,
  FiGrid
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Exam configuration
const EXAM_CONFIG = {
  TOTAL_QUESTIONS: 50,
  TIME_LIMIT_SECONDS: 60 * 60 // 60 minutes
}

/**
 * Exam Test Page
 * Handles the actual exam with 50 questions and 60-minute timer
 */
const ExamTest = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { category, subcategory, categoryName } = location.state || {}
  
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [timeRemaining, setTimeRemaining] = useState(EXAM_CONFIG.TIME_LIMIT_SECONDS)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [examStarted, setExamStarted] = useState(false)
  
  const timerRef = useRef(null)
  const examIdRef = useRef(null)

  // Redirect if no category selected
  useEffect(() => {
    if (!category) {
      navigate('/exam')
    }
  }, [category, navigate])

  const getAuthHeaders = async () => {
    const token = await currentUser.getIdToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Fetch exam questions
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!category) return
      
      try {
        setLoading(true)
        const headers = await getAuthHeaders()
        
        let url = `${API_URL}/exam/questions?category=${category}`
        if (subcategory) {
          url += `&subcategory=${subcategory}`
        }
        
        const response = await fetch(url, { headers })
        const data = await response.json()
        
        if (data.success && data.data?.questions) {
          setQuestions(data.data.questions || [])
          examIdRef.current = data.data.examId
          setExamStarted(true)
        } else {
          console.error('Invalid exam data:', data)
          alert('Failed to load exam questions')
          navigate('/exam')
        }
      } catch (error) {
        console.error('Error fetching exam questions:', error)
        alert('Error loading exam')
        navigate('/exam')
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuestions()
  }, [category, subcategory])

  // Timer countdown
  useEffect(() => {
    if (!examStarted || loading) return
    
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [examStarted, loading])

  // Prevent accidental page leave
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (examStarted && !submitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [examStarted, submitting])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-red-500' // Less than 5 min
    if (timeRemaining <= 900) return 'text-orange-500' // Less than 15 min
    return 'text-green-500'
  }

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }

  const toggleMarkForReview = (questionId) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index)
    setShowPalette(false)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleAutoSubmit = async () => {
    await submitExam()
  }

  const submitExam = async () => {
    if (submitting) return
    
    try {
      setSubmitting(true)
      clearInterval(timerRef.current)
      
      const headers = await getAuthHeaders()
      
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }))
      
      const response = await fetch(`${API_URL}/exam/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          examId: examIdRef.current,
          category,
          subcategory,
          answers: formattedAnswers,
          timeSpent: EXAM_CONFIG.TIME_LIMIT_SECONDS - timeRemaining
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update streak on server
        try {
          await fetch(`${API_URL}/users/update-streak`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ activityType: 'exam' })
          })
        } catch (e) { /* streak update is non-blocking */ }

        navigate('/exam/result', { 
          state: { 
            result: data.data,
            questions,
            answers,
            category: categoryName
          },
          replace: true
        })
      } else {
        alert('Failed to submit exam')
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      alert('Error submitting exam')
    } finally {
      setSubmitting(false)
    }
  }

  const getQuestionStatus = (index) => {
    const question = questions[index]
    const isAnswered = answers.hasOwnProperty(question?.id)
    const isMarked = markedForReview.has(question?.id)
    const isCurrent = index === currentQuestionIndex
    
    return { isAnswered, isMarked, isCurrent }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <LoadingSpinner text="Loading exam questions..." />
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No questions available for this category
          </p>
          <button
            onClick={() => navigate('/exam')}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const markedCount = markedForReview.size

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300">
      {/* Header with Timer */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              📝 {categoryName || 'Exam'}
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono font-bold text-xl ${getTimerColor()}`}>
              <FiClock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
            
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-100 hover:bg-gray-200 dark:hover:bg-dark-50 transition-colors"
            >
              <FiGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-dark-100">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-purple-600 transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Question Card */}
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-lg"
          >
            {/* Question Header */}
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                Q{currentQuestionIndex + 1}
              </span>
              
              <button
                onClick={() => toggleMarkForReview(currentQuestion.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  markedForReview.has(currentQuestion.id)
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-dark-100 dark:text-gray-400 hover:bg-orange-50'
                }`}
              >
                <FiFlag className="w-4 h-4" />
                {markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
              </button>
            </div>
            
            {/* Question Text */}
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              {currentQuestion.question}
            </h2>
            
            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    answers[currentQuestion.id] === index
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-100 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-dark-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      answers[currentQuestion.id] === index
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-200 border-t border-gray-200 dark:border-dark-100 py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-dark-100'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-100 dark:text-gray-300 dark:hover:bg-dark-50'
            }`}
          >
            <FiChevronLeft /> Previous
          </button>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400">
              ✓ Answered: {answeredCount}/{questions.length}
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              ⚑ Marked: {markedCount}
            </span>
          </div>
          
          <div className="flex gap-2">
            {/* Submit button - always visible */}
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FiCheck /> Submit
            </button>
            
            {currentQuestionIndex < questions.length - 1 && (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Next <FiChevronRight />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Question Palette Modal */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowPalette(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Question Navigator
              </h3>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 rounded" />
                  Answered
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-500 rounded" />
                  Marked
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-300 dark:bg-dark-100 rounded" />
                  Not Answered
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 border-2 border-primary-500 rounded" />
                  Current
                </span>
              </div>
              
              {/* Question Grid */}
              <div className="grid grid-cols-10 gap-2">
                {questions.map((q, index) => {
                  const { isAnswered, isMarked, isCurrent } = getQuestionStatus(index)
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                        isCurrent ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                      } ${
                        isMarked
                          ? 'bg-orange-500 text-white'
                          : isAnswered
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full mt-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                Submit Exam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <FiAlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Submit Exam?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You have answered {answeredCount} out of {questions.length} questions.
                </p>
                
                {answeredCount < questions.length && (
                  <p className="text-orange-600 dark:text-orange-400 text-sm mb-4">
                    ⚠️ {questions.length - answeredCount} questions are unanswered
                  </p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-50 transition-colors"
                  >
                    Review Again
                  </button>
                  <button
                    onClick={submitExam}
                    disabled={submitting}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExamTest
