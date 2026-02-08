import { motion } from 'framer-motion'
import { useTest } from '../context/TestContext'

/**
 * QuestionPalette Component
 * Grid of question numbers showing attempted/unattempted status
 */
const QuestionPalette = ({ onQuestionClick }) => {
  const { questions, currentQuestionIndex, getQuestionStatus, goToQuestion } = useTest()

  const handleClick = (index) => {
    goToQuestion(index)
    if (onQuestionClick) onQuestionClick(index)
  }

  return (
    <div className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Question Navigator
      </h3>
      
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const { isAttempted, isMarked } = getQuestionStatus(question.id)
          const isCurrent = index === currentQuestionIndex
          
          let className = 'question-btn '
          
          if (isCurrent) {
            className += 'current'
          } else if (isMarked) {
            className += 'marked'
          } else if (isAttempted) {
            className += 'attempted'
          } else {
            className += 'unattempted'
          }
          
          return (
            <motion.button
              key={question.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(index)}
              className={className}
            >
              {index + 1}
            </motion.button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-dark-100"></div>
            <span className="text-gray-600 dark:text-gray-400">Not Attempted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Attempted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Marked</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionPalette
