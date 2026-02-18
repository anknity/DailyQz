import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { 
  FiArrowLeft, 
  FiArrowRight, 
  FiClock, 
  FiAward, 
  FiBook,
  FiUsers,
  FiStar,
  FiCheck,
  FiChevronRight
} from 'react-icons/fi'

// School class levels configuration
const CLASS_LEVELS = [
  {
    id: 'primary',
    name: 'Primary School',
    range: 'Class 1-5',
    icon: '🎒',
    color: 'from-yellow-400 to-orange-500',
    classes: [
      { id: 1, name: 'Class 1', subjects: ['English', 'Mathematics', 'EVS', 'Hindi'] },
      { id: 2, name: 'Class 2', subjects: ['English', 'Mathematics', 'EVS', 'Hindi'] },
      { id: 3, name: 'Class 3', subjects: ['English', 'Mathematics', 'EVS', 'Hindi', 'Computer'] },
      { id: 4, name: 'Class 4', subjects: ['English', 'Mathematics', 'EVS', 'Hindi', 'Computer'] },
      { id: 5, name: 'Class 5', subjects: ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer'] }
    ]
  },
  {
    id: 'middle',
    name: 'Middle School',
    range: 'Class 6-8',
    icon: '📚',
    color: 'from-blue-400 to-cyan-500',
    classes: [
      { id: 6, name: 'Class 6', subjects: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer'] },
      { id: 7, name: 'Class 7', subjects: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer'] },
      { id: 8, name: 'Class 8', subjects: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer'] }
    ]
  },
  {
    id: 'secondary',
    name: 'Secondary School',
    range: 'Class 9-10',
    icon: '🎓',
    color: 'from-purple-500 to-pink-500',
    classes: [
      { id: 9, name: 'Class 9', subjects: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer'] },
      { id: 10, name: 'Class 10 (Board)', subjects: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'] }
    ]
  },
  {
    id: 'higher-secondary',
    name: 'Higher Secondary',
    range: 'Class 11-12',
    icon: '🏆',
    color: 'from-green-500 to-teal-500',
    streams: [
      {
        id: 'science-pcm',
        name: 'Science (PCM)',
        icon: '⚛️',
        classes: [
          { id: 11, name: 'Class 11', subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer Science'] },
          { id: 12, name: 'Class 12 (Board)', subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer Science'] }
        ]
      },
      {
        id: 'science-pcb',
        name: 'Science (PCB)',
        icon: '🧬',
        classes: [
          { id: 11, name: 'Class 11', subjects: ['Physics', 'Chemistry', 'Biology', 'English'] },
          { id: 12, name: 'Class 12 (Board)', subjects: ['Physics', 'Chemistry', 'Biology', 'English'] }
        ]
      },
      {
        id: 'commerce',
        name: 'Commerce',
        icon: '💼',
        classes: [
          { id: 11, name: 'Class 11', subjects: ['Accountancy', 'Business Studies', 'Economics', 'English', 'Mathematics'] },
          { id: 12, name: 'Class 12 (Board)', subjects: ['Accountancy', 'Business Studies', 'Economics', 'English', 'Mathematics'] }
        ]
      },
      {
        id: 'arts',
        name: 'Arts/Humanities',
        icon: '🎨',
        classes: [
          { id: 11, name: 'Class 11', subjects: ['History', 'Geography', 'Political Science', 'English', 'Economics'] },
          { id: 12, name: 'Class 12 (Board)', subjects: ['History', 'Geography', 'Political Science', 'English', 'Economics'] }
        ]
      }
    ]
  },
  {
    id: 'competitive',
    name: 'Competitive Exams',
    range: 'JEE, NEET, etc.',
    icon: '🎯',
    color: 'from-red-500 to-orange-500',
    exams: [
      { id: 'jee-main', name: 'JEE Main', subjects: ['Physics', 'Chemistry', 'Mathematics'], duration: 180, questions: 90 },
      { id: 'jee-advanced', name: 'JEE Advanced', subjects: ['Physics', 'Chemistry', 'Mathematics'], duration: 180, questions: 54 },
      { id: 'neet', name: 'NEET UG', subjects: ['Physics', 'Chemistry', 'Biology'], duration: 200, questions: 200 },
      { id: 'cuet', name: 'CUET', subjects: ['Language', 'Domain', 'General Test'], duration: 195, questions: 175 },
      { id: 'ntse', name: 'NTSE', subjects: ['MAT', 'SAT'], duration: 120, questions: 100 },
      { id: 'kvpy', name: 'KVPY', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'], duration: 180, questions: 80 }
    ]
  }
]

// Subject topic configuration for generating tests
const SUBJECT_TOPICS = {
  Mathematics: {
    'Class 1-5': ['Numbers', 'Addition', 'Subtraction', 'Multiplication', 'Division', 'Shapes', 'Measurements', 'Time', 'Money', 'Fractions'],
    'Class 6-8': ['Integers', 'Fractions', 'Decimals', 'Algebra Basics', 'Geometry', 'Ratio', 'Percentage', 'Data Handling'],
    'Class 9-10': ['Number Systems', 'Polynomials', 'Linear Equations', 'Quadratic Equations', 'Triangles', 'Circles', 'Statistics', 'Probability', 'Trigonometry', 'Coordinate Geometry'],
    'Class 11-12': ['Sets', 'Functions', 'Trigonometry', 'Complex Numbers', 'Permutations', 'Binomial Theorem', 'Calculus', 'Vectors', 'Probability', 'Linear Programming']
  },
  Science: {
    'Class 1-5': ['Living Things', 'Plants', 'Animals', 'Our Body', 'Food', 'Water', 'Air', 'Weather'],
    'Class 6-8': ['Nutrition', 'Respiration', 'Motion', 'Light', 'Sound', 'Electricity', 'Chemical Reactions', 'Cells'],
    'Class 9-10': ['Matter', 'Atoms', 'Cell Biology', 'Tissues', 'Diversity', 'Motion', 'Force', 'Work & Energy', 'Sound', 'Light', 'Electricity', 'Magnetic Effects', 'Natural Resources']
  },
  Physics: {
    'Class 11-12': ['Units', 'Motion', 'Laws of Motion', 'Work & Energy', 'Rotational Motion', 'Gravitation', 'Properties of Matter', 'Thermodynamics', 'Oscillations', 'Waves', 'Electrostatics', 'Current Electricity', 'Magnetism', 'EMI', 'Optics', 'Modern Physics']
  },
  Chemistry: {
    'Class 11-12': ['Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox', 'Hydrocarbons', 'Organic Chemistry', 'Coordination Compounds', 'Polymers', 'Biomolecules']
  },
  Biology: {
    'Class 11-12': ['Cell Biology', 'Biomolecules', 'Cell Division', 'Plant Morphology', 'Animal Morphology', 'Plant Physiology', 'Animal Physiology', 'Genetics', 'Evolution', 'Ecology', 'Biotechnology', 'Human Health']
  },
  English: {
    'All': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Literature']
  },
  Hindi: {
    'All': ['व्याकरण', 'साहित्य', 'पठन', 'लेखन', 'मुहावरे']
  }
}

const Schools = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  // State
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [selectedStream, setSelectedStream] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [testConfig, setTestConfig] = useState({
    questionCount: 20,
    duration: 30,
    difficulty: 'medium'
  })
  const [step, setStep] = useState(1) // 1: Level, 2: Class/Stream, 3: Subject, 4: Config, 5: Start

  // Handle level selection
  const handleLevelSelect = (level) => {
    setSelectedLevel(level)
    setSelectedStream(null)
    setSelectedClass(null)
    setSelectedSubject(null)
    setStep(2)
  }

  // Handle stream selection (for higher secondary)
  const handleStreamSelect = (stream) => {
    setSelectedStream(stream)
    setStep(2.5)
  }

  // Handle class selection
  const handleClassSelect = (cls) => {
    setSelectedClass(cls)
    setStep(3)
  }

  // Handle subject selection
  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject)
    setStep(4)
  }

  // Start test
  const handleStartTest = () => {
    const testData = {
      level: selectedLevel?.id,
      stream: selectedStream?.id,
      class: selectedClass?.id,
      subject: selectedSubject,
      ...testConfig,
      type: 'school'
    }
    
    // Navigate to test page with config
    navigate('/school-test', { 
      state: { 
        testConfig: testData,
        title: `${selectedClass?.name} - ${selectedSubject}`,
        category: selectedSubject.toLowerCase().replace(/\s+/g, '-'),
        subcategory: selectedLevel?.id
      } 
    })
  }

  // Go back
  const goBack = () => {
    if (step === 2) {
      setSelectedLevel(null)
      setStep(1)
    } else if (step === 2.5) {
      setSelectedStream(null)
      setStep(2)
    } else if (step === 3) {
      setSelectedClass(null)
      if (selectedLevel?.id === 'higher-secondary') {
        setStep(2.5)
      } else {
        setStep(2)
      }
    } else if (step === 4) {
      setSelectedSubject(null)
      setStep(3)
    }
  }

  // Get current classes to show
  const getCurrentClasses = () => {
    if (selectedLevel?.id === 'higher-secondary' && selectedStream) {
      return selectedStream.classes
    }
    return selectedLevel?.classes || []
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <Layout>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {step > 1 && (
              <button
                onClick={goBack}
                className="p-2 rounded-lg bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-100 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            {step === 1 && (
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-100 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🏫 Schools & Colleges
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {step === 1 && 'Select your education level'}
                {step === 2 && selectedLevel?.id !== 'higher-secondary' && 'Select your class'}
                {step === 2 && selectedLevel?.id === 'higher-secondary' && 'Select your stream'}
                {step === 2.5 && 'Select your class'}
                {step === 3 && 'Select subject for test'}
                {step === 4 && 'Configure your test'}
              </p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <span className={step >= 1 ? 'text-primary-500 font-medium' : ''}>Level</span>
            {selectedLevel && (
              <>
                <FiChevronRight className="w-4 h-4" />
                <span className={step >= 2 ? 'text-primary-500 font-medium' : ''}>{selectedLevel.name}</span>
              </>
            )}
            {selectedStream && (
              <>
                <FiChevronRight className="w-4 h-4" />
                <span className={step >= 2.5 ? 'text-primary-500 font-medium' : ''}>{selectedStream.name}</span>
              </>
            )}
            {selectedClass && (
              <>
                <FiChevronRight className="w-4 h-4" />
                <span className={step >= 3 ? 'text-primary-500 font-medium' : ''}>{selectedClass.name}</span>
              </>
            )}
            {selectedSubject && (
              <>
                <FiChevronRight className="w-4 h-4" />
                <span className="text-primary-500 font-medium">{selectedSubject}</span>
              </>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Level */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {CLASS_LEVELS.map((level) => (
                <motion.div
                  key={level.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLevelSelect(level)}
                  className={`bg-gradient-to-br ${level.color} rounded-2xl p-6 cursor-pointer shadow-lg text-white relative overflow-hidden`}
                >
                  <div className="text-5xl mb-4">{level.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{level.name}</h3>
                  <p className="text-white/80 mb-4">{level.range}</p>
                  
                  {level.classes && (
                    <div className="flex flex-wrap gap-2">
                      {level.classes.slice(0, 3).map(cls => (
                        <span key={cls.id} className="px-2 py-1 bg-white/20 rounded text-sm">
                          {cls.name}
                        </span>
                      ))}
                      {level.classes.length > 3 && (
                        <span className="px-2 py-1 bg-white/20 rounded text-sm">
                          +{level.classes.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {level.streams && (
                    <div className="flex flex-wrap gap-2">
                      {level.streams.map(stream => (
                        <span key={stream.id} className="px-2 py-1 bg-white/20 rounded text-sm">
                          {stream.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {level.exams && (
                    <div className="flex flex-wrap gap-2">
                      {level.exams.slice(0, 3).map(exam => (
                        <span key={exam.id} className="px-2 py-1 bg-white/20 rounded text-sm">
                          {exam.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                  <FiArrowRight className="absolute bottom-4 right-4 w-6 h-6" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Step 2: Select Class or Stream */}
          {step === 2 && selectedLevel?.id !== 'higher-secondary' && selectedLevel?.classes && (
            <motion.div
              key="step2-classes"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
            >
              {selectedLevel.classes.map((cls) => (
                <motion.div
                  key={cls.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleClassSelect(cls)}
                  className="bg-white dark:bg-dark-200 rounded-xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
                >
                  <div className="text-4xl mb-3 text-center">{cls.id}</div>
                  <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {cls.subjects.length} subjects
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Step 2: Select Stream (Higher Secondary) */}
          {step === 2 && selectedLevel?.id === 'higher-secondary' && selectedLevel?.streams && (
            <motion.div
              key="step2-streams"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {selectedLevel.streams.map((stream) => (
                <motion.div
                  key={stream.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStreamSelect(stream)}
                  className="bg-white dark:bg-dark-200 rounded-xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
                >
                  <div className="text-4xl mb-3">{stream.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {stream.name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {stream.classes[0].subjects.slice(0, 3).map(sub => (
                      <span key={sub} className="px-2 py-0.5 bg-gray-100 dark:bg-dark-100 rounded text-xs text-gray-600 dark:text-gray-400">
                        {sub}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Step 2: Competitive Exams */}
          {step === 2 && selectedLevel?.id === 'competitive' && selectedLevel?.exams && (
            <motion.div
              key="step2-exams"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {selectedLevel.exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedClass({ id: exam.id, name: exam.name, subjects: exam.subjects })
                    setStep(3)
                  }}
                  className="bg-white dark:bg-dark-200 rounded-xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {exam.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {exam.duration} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <FiBook className="w-4 h-4" />
                      {exam.questions} Q
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {exam.subjects.map(sub => (
                      <span key={sub} className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded text-xs text-primary-600 dark:text-primary-400">
                        {sub}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Step 2.5: Select Class (Higher Secondary with Stream) */}
          {step === 2.5 && selectedStream && (
            <motion.div
              key="step2.5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {selectedStream.classes.map((cls) => (
                <motion.div
                  key={cls.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleClassSelect(cls)}
                  className="bg-white dark:bg-dark-200 rounded-xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{cls.id === 11 ? '1️⃣1️⃣' : '1️⃣2️⃣'}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {cls.name}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {cls.subjects.length} subjects • {selectedStream.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {cls.subjects.map(sub => (
                      <span key={sub} className="px-3 py-1 bg-gray-100 dark:bg-dark-100 rounded-full text-sm text-gray-600 dark:text-gray-400">
                        {sub}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Step 3: Select Subject */}
          {step === 3 && selectedClass && (
            <motion.div
              key="step3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {selectedClass.subjects.map((subject, index) => {
                const subjectIcons = {
                  Mathematics: '➕',
                  Science: '🔬',
                  English: '📖',
                  Hindi: '📚',
                  Physics: '⚛️',
                  Chemistry: '⚗️',
                  Biology: '🧬',
                  'Social Science': '🌍',
                  Computer: '💻',
                  'Computer Science': '💻',
                  Accountancy: '📒',
                  'Business Studies': '💼',
                  Economics: '📈',
                  History: '🏛️',
                  Geography: '🗺️',
                  EVS: '🌿',
                  'Political Science': '⚖️',
                  default: '📝'
                }
                const icon = subjectIcons[subject] || subjectIcons.default
                
                return (
                  <motion.div
                    key={subject}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubjectSelect(subject)}
                    className="bg-white dark:bg-dark-200 rounded-xl p-5 cursor-pointer shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
                  >
                    <div className="text-4xl mb-3 text-center">{icon}</div>
                    <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white">
                      {subject}
                    </h3>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Step 4: Test Configuration */}
          {step === 4 && selectedSubject && (
            <motion.div
              key="step4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-dark-200 rounded-2xl p-8 shadow-xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                    <FiBook className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedClass?.name} - {selectedSubject}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Configure your test settings
                  </p>
                </div>

                {/* Question Count */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <div className="flex gap-3">
                    {[10, 20, 30, 50].map(count => (
                      <button
                        key={count}
                        onClick={() => setTestConfig(prev => ({ ...prev, questionCount: count }))}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          testConfig.questionCount === count
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-50'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <div className="flex gap-3">
                    {[15, 30, 45, 60].map(duration => (
                      <button
                        key={duration}
                        onClick={() => setTestConfig(prev => ({ ...prev, duration }))}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          testConfig.duration === duration
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-50'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-3">
                    {[
                      { id: 'easy', label: 'Easy', color: 'green' },
                      { id: 'medium', label: 'Medium', color: 'yellow' },
                      { id: 'hard', label: 'Hard', color: 'red' }
                    ].map(level => (
                      <button
                        key={level.id}
                        onClick={() => setTestConfig(prev => ({ ...prev, difficulty: level.id }))}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          testConfig.difficulty === level.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-50'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4 mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Test Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {testConfig.questionCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {testConfig.duration}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Minutes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 capitalize">
                        {testConfig.difficulty}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Difficulty</div>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartTest}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <FiArrowRight className="w-5 h-5" />
                  Start Test
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </Layout>
  )
}

export default Schools
