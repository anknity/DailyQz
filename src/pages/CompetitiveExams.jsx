import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Competitive exam categories with icons and colors
const EXAM_CATEGORIES = {
  companies: {
    title: 'IT Company Exams',
    description: 'Prepare for top IT company placement tests',
    items: [
      { id: 'tcs', name: 'TCS', icon: '🏢', color: 'bg-blue-500', subjects: ['Aptitude', 'Reasoning', 'Verbal', 'Programming'] },
      { id: 'infosys', name: 'Infosys', icon: '🌟', color: 'bg-orange-500', subjects: ['Aptitude', 'Reasoning', 'Puzzle'] },
      { id: 'wipro', name: 'Wipro', icon: '🌐', color: 'bg-purple-500', subjects: ['Aptitude', 'Verbal', 'Technical'] },
      { id: 'tech-mahindra', name: 'Tech Mahindra', icon: '💻', color: 'bg-cyan-500', subjects: ['Aptitude', 'Technical', 'English'] },
      { id: 'cognizant', name: 'Cognizant', icon: '🧠', color: 'bg-indigo-500', subjects: ['Aptitude', 'Reasoning', 'Coding'] },
      { id: 'accenture', name: 'Accenture', icon: '🚀', color: 'bg-violet-500', subjects: ['Aptitude', 'Reasoning', 'Verbal'] },
      { id: 'capgemini', name: 'Capgemini', icon: '⚡', color: 'bg-pink-500', subjects: ['Aptitude', 'Technical', 'English'] },
      { id: 'amazon', name: 'Amazon', icon: '📦', color: 'bg-yellow-600', subjects: ['DSA', 'System Design', 'OOPs'] },
      { id: 'google', name: 'Google', icon: '🔍', color: 'bg-red-500', subjects: ['DSA', 'System Design', 'Coding'] },
      { id: 'microsoft', name: 'Microsoft', icon: '🪟', color: 'bg-blue-600', subjects: ['DSA', 'System Design', 'OOPs'] }
    ]
  },
  government: {
    title: 'Government Exams',
    description: 'Practice for government job examinations',
    items: [
      { id: 'ssc', name: 'SSC', icon: '🏛️', color: 'bg-green-500', subjects: ['GK', 'Quantitative', 'English', 'Reasoning'] },
      { id: 'banking', name: 'Banking (IBPS/SBI)', icon: '🏦', color: 'bg-yellow-500', subjects: ['GK', 'Reasoning', 'English', 'Quantitative'] },
      { id: 'railway', name: 'Railway', icon: '🚂', color: 'bg-red-500', subjects: ['GK', 'Mathematics', 'Reasoning'] },
      { id: 'upsc', name: 'UPSC', icon: '📚', color: 'bg-amber-500', subjects: ['GK', 'Current Affairs', 'Essay', 'CSAT'] },
      { id: 'bihar-police', name: 'Bihar Police', icon: '👮', color: 'bg-emerald-500', subjects: ['GK', 'Hindi', 'Reasoning', 'Math'] },
      { id: 'state-psc', name: 'State PSC', icon: '🗳️', color: 'bg-teal-500', subjects: ['GK', 'State GK', 'Current Affairs'] }
    ]
  },
  nimcet: {
    title: 'NIMCET 2026',
    description: 'NIT MCA Common Entrance Test - 120 Questions, 1000 Marks',
    examInfo: {
      totalQuestions: 120,
      totalMarks: 1000,
      sections: [
        { name: 'Mathematics', questions: 50, marksPerQ: 12, negativeMarks: -3 },
        { name: 'Analytical Ability & Logical Reasoning', questions: 40, marksPerQ: 8, negativeMarks: -2 },
        { name: 'Computer Awareness', questions: 15, marksPerQ: 5, negativeMarks: -1 },
        { name: 'General English', questions: 15, marksPerQ: 5, negativeMarks: -1 }
      ]
    },
    items: [
      { id: 'nimcet', name: 'NIMCET Full Mock', icon: '🎓', color: 'bg-rose-500', subjects: ['Mathematics', 'Analytical Reasoning', 'Computer Awareness', 'English'], questionCount: 40, description: '10 questions from each section' },
      { id: 'nimcet-math', name: 'Mathematics', icon: '📐', color: 'bg-blue-600', subjects: ['Set Theory & Logic', 'Algebra', 'Calculus', 'Coordinate Geometry', 'Probability & Statistics'], questionCount: 20 },
      { id: 'nimcet-reasoning', name: 'Analytical Reasoning', icon: '🧠', color: 'bg-purple-600', subjects: ['Puzzles', 'Coding-Decoding', 'Blood Relations', 'Series', 'Syllogisms', 'Directions', 'Data Interpretation'], questionCount: 20 },
      { id: 'nimcet-computer', name: 'Computer Awareness', icon: '💻', color: 'bg-green-600', subjects: ['Computer Basics', 'Number Systems', 'Boolean Algebra', 'Operating Systems', 'Computer Architecture'], questionCount: 15 },
      { id: 'nimcet-english', name: 'General English', icon: '📝', color: 'bg-amber-600', subjects: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Sentence Structure', 'Idioms'], questionCount: 15 }
    ]
  },
  dsa: {
    title: 'Data Structures & Algorithms',
    description: 'Master DSA for coding interviews',
    items: [
      { id: 'dsa', name: 'DSA General', icon: '🔢', color: 'bg-indigo-600', subjects: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'DP'] },
      { id: 'dsa-arrays', name: 'Arrays & Strings', icon: '📊', color: 'bg-blue-500', subjects: ['Array Manipulation', 'Two Pointers', 'Sliding Window'] },
      { id: 'dsa-trees', name: 'Trees & BST', icon: '🌲', color: 'bg-green-600', subjects: ['Binary Trees', 'BST', 'Traversals'] },
      { id: 'dsa-graphs', name: 'Graphs', icon: '🕸️', color: 'bg-purple-600', subjects: ['BFS', 'DFS', 'Shortest Path', 'MST'] },
      { id: 'dsa-dp', name: 'Dynamic Programming', icon: '🎯', color: 'bg-red-600', subjects: ['1D DP', '2D DP', 'Knapsack', 'LCS'] }
    ]
  },
  technical: {
    title: 'Technical Skills',
    description: 'Programming languages and technologies',
    items: [
      { id: 'web-development', name: 'Web Dev', icon: '🌐', color: 'bg-orange-500', subjects: ['HTML/CSS', 'JavaScript', 'React', 'Node.js'] },
      { id: 'react', name: 'React.js', icon: '⚛️', color: 'bg-cyan-500', subjects: ['Hooks', 'State', 'Redux', 'Next.js'] },
      { id: 'javascript', name: 'JavaScript', icon: '🟨', color: 'bg-yellow-500', subjects: ['ES6+', 'DOM', 'Async', 'Closures'] },
      { id: 'python', name: 'Python', icon: '🐍', color: 'bg-blue-500', subjects: ['Basics', 'OOPs', 'Libraries', 'Frameworks'] },
      { id: 'java', name: 'Java', icon: '☕', color: 'bg-red-700', subjects: ['Core Java', 'OOPs', 'Collections', 'Spring'] },
      { id: 'database', name: 'Database', icon: '🗄️', color: 'bg-green-700', subjects: ['SQL', 'NoSQL', 'Design', 'Indexing'] },
      { id: 'system-design', name: 'System Design', icon: '🏗️', color: 'bg-purple-700', subjects: ['Scalability', 'Caching', 'Microservices'] }
    ]
  }
}

