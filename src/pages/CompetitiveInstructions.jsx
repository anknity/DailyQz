import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { 
  FiClock, 
  FiHelpCircle, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiArrowRight,
  FiArrowLeft
} from 'react-icons/fi'

/**
 * CompetitiveInstructions Page
 * Shows test instructions before starting competitive exams
 */
const CompetitiveInstructions = () => {
  const { category, subject } = useParams()
  const [searchParams] = useSearchParams()
  const { isDark: isDarkMode } = useTheme()
  const navigate = useNavigate()

  const count = parseInt(searchParams.get('count')) || 10
  const timePerQuestion = 90 // seconds
  const totalTime = Math.ceil((count * timePerQuestion) / 60) // minutes

  // Format category and subject names
  const formatName = (str) => {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleStart = () => {
    navigate(`/competitive-test/${category}/${subject}${searchParams.toString() ? '?' + searchParams.toString() : ''}`)
  }

  const handleBack = () => {
    navigate('/competitive-exams')
  }

  const instructions = [
    {
      icon: <FiHelpCircle className="w-5 h-5" />,
      title: 'Total Questions',
      description: `This test contains ${count} multiple choice questions based on real exam patterns.`
    },
    {
      icon: <FiClock className="w-5 h-5" />,
      title: 'Time Limit',
      description: `You have approximately ${totalTime} minutes to complete the test (90 seconds per question).`
    },
    {
      icon: <FiCheckCircle className="w-5 h-5" />,
      title: 'Navigation',
      description: 'You can navigate between questions freely and change your answers before submitting.'
    },
    {
      icon: <FiAlertTriangle className="w-5 h-5" />,
      title: 'Auto Submit',
      description: 'The test will be automatically submitted when the timer runs out.'
    }
  ]

  const rules = [
    'Do not refresh the page during the test',
    'Do not switch tabs or minimize the browser',
    'Ensure stable internet connection',
    'Read each question carefully before answering',
    'Use the question palette to track your progress'
  ]

  const containerClasses = isDarkMode 
    ? 'min-h-screen bg-gray-900 text-white' 
    : 'min-h-screen bg-gray-50 text-gray-900'

  const cardClasses = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200'

  return (
    <div className={containerClasses}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className={`mb-6 flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          ← Back to Exam Selection
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardClasses} border rounded-2xl shadow-lg overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8 text-white">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold mb-2"
            >
              Test Instructions
            </motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-2">
                📝 {formatName(category)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                {formatName(subject)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                {count} Questions
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Test Overview
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {instructions.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Rules */}
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Important Rules
            </h2>
            <div className={`border rounded-xl p-4 mb-8 ${isDarkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
              <ul className="space-y-2">
                {rules.map((rule, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}
                  >
                    <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {rule}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiArrowLeft className="w-5 h-5" />
                Go Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start Test
                <FiArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CompetitiveInstructions
