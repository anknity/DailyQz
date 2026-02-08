import { motion } from 'framer-motion'
import { useTest } from '../context/TestContext'
import { FiFlag, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

/**
 * QuestionCard Component
 * Displays a single question with options
 */
const QuestionCard = () => {
  const {
    currentQuestion,
    currentQuestionIndex,
    questions,
    answers,
    markedQuestions,
    selectAnswer,
    nextQuestion,
    prevQuestion,
    toggleMarkQuestion
  } = useTest()

  if (!currentQuestion) {
    return (
      <div className="bg-white dark:bg-dark-200 rounded-2xl p-8 shadow-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">No question available</p>
      </div>
    )
  }

  const selectedOption = answers[currentQuestion.id]
  const isMarked = markedQuestions.has(currentQuestion.id)

  const handleOptionSelect = (optionIndex) => {
    selectAnswer(currentQuestion.id, optionIndex)
  }

  return (
    <motion.div
      key={currentQuestion.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white dark:bg-dark-200 rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Question header */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-dark-100 border-b border-gray-200 dark:border-dark-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold">
              Q{currentQuestionIndex + 1}/{questions.length}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
              currentQuestion.difficulty === 'easy'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : currentQuestion.difficulty === 'medium'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>
              {currentQuestion.difficulty}
            </span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleMarkQuestion(currentQuestion.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isMarked
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-gray-100 dark:bg-dark-200 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-100'
            }`}
          >
            <FiFlag className="w-4 h-4" />
            {isMarked ? 'Marked' : 'Mark'}
          </motion.button>
        </div>
      </div>

      {/* Question content */}
      <div className="p-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleOptionSelect(option.index)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedOption === option.index
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-dark-100 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-dark-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    selectedOption === option.index
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={`flex-1 ${
                  selectedOption === option.index
                    ? 'text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option.text}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-dark-100 border-t border-gray-200 dark:border-dark-100">
        <div className="flex justify-between items-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 dark:bg-dark-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-100'
            }`}
          >
            <FiChevronLeft className="w-5 h-5" />
            Previous
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuestionIndex === questions.length - 1
                ? 'bg-gray-100 dark:bg-dark-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Next
            <FiChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default QuestionCard
