import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTest, CATEGORIES, DIFFICULTY_LEVELS, TEST_CONFIG } from '../context/TestContext'
import { useTheme } from '../context/ThemeContext'

/**
 * DailyPractice Page
 * Allows users to select categories and difficulty for daily practice tests
 */
const DailyPractice = () => {
  const navigate = useNavigate()
  const { initializeTest } = useTest()
  const { isDark: isDarkMode } = useTheme()
  
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [loading, setLoading] = useState(false)

  // Handle category selection (multi-select)
  const handleCategorySelect = (category) => {
    setSelectedCategories(prev => {
      const isAlreadySelected = prev.some(c => c.id === category.id)
      if (isAlreadySelected) {
        return prev.filter(c => c.id !== category.id)
      }
      return [...prev, category]
    })
    setSelectedSubcategory(null)
  }

  // Handle difficulty selection
  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(prev => prev?.id === difficulty.id ? null : difficulty)
  }

  // Start the test
  const handleStartTest = async () => {
    if (selectedCategories.length === 0 || !selectedDifficulty) return
    
    try {
      setLoading(true)
      const categoryIds = selectedCategories.map(c => c.id)
      await initializeTest(categoryIds, selectedDifficulty.id, selectedSubcategory)
      navigate('/instructions')
    } catch (error) {
      console.error('Error starting test:', error)
      alert('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const containerClasses = isDarkMode 
    ? 'min-h-screen bg-gray-900 text-white' 
    : 'min-h-screen bg-gray-50 text-gray-900'

  const cardClasses = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200'

  return (
    <div className={containerClasses}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button & Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className={`mb-4 flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Daily Practice 📚</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select categories and difficulty level to customize your practice test
              </p>
            </div>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              🏆 Leaderboard
            </button>
          </div>
        </motion.div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📖 Select Categories
          </h2>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose one or more categories for your practice session
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategorySelect(category)}
                className={`${cardClasses} border rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 ${
                  selectedCategories.some(c => c.id === category.id)
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-lg'
                }`}
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="font-medium text-sm text-center">{category.name}</span>
                {category.subcategories && (
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                    {category.subcategories.length} topics
                  </span>
                )}
              </motion.button>
            ))}
          </div>
          
          {selectedCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mt-4 p-4 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-xl border ${isDarkMode ? 'border-blue-800' : 'border-blue-200'}`}
            >
              <p className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                ✓ Selected: {selectedCategories.map(c => c.name).join(', ')}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Difficulty Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🎯 Select Difficulty
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {DIFFICULTY_LEVELS.map((difficulty, index) => {
              const difficultyIcons = {
                'easy': '🟢',
                'medium': '🟡',
                'hard': '🔴',
                'ai-mix': '🎨'
              }
              return (
                <motion.button
                  key={difficulty.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDifficultySelect(difficulty)}
                  className={`${cardClasses} border rounded-xl p-5 text-left transition-all duration-200 ${
                    selectedDifficulty?.id === difficulty.id
                      ? 'ring-2 ring-blue-500 shadow-lg'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{difficulty.name}</span>
                    <span className="text-2xl">{difficultyIcons[difficulty.id]}</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {difficulty.description}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Test Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardClasses} border rounded-2xl p-6 mb-8`}
        >
          <h3 className="text-lg font-semibold mb-4">📋 Test Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📝</span>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Questions</p>
                <p className="text-xl font-bold">{TEST_CONFIG.TOTAL_QUESTIONS}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏱️</span>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time Limit</p>
                <p className="text-xl font-bold">{TEST_CONFIG.TIME_LIMIT_MINUTES} Minutes</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Start Test Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 md:p-8 shadow-lg"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">Ready to Challenge Yourself?</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/80">
                <span className="flex items-center gap-1">
                  📝 {TEST_CONFIG.TOTAL_QUESTIONS} Questions
                </span>
                <span className="flex items-center gap-1">
                  ⏱️ {TEST_CONFIG.TIME_LIMIT_MINUTES} Minutes
                </span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: selectedCategories.length > 0 && selectedDifficulty ? 1.05 : 1 }}
              whileTap={{ scale: selectedCategories.length > 0 && selectedDifficulty ? 0.95 : 1 }}
              onClick={handleStartTest}
              disabled={selectedCategories.length === 0 || !selectedDifficulty || loading}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                selectedCategories.length > 0 && selectedDifficulty
                  ? 'bg-white text-blue-600 hover:bg-gray-100 shadow-lg cursor-pointer'
                  : 'bg-white/30 text-white/60 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  🚀 Start Test
                </>
              )}
            </motion.button>
          </div>
          
          {(selectedCategories.length === 0 || !selectedDifficulty) && (
            <p className="text-white/70 text-sm text-center mt-4">
              Please select at least one category and difficulty level to start
            </p>
          )}
        </motion.div>

        {/* Features Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-8 ${cardClasses} border rounded-2xl p-6`}
        >
          <h3 className="text-lg font-semibold mb-4">Why Daily Practice? 🎓</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💪</span>
              <div>
                <h4 className="font-medium mb-1">Build Consistency</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Regular practice helps you stay sharp and improve continuously
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <h4 className="font-medium mb-1">Customizable Tests</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Mix and match categories to create your perfect practice session
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-medium mb-1">Track Progress</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Monitor your performance and identify areas for improvement
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DailyPractice