const CompetitiveExams = () => {
  const { currentUser, token } = useAuth()
  const { isDark: isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
      const response = await fetch(`${BASE_URL}/api/v2/competitive/categories`)
      if (response.ok) {
        const data = await response.json()
        // Stats from backend
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = (category, subject, count = 10) => {
    navigate(`/competitive-instructions/${category}/${subject}${count !== 10 ? '?count=' + count : ''}`)
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    setSelectedSubject(null)
  }

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject)
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
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Competitive Exams 🎯</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Practice for top IT companies and government job exams
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'} px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => navigate('/exam/leaderboard')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              🏆 Leaderboard
            </button>
          </div>
        </motion.div>

        {/* Category Selection or Subject Selection */}
        {!selectedCategory ? (
          <>
            {/* IT Companies Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                💼 {EXAM_CATEGORIES.companies.title}
              </h2>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {EXAM_CATEGORIES.companies.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {EXAM_CATEGORIES.companies.items.map((company, index) => (
                  <motion.button
                    key={company.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(company)}
                    className={`${cardClasses} border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-200`}
                  >
                    <span className="text-3xl mb-2">{company.icon}</span>
                    <span className="font-medium text-sm text-center">{company.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                      {company.subjects.length} subjects
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Government Exams Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🏛️ {EXAM_CATEGORIES.government.title}
              </h2>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {EXAM_CATEGORIES.government.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {EXAM_CATEGORIES.government.items.map((exam, index) => (
                  <motion.button
                    key={exam.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(exam)}
                    className={`${cardClasses} border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-200`}
                  >
                    <span className="text-3xl mb-2">{exam.icon}</span>
                    <span className="font-medium text-sm text-center">{exam.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                      {exam.subjects.length} subjects
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* DSA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-10"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🔢 {EXAM_CATEGORIES.dsa.title}
              </h2>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {EXAM_CATEGORIES.dsa.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {EXAM_CATEGORIES.dsa.items.map((dsa, index) => (
                  <motion.button
                    key={dsa.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(dsa)}
                    className={`${cardClasses} border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-200`}
                  >
                    <span className="text-3xl mb-2">{dsa.icon}</span>
                    <span className="font-medium text-sm text-center">{dsa.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                      {dsa.subjects.length} topics
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Technical Skills Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-10"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                💻 {EXAM_CATEGORIES.technical.title}
              </h2>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {EXAM_CATEGORIES.technical.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {EXAM_CATEGORIES.technical.items.map((tech, index) => (
                  <motion.button
                    key={tech.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(tech)}
                    className={`${cardClasses} border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-200`}
                  >
                    <span className="text-3xl mb-2">{tech.icon}</span>
                    <span className="font-medium text-sm text-center">{tech.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                      {tech.subjects.length} topics
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* NIMCET 2026 Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🎓 {EXAM_CATEGORIES.nimcet.title}
              </h2>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {EXAM_CATEGORIES.nimcet.description}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {EXAM_CATEGORIES.nimcet.items.map((exam, index) => (
                  <motion.button
                    key={exam.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(exam)}
                    className={`${cardClasses} border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-200`}
                  >
                    <span className="text-3xl mb-2">{exam.icon}</span>
                    <span className="font-medium text-sm text-center">{exam.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                      {exam.questionCount || exam.subjects.length} {exam.questionCount ? 'questions' : 'topics'}
                    </span>
                    {exam.description && (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-500'} mt-1 text-center`}>
                        {exam.description}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          /* Subject Selection View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Back Button */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`mb-6 flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              ← Back to Categories
            </button>

            {/* Selected Category Info */}
            <div className={`${cardClasses} border rounded-2xl p-6 mb-8`}>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{selectedCategory.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCategory.name}</h2>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select a subject to start practicing
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Cards */}
            <h3 className="text-lg font-semibold mb-4">Select Subject</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {selectedCategory.subjects.map((subject, index) => (
                <motion.button
                  key={subject}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubjectSelect(subject.toLowerCase())}
                  className={`${cardClasses} border rounded-xl p-5 text-left hover:shadow-lg transition-all duration-200 ${
                    selectedSubject === subject.toLowerCase() ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{subject}</span>
                    <span className={`${selectedCategory.color} text-white text-xs px-2 py-1 rounded-full`}>
                      Practice
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Start Test Button */}
            {selectedSubject && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={() => handleStartTest(selectedCategory.id, selectedSubject, 10)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  🚀 Start Practice Test (10 Questions)
                </button>
                <button
                  onClick={() => handleStartTest(selectedCategory.id, selectedSubject, 20)}
                  className={`flex-1 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'} py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-80 transition-opacity flex items-center justify-center gap-2`}
                >
                  📝 Full Test (20 Questions)
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Features Info */}
        {!selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`mt-12 ${cardClasses} border rounded-2xl p-6`}
          >
            <h3 className="text-lg font-semibold mb-4">Why Practice Here? 🎓</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <h4 className="font-medium">Real Exam Pattern</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Questions based on actual exam patterns from TCS, Infosys, SSC, Banking exams
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="font-medium">AI-Generated Questions</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Fresh questions generated by AI to ensure variety and challenge
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h4 className="font-medium">Track Progress</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Monitor your performance and identify areas for improvement
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CompetitiveExams
