import { createContext, useContext, useState, useCallback } from 'react'
import { getQuestions } from '../services/questionService'

const TestContext = createContext()

// Custom hook to use test context
export const useTest = () => {
  const context = useContext(TestContext)
  if (!context) {
    throw new Error('useTest must be used within a TestProvider')
  }
  return context
}

// Test configuration constants
export const TEST_CONFIG = {
  TOTAL_QUESTIONS: 20,
  TIME_LIMIT_MINUTES: 25,
  TIME_LIMIT_SECONDS: 25 * 60, // 1500 seconds
  SUSPENSE_DURATION: 5, // 5 seconds (change to 60 for production)
}

// Categories available for tests with subcategories
export const CATEGORIES = [
  { 
    id: 'web-development', 
    name: 'Web Development', 
    icon: '🌐',
    description: 'Frontend & Backend Technologies',
    subcategories: [
      { id: 'html-css', name: 'HTML/CSS' },
      { id: 'javascript', name: 'JavaScript' },
      { id: 'react', name: 'React' },
      { id: 'tailwind', name: 'Tailwind CSS' }
    ]
  },
  { 
    id: 'dsa', 
    name: 'Data Structures & Algorithms', 
    icon: '🧮',
    description: 'Arrays, Trees, Graphs & more',
    subcategories: [
      { id: 'arrays', name: 'Arrays' },
      { id: 'linked-lists', name: 'Linked Lists' },
      { id: 'trees', name: 'Trees' },
      { id: 'graphs', name: 'Graphs' },
      { id: 'dynamic-programming', name: 'Dynamic Programming' },
      { id: 'stacks-queues', name: 'Stacks & Queues' },
      { id: 'sorting', name: 'Sorting' },
      { id: 'searching', name: 'Searching' },
      { id: 'recursion', name: 'Recursion' }
    ]
  },
  { 
    id: 'aptitude', 
    name: 'Aptitude', 
    icon: '🧠',
    description: 'Quantitative, Logical & Verbal',
    subcategories: [
      { id: 'quantitative', name: 'Quantitative' },
      { id: 'logical', name: 'Logical Reasoning' },
      { id: 'verbal', name: 'Verbal Ability' },
      { id: 'data-interpretation', name: 'Data Interpretation' }
    ]
  },
  { 
    id: 'neet', 
    name: 'NEET Preparation', 
    icon: '🔬',
    description: 'Physics, Chemistry, Biology',
    subcategories: [
      { id: 'physics', name: 'Physics' },
      { id: 'chemistry-organic', name: 'Organic Chemistry' },
      { id: 'chemistry-inorganic', name: 'Inorganic Chemistry' },
      { id: 'chemistry-physical', name: 'Physical Chemistry' },
      { id: 'biology-botany', name: 'Botany' },
      { id: 'biology-zoology', name: 'Zoology' }
    ]
  },
  { 
    id: 'artificial-intelligence', 
    name: 'AI & Machine Learning', 
    icon: '🤖',
    description: 'ML, Deep Learning, NLP'
  },
  { 
    id: 'data-science', 
    name: 'Data Science', 
    icon: '📊',
    description: 'Python, Statistics, Visualization'
  },
  { 
    id: 'networking', 
    name: 'Networking', 
    icon: '🔗',
    description: 'Protocols, Security, Architecture'
  },
]

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', color: 'green', description: 'Basic theory questions' },
  { id: 'medium', name: 'Medium', color: 'yellow', description: 'Practical & logic based' },
  { id: 'hard', name: 'Hard', color: 'red', description: 'Advanced & tricky' },
  { id: 'ai-mix', name: 'AI Mix', color: 'purple', description: 'Balanced mix (40/40/20)' },
]

