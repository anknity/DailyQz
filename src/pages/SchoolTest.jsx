import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Timer, QuestionPalette, LoadingSpinner } from '../components'
import { 
  FiArrowLeft, 
  FiArrowRight, 
  FiCheck, 
  FiClock,
  FiFlag,
  FiAlertCircle
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SchoolTest = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, getAuthHeaders } = useAuth()
  
  const testConfig = location.state?.testConfig
  const testTitle = location.state?.title || 'School Test'
  
  // State
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [timeLeft, setTimeLeft] = useState(testConfig?.duration * 60 || 1800)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [error, setError] = useState(null)

  // Fetch questions on mount
  useEffect(() => {
    if (!testConfig) {
      navigate('/schools')
      return
    }
    fetchQuestions()
  }, [testConfig])

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Fetch questions from API
  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const headers = await getAuthHeaders()
      
      const subjectName = testConfig.subject || 'Mathematics'
      const classNum = parseInt(testConfig.class) || 10
      const questionCount = testConfig.questionCount || 20
      const difficulty = testConfig.difficulty || 'medium'
      
      // Determine category based on class
      // class-11-12 has 99 questions available
      let category = classNum >= 11 ? 'class-11-12' : 'class-9-10'
      
      // Map school subjects to database categories (ordered by best match)
      const subjectToCategoryMap = {
        'Mathematics': ['Quantitative Aptitude', 'class-11-12'],
        'English': ['class-11-12'],
        'Science': ['class-11-12'],
        'Physics': ['class-11-12'],
        'Chemistry': ['class-11-12'],
        'Computer Science': ['web-development', 'data-science'],
        'Reasoning': ['Logical Reasoning'],
        'Aptitude': ['Quantitative Aptitude'],
      }
      
      // Get alternative categories for the subject
      const altCategories = subjectToCategoryMap[subjectName] || [category]
      
      // Try fetch strategies — always pass subject for filtering
      const fetchStrategies = [
        // Strategy 1: Subject + class category
        { category, subject: subjectName },
        // Strategy 2: Subject + alternative categories
        ...altCategories.map(cat => ({ category: cat, subject: subjectName })),
        // Strategy 3: Subject only (any category)
        { subject: subjectName },
        // Strategy 4: Category only (no subject filter)
        { category },
      ]
      
      for (const filters of fetchStrategies) {
        const params = new URLSearchParams({
          count: questionCount.toString(),
          ...(filters.category && { category: filters.category }),
          ...(filters.subject && { subject: filters.subject }),
          ...(difficulty !== 'mixed' && { difficulty })
        })
        
        console.log(`🔍 Trying fetch with params:`, params.toString())
        
        try {
          // Try question bank API
          const response = await fetch(`${API_URL}/exams/questions/random?${params}`, { headers })

          if (response.ok) {
            const data = await response.json()
            
            if (data.success && data.data?.length > 0) {
              const formattedQuestions = formatQuestionsFromDB(data.data)
              console.log(`✅ Loaded ${formattedQuestions.length} questions from category: ${filters.category || 'any'}`)
              setQuestions(formattedQuestions)
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.warn('Primary API failed, trying next strategy')
        }
        
        try {
          // Try competitive route as backup
          const compResponse = await fetch(`${API_URL.replace('/api', '')}/api/v2/competitive/questions/random?${params}`, { headers })
          
          if (compResponse.ok) {
            const compData = await compResponse.json()
            
            if (compData.success && compData.data?.length > 0) {
              const formattedQuestions = formatQuestionsFromDB(compData.data)
              console.log(`✅ Loaded ${formattedQuestions.length} questions from competitive bank`)
              setQuestions(formattedQuestions)
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.warn('Competitive API failed, trying next strategy')
        }
      }
      
      // If all strategies fail, use mock questions
      console.warn('⚠️ No questions found in database, using mock questions')
      setQuestions(generateMockQuestions(testConfig))
    } catch (err) {
      console.error('Error fetching questions:', err)
      setQuestions(generateMockQuestions(testConfig))
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to format questions from database
  const formatQuestionsFromDB = (questions) => {
    return questions.map((q, index) => {
      let options = q.options
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options)
        } catch (e) {
          options = ['Option A', 'Option B', 'Option C', 'Option D']
        }
      }
      
      return {
        id: q.id || `q-${index + 1}`,
        question: q.text || q.question_text,
        options: Array.isArray(options) ? options.map(opt => typeof opt === 'string' ? opt : opt.text || String(opt)) : [],
        correctAnswer: q.correctAnswer ?? q.correct_answer ?? 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        category: q.category,
        subject: q.subject
      }
    })
  }

  // Generate mock questions for fallback
  const generateMockQuestions = (config) => {
    const subject = config.subject || 'Mathematics'
    const classNum = config.class || 10
    const count = config.questionCount || 20
    
    const mockQuestions = []
    
    for (let i = 0; i < count; i++) {
      mockQuestions.push({
        id: `q-${i + 1}`,
        question: `${subject} Question ${i + 1} for Class ${classNum}: Sample question about ${subject.toLowerCase()} concepts.`,
        options: [
          `Option A - Answer choice 1`,
          `Option B - Answer choice 2`,
          `Option C - Answer choice 3`,
          `Option D - Answer choice 4`
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `This is the explanation for the correct answer.`,
        difficulty: config.difficulty || 'medium',
        category: subject.toLowerCase().replace(/\s+/g, '-'),
        subcategory: `class-${classNum}`
      })
    }
    
    return mockQuestions
  }

  // Handle answer selection
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }))
  }

  // Toggle mark for review
  const toggleMarkForReview = (index) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // Navigate to question
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index)
    setShowPalette(false)
  }

  // Handle test submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Calculate results
    let correct = 0
    let incorrect = 0
    let unanswered = 0
    
    questions.forEach((q, index) => {
      if (answers[index] === undefined) {
        unanswered++
      } else if (answers[index] === q.correctAnswer) {
        correct++
      } else {
        incorrect++
      }
    })
    
    const score = Math.round((correct / questions.length) * 100)
    const timeTaken = (testConfig?.duration * 60 || 1800) - timeLeft
    
    const result = {
      testTitle,
      testConfig,
      questions,
      answers,
      correct,
      incorrect,
      unanswered,
      total: questions.length,
      score,
      timeTaken,
      submittedAt: new Date().toISOString()
    }

    // Update streak on server
    try {
      const token = currentUser ? await currentUser.getIdToken() : null
      if (token) {
        await fetch(`${API_URL}/users/update-streak`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ activityType: 'school' })
        })

        // Save result to backend for leaderboard
        await fetch(`${API_URL.replace('/api', '')}/api/v2/school-exams/submit-result`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classLevel: testConfig.class || testConfig.classLevel,
            stream: testConfig.stream || null,
            subject: testConfig.subject || 'General',
            score,
            totalQuestions: questions.length,
            correctAnswers: correct,
            wrongAnswers: incorrect,
            unanswered,
            timeTaken,
            testTitle,
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || null
          })
        })
      }
    } catch (e) { /* streak/result save is non-blocking */ }
    
    // Navigate to result page
    navigate('/school-result', { state: { result } })
  }

  // Get question status for palette
  const getQuestionStatus = useCallback((index) => {
    if (markedForReview.has(index)) return 'review'
    if (answers[index] !== undefined) return 'answered'
    return 'not-visited'
  }, [answers, markedForReview])

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading questions...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Test</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/schools')}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300">
      {/* Header */}
      <header className="bg-white dark:bg-dark-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{testTitle}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 300 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
              'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            }`}>
              <FiClock className="w-5 h-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
            
            {/* Question Palette Toggle */}
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-100 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
            >
              {Object.keys(answers).length}/{questions.length} Answered
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 lg:mr-80">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-lg"
            >
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {currentQuestion.difficulty?.charAt(0).toUpperCase() + currentQuestion.difficulty?.slice(1)}
                  </span>
                  <button
                    onClick={() => toggleMarkForReview(currentQuestionIndex)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                      markedForReview.has(currentQuestionIndex)
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-dark-100 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <FiFlag className="w-4 h-4" />
                    {markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}
                  </button>
                </div>
                
                <h2 className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestionIndex] === index
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-dark-100 hover:border-primary-300 dark:hover:border-primary-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className={`flex-1 ${isSelected ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {option}
                        </span>
                        {isSelected && (
                          <FiCheck className="w-5 h-5 text-primary-500" />
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-200 rounded-xl font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              <FiArrowLeft className="w-5 h-5" />
              Previous
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <FiCheck className="w-5 h-5" />
                Submit Test
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Next
                <FiArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </main>

        {/* Question Palette Sidebar - Always visible on desktop */}
        <aside className="hidden lg:block w-80 bg-white dark:bg-dark-200 shadow-lg p-4 fixed right-0 top-16 bottom-0 overflow-y-auto">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Question Palette</h3>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-300 dark:bg-dark-100"></div>
              <span className="text-gray-600 dark:text-gray-400">Not Visited</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Marked</span>
            </div>
          </div>
          
          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => {
              const status = getQuestionStatus(index)
              const isCurrent = index === currentQuestionIndex
              
              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                    isCurrent ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                  } ${
                    status === 'answered' ? 'bg-green-500 text-white' :
                    status === 'review' ? 'bg-purple-500 text-white' :
                    'bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          
          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-100 rounded-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{Object.keys(answers).length}</div>
                <div className="text-xs text-gray-500">Answered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{markedForReview.size}</div>
                <div className="text-xs text-gray-500">Marked</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">
                  {questions.length - Object.keys(answers).length}
                </div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
          >
            Submit Test
          </button>
        </aside>

        {/* Mobile Question Palette (toggled) */}
        <AnimatePresence>
          {showPalette && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="lg:hidden w-80 bg-white dark:bg-dark-200 shadow-lg p-4 fixed right-0 top-16 bottom-0 overflow-y-auto z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Question Palette</h3>
                <button 
                  onClick={() => setShowPalette(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-300 dark:bg-dark-100"></div>
                  <span className="text-gray-600 dark:text-gray-400">Not Visited</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-purple-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Marked</span>
                </div>
              </div>
              
              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index)
                  const isCurrent = index === currentQuestionIndex
                  
                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                        isCurrent ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                      } ${
                        status === 'answered' ? 'bg-green-500 text-white' :
                        status === 'review' ? 'bg-purple-500 text-white' :
                        'bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              
              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-100 rounded-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{Object.keys(answers).length}</div>
                    <div className="text-xs text-gray-500">Answered</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{markedForReview.size}</div>
                    <div className="text-xs text-gray-500">Marked</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-600">
                      {questions.length - Object.keys(answers).length}
                    </div>
                    <div className="text-xs text-gray-500">Remaining</div>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium"
              >
                Submit Test
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubmitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Submit Test?
              </h3>
              
              <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{Object.keys(answers).length}</div>
                    <div className="text-sm text-gray-500">Answered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{markedForReview.size}</div>
                    <div className="text-sm text-gray-500">Marked</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {questions.length - Object.keys(answers).length}
                    </div>
                    <div className="text-sm text-gray-500">Unanswered</div>
                  </div>
                </div>
              </div>
              
              {questions.length - Object.keys(answers).length > 0 && (
                <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-4 flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4" />
                  You have unanswered questions. Are you sure you want to submit?
                </p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SchoolTest
