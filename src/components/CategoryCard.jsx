import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES, DIFFICULTY_LEVELS } from '../context/TestContext'
import { FiChevronDown } from 'react-icons/fi'

/**
 * CategoryCard Component
 * Displays a category option for test selection with optional subcategories
 * Supports multi-select mode
 */
export const CategoryCard = ({ category, isSelected, onClick, onSubcategorySelect, selectedSubcategory, multiSelect = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasSubcategories = category.subcategories && category.subcategories.length > 0
  
  const handleClick = () => {
    onClick(category)
    if (hasSubcategories && !multiSelect) {
      setIsExpanded(!isExpanded)
    }
  }
  
  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left relative ${
          isSelected
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
            : 'border-gray-200 dark:border-dark-100 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-dark-200'
        }`}
      >
        {multiSelect && isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <span className={`font-medium block ${
                isSelected
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {category.name}
              </span>
              {category.description && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {category.description}
                </span>
              )}
            </div>
          </div>
          {hasSubcategories && !multiSelect && (
            <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
              isSelected && isExpanded ? 'rotate-180' : ''
            }`} />
          )}
        </div>
      </motion.button>
      
      {/* Subcategories */}
      <AnimatePresence>
        {isSelected && hasSubcategories && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 mt-2 space-y-2"
          >
            {/* All option */}
            <button
              onClick={() => onSubcategorySelect && onSubcategorySelect(null)}
              className={`w-full p-2 rounded-lg text-left text-sm transition-all ${
                !selectedSubcategory
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-50 dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-50 text-gray-600 dark:text-gray-400'
              }`}
            >
              All {category.name}
            </button>
            
            {category.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSubcategorySelect && onSubcategorySelect(sub)}
                className={`w-full p-2 rounded-lg text-left text-sm transition-all ${
                  selectedSubcategory?.id === sub.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-50 dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-50 text-gray-600 dark:text-gray-400'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * DifficultyCard Component
 * Displays a difficulty option for test selection
 */
export const DifficultyCard = ({ difficulty, isSelected, onClick }) => {
  const colorClasses = {
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  }

  const selectedClass = colorClasses[difficulty.color]
  const defaultClass = 'border-gray-200 dark:border-dark-100 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-300'

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(difficulty)}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
        isSelected ? selectedClass : defaultClass
      }`}
    >
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{difficulty.name}</span>
        <span className={`text-sm ${
          isSelected ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {difficulty.description}
        </span>
      </div>
    </motion.button>
  )
}

export default { CategoryCard, DifficultyCard }