export const TestProvider = ({ children }) => {
  // Test configuration state
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  
  // Test state
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: selectedOptionIndex }
  const [markedQuestions, setMarkedQuestions] = useState(new Set())
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(TEST_CONFIG.TIME_LIMIT_SECONDS)
  const [testStartTime, setTestStartTime] = useState(null)
  const [testEndTime, setTestEndTime] = useState(null)
  
  // Test status
  const [isTestActive, setIsTestActive] = useState(false)
  const [isTestSubmitted, setIsTestSubmitted] = useState(false)
  
  // Results
  const [testResult, setTestResult] = useState(null)

  // Initialize test with selected category/categories and difficulty
  const initializeTest = useCallback(async (categories, difficulty, subcategory = null) => {
    try {
      // Support both single category (string) and multiple categories (array)
      const categoryArray = Array.isArray(categories) ? categories : [categories]
      
      const fetchedQuestions = await getQuestions(categoryArray, difficulty, TEST_CONFIG.TOTAL_QUESTIONS, subcategory)
      
      setSelectedCategory(categoryArray.length === 1 ? categoryArray[0] : categoryArray)
      setSelectedSubcategory(subcategory)
      setSelectedDifficulty(difficulty)
      setQuestions(fetchedQuestions)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setMarkedQuestions(new Set())
      setTimeRemaining(TEST_CONFIG.TIME_LIMIT_SECONDS)
      setTestStartTime(null)
      setTestEndTime(null)
      setIsTestActive(false)
      setIsTestSubmitted(false)
      setTestResult(null)
      
      return fetchedQuestions
    } catch (error) {
      console.error('Error initializing test:', error)
      throw error
    }
  }, [])

  // Start the test
  const startTest = useCallback(() => {
    setTestStartTime(Date.now())
    setIsTestActive(true)
  }, [])

  // Select an answer for current question
  const selectAnswer = useCallback((questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }, [])

  // Navigate to specific question
  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
    }
  }, [questions.length])

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, questions.length])

  // Navigate to previous question
  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }, [currentQuestionIndex])

  // Mark/unmark question for review
  const toggleMarkQuestion = useCallback((questionId) => {
    setMarkedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }, [])

  // Calculate test results
  const calculateResults = useCallback(() => {
    let correct = 0
    let wrong = 0
    let unattempted = 0
    
    const questionResults = questions.map(question => {
      const userAnswer = answers[question.id]
      const isAttempted = userAnswer !== undefined
      const isCorrect = isAttempted && userAnswer === question.correctAnswer
      
      if (!isAttempted) {
        unattempted++
      } else if (isCorrect) {
        correct++
      } else {
        wrong++
      }
      
      return {
        ...question,
        userAnswer,
        isAttempted,
        isCorrect
      }
    })
    
    const totalQuestions = questions.length
    const score = Math.round((correct / totalQuestions) * 100)
    const timeTaken = testStartTime ? Math.round((Date.now() - testStartTime) / 1000) : 0
    
    return {
      totalQuestions,
      correct,
      wrong,
      unattempted,
      score,
      timeTaken,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      questionResults,
      submittedAt: new Date().toISOString()
    }
  }, [questions, answers, testStartTime, selectedCategory, selectedDifficulty])

  // Submit the test
  const submitTest = useCallback(() => {
    setTestEndTime(Date.now())
    setIsTestActive(false)
    setIsTestSubmitted(true)
    
    const results = calculateResults()
    setTestResult(results)
    
    return results
  }, [calculateResults])

  // Update timer
  const updateTimer = useCallback((newTime) => {
    setTimeRemaining(newTime)
  }, [])

  // Reset test state
  const resetTest = useCallback(() => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setSelectedDifficulty(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswers({})
    setMarkedQuestions(new Set())
    setTimeRemaining(TEST_CONFIG.TIME_LIMIT_SECONDS)
    setTestStartTime(null)
    setTestEndTime(null)
    setIsTestActive(false)
    setIsTestSubmitted(false)
    setTestResult(null)
  }, [])

  // Get current question
  const currentQuestion = questions[currentQuestionIndex] || null

  // Get attempt status for a question
  const getQuestionStatus = useCallback((questionId) => {
    const isAttempted = answers[questionId] !== undefined
    const isMarked = markedQuestions.has(questionId)
    return { isAttempted, isMarked }
  }, [answers, markedQuestions])

  // Get total attempted questions count
  const attemptedCount = Object.keys(answers).length

  const value = {
    // Configuration
    selectedCategory,
    selectedSubcategory,
    selectedDifficulty,
    
    // Questions
    questions,
    currentQuestion,
    currentQuestionIndex,
    
    // Answers
    answers,
    markedQuestions,
    
    // Timer
    timeRemaining,
    testStartTime,
    testEndTime,
    
    // Status
    isTestActive,
    isTestSubmitted,
    
    // Results
    testResult,
    
    // Computed
    attemptedCount,
    totalQuestions: TEST_CONFIG.TOTAL_QUESTIONS,
    
    // Actions
    initializeTest,
    startTest,
    selectAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    toggleMarkQuestion,
    submitTest,
    updateTimer,
    resetTest,
    getQuestionStatus,
    calculateResults,
  }

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  )
}
