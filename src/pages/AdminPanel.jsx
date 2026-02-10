import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar, LoadingSpinner } from '../components'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FiUsers, 
  FiFileText, 
  FiBarChart2, 
  FiPlus, 
  FiUpload, 
  FiTrash2,
  FiEdit,
  FiCpu,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiChevronDown,
  FiSettings,
  FiCalendar,
  FiFile,
  FiZap,
  FiSend,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiCode,
  FiPlay,
  FiTrendingUp,
  FiActivity,
  FiDatabase,
  FiServer,
  FiClock,
  FiAward,
  FiChevronRight,
  FiChevronLeft
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const ADMIN_EMAIL = 'nityanand666.nk@gmail.com'

/**
 * Admin Panel Page
 * Only accessible by admin user
 */
const AdminPanel = () => {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const pdfInputRef = useRef(null)
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([
    {
      id: 'web-development',
      name: 'Web Development',
      subcategories: [
        { id: 'javascript', name: 'JavaScript' },
        { id: 'react', name: 'React' },
        { id: 'html-css', name: 'HTML/CSS' },
        { id: 'tailwind', name: 'Tailwind' }
      ]
    },
    {
      id: 'dsa',
      name: 'Data Structures & Algorithms',
      subcategories: [
        { id: 'arrays', name: 'Arrays' },
        { id: 'linked-lists', name: 'Linked Lists' },
        { id: 'trees', name: 'Trees' },
        { id: 'graphs', name: 'Graphs' }
      ]
    },
    {
      id: 'aptitude',
      name: 'Aptitude',
      subcategories: [
        { id: 'quantitative', name: 'Quantitative' },
        { id: 'logical', name: 'Logical' },
        { id: 'verbal', name: 'Verbal' }
      ]
    },
    {
      id: 'neet',
      name: 'NEET',
      subcategories: [
        { id: 'physics', name: 'Physics' },
        { id: 'chemistry-organic', name: 'Chemistry - Organic' },
        { id: 'biology-botany', name: 'Biology - Botany' }
      ]
    },
    {
      id: 'data-science',
      name: 'Data Science',
      subcategories: [
        { id: 'python', name: 'Python' },
        { id: 'statistics', name: 'Statistics' }
      ]
    },
    {
      id: 'networking',
      name: 'Networking',
      subcategories: [
        { id: 'protocols', name: 'Protocols' },
        { id: 'security', name: 'Security' }
      ]
    },
    {
      id: 'artificial-intelligence',
      name: 'Artificial Intelligence',
      subcategories: [
        { id: 'ml-basics', name: 'ML Basics' },
        { id: 'deep-learning', name: 'Deep Learning' }
      ]
    }
  ])
  const [users, setUsers] = useState([])
  
  // AI Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [genConfig, setGenConfig] = useState({
    category: 'web-development',
    subcategory: 'javascript',
    difficulty: 'medium',
    count: 5
  })
  
  // Upload state
  const [uploadContent, setUploadContent] = useState('')
  const [uploadCategory, setUploadCategory] = useState('web-development')
  const [uploadSubcategory, setUploadSubcategory] = useState('javascript')
  const [uploading, setUploading] = useState(false)
  
  // PDF Upload state
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfCategory, setPdfCategory] = useState('tcs')
  const [pdfSubject, setPdfSubject] = useState('aptitude')
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [extractedQuestions, setExtractedQuestions] = useState([])
  const [savingExtracted, setSavingExtracted] = useState(false)
  const [aiProvider, setAiProvider] = useState('groq') // 'groq' or 'gemini'
  const [questionCount, setQuestionCount] = useState(10)
  
  // Direct Feed state
  const [directFeedInput, setDirectFeedInput] = useState('')
  const [directFeedCategory, setDirectFeedCategory] = useState('quantitative-aptitude')
  const [directFeedSubcategory, setDirectFeedSubcategory] = useState('percentage')
  const [directFeedDifficulty, setDirectFeedDifficulty] = useState('medium')
  const [directFeedAiProvider, setDirectFeedAiProvider] = useState('openrouter')
  const [parsedQuestion, setParsedQuestion] = useState(null)
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [currentParsedIndex, setCurrentParsedIndex] = useState(0)
  const [parsingQuestion, setParsingQuestion] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [directFeedStats, setDirectFeedStats] = useState(null)
  const [generatingDirectFeed, setGeneratingDirectFeed] = useState(false)
  const [generatedDirectFeedQuestions, setGeneratedDirectFeedQuestions] = useState([])
  const [directFeedGenerateCount, setDirectFeedGenerateCount] = useState(5)

  // DSA Coding Problem state
  const [dsaTopic, setDsaTopic] = useState('arrays')
  const [dsaDifficulty, setDsaDifficulty] = useState('medium')
  const [generatingDsaProblem, setGeneratingDsaProblem] = useState(false)
  const [generatedDsaProblem, setGeneratedDsaProblem] = useState(null)
  const [savingDsaProblem, setSavingDsaProblem] = useState(false)

  // Analytics state
  const [analytics, setAnalytics] = useState(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7')
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // DSA Topics for dropdown
  const dsaTopics = [
    { id: 'arrays', name: 'Arrays & Strings' },
    { id: 'linked-lists', name: 'Linked Lists' },
    { id: 'stacks-queues', name: 'Stacks & Queues' },
    { id: 'trees', name: 'Binary Trees' },
    { id: 'bst', name: 'Binary Search Trees' },
    { id: 'heaps', name: 'Heaps & Priority Queues' },
    { id: 'graphs', name: 'Graphs' },
    { id: 'dynamic-programming', name: 'Dynamic Programming' },
    { id: 'recursion', name: 'Recursion & Backtracking' },
    { id: 'binary-search', name: 'Binary Search' },
    { id: 'two-pointers', name: 'Two Pointers' },
    { id: 'sliding-window', name: 'Sliding Window' },
    { id: 'sorting', name: 'Sorting Algorithms' },
    { id: 'hashing', name: 'Hash Maps & Sets' },
    { id: 'greedy', name: 'Greedy Algorithms' },
    { id: 'bit-manipulation', name: 'Bit Manipulation' },
    { id: 'math', name: 'Mathematical Problems' },
    { id: 'trie', name: 'Tries' },
    { id: 'segment-tree', name: 'Segment Trees' },
    { id: 'disjoint-set', name: 'Union Find / Disjoint Set' }
  ]
  
  // Comprehensive Direct Feed categories for all exam types
  const directFeedCategories = [
    // ===== APTITUDE & REASONING =====
    {
      id: 'quantitative-aptitude',
      name: '📊 Quantitative Aptitude',
      group: 'Aptitude',
      subcategories: [
        { id: 'percentage', name: 'Percentage' },
        { id: 'number-system', name: 'Number System' },
        { id: 'time-and-work', name: 'Time and Work' },
        { id: 'time-speed-distance', name: 'Time Speed Distance' },
        { id: 'ratio-and-proportion', name: 'Ratio and Proportion' },
        { id: 'profit-and-loss', name: 'Profit and Loss' },
        { id: 'simple-interest', name: 'Simple Interest' },
        { id: 'compound-interest', name: 'Compound Interest' },
        { id: 'averages', name: 'Averages' },
        { id: 'algebra', name: 'Algebra' },
        { id: 'geometry', name: 'Geometry' },
        { id: 'permutations-combinations', name: 'Permutations & Combinations' },
        { id: 'data-interpretation', name: 'Data Interpretation' },
        { id: 'trigonometry', name: 'Trigonometry' },
        { id: 'statistics', name: 'Statistics' },
        { id: 'mixtures-allegations', name: 'Mixtures & Allegations' },
        { id: 'boats-streams', name: 'Boats & Streams' },
        { id: 'trains', name: 'Trains' },
        { id: 'pipes-cisterns', name: 'Pipes & Cisterns' }
      ]
    },
    {
      id: 'logical-reasoning',
      name: '🧠 Logical Reasoning',
      group: 'Aptitude',
      subcategories: [
        { id: 'coding-decoding', name: 'Coding Decoding' },
        { id: 'blood-relations', name: 'Blood Relations' },
        { id: 'direction-sense', name: 'Direction Sense' },
        { id: 'seating-arrangement', name: 'Seating Arrangement' },
        { id: 'syllogism', name: 'Syllogism' },
        { id: 'puzzles', name: 'Puzzles' },
        { id: 'series', name: 'Series' },
        { id: 'analogy', name: 'Analogy' },
        { id: 'classification', name: 'Classification' },
        { id: 'ranking', name: 'Ranking' },
        { id: 'calendar', name: 'Calendar' },
        { id: 'clocks', name: 'Clocks' },
        { id: 'input-output', name: 'Input Output' },
        { id: 'data-sufficiency', name: 'Data Sufficiency' },
        { id: 'statement-conclusions', name: 'Statement & Conclusions' },
        { id: 'critical-reasoning', name: 'Critical Reasoning' }
      ]
    },
    {
      id: 'verbal-ability',
      name: '📝 Verbal Ability',
      group: 'Aptitude',
      subcategories: [
        { id: 'reading-comprehension', name: 'Reading Comprehension' },
        { id: 'vocabulary', name: 'Vocabulary' },
        { id: 'grammar', name: 'Grammar' },
        { id: 'para-jumbles', name: 'Para Jumbles' },
        { id: 'fill-in-blanks', name: 'Fill in the Blanks' },
        { id: 'idioms-phrases', name: 'Idioms & Phrases' },
        { id: 'one-word-substitution', name: 'One Word Substitution' },
        { id: 'sentence-improvement', name: 'Sentence Improvement' },
        { id: 'active-passive', name: 'Active Passive Voice' },
        { id: 'direct-indirect', name: 'Direct Indirect Speech' },
        { id: 'spelling-errors', name: 'Spelling Errors' }
      ]
    },
    {
      id: 'general-knowledge',
      name: '🌍 General Knowledge',
      group: 'Aptitude',
      subcategories: [
        { id: 'current-affairs', name: 'Current Affairs' },
        { id: 'history', name: 'History' },
        { id: 'geography', name: 'Geography' },
        { id: 'polity', name: 'Polity' },
        { id: 'economics', name: 'Economics' },
        { id: 'science', name: 'Science' },
        { id: 'computer', name: 'Computer' },
        { id: 'sports', name: 'Sports' },
        { id: 'awards', name: 'Awards' },
        { id: 'books-authors', name: 'Books & Authors' },
        { id: 'art-culture', name: 'Art & Culture' },
        { id: 'environment', name: 'Environment' }
      ]
    },

    // ===== SCHOOL SUBJECTS (Class 1-10) =====
    {
      id: 'mathematics',
      name: '➕ Mathematics (School)',
      group: 'School (1-10)',
      subcategories: [
        { id: 'arithmetic', name: 'Arithmetic' },
        { id: 'algebra-basic', name: 'Basic Algebra' },
        { id: 'geometry-basic', name: 'Basic Geometry' },
        { id: 'mensuration', name: 'Mensuration' },
        { id: 'statistics-basic', name: 'Statistics' },
        { id: 'number-theory', name: 'Number Theory' },
        { id: 'linear-equations', name: 'Linear Equations' },
        { id: 'quadratic-equations', name: 'Quadratic Equations' },
        { id: 'polynomials', name: 'Polynomials' },
        { id: 'coordinate-geometry', name: 'Coordinate Geometry' },
        { id: 'trigonometry-basic', name: 'Basic Trigonometry' },
        { id: 'probability-basic', name: 'Basic Probability' },
        { id: 'real-numbers', name: 'Real Numbers' }
      ]
    },
    {
      id: 'science',
      name: '🔬 Science (School)',
      group: 'School (1-10)',
      subcategories: [
        { id: 'physics-basic', name: 'Physics Basics' },
        { id: 'chemistry-basic', name: 'Chemistry Basics' },
        { id: 'biology-basic', name: 'Biology Basics' },
        { id: 'environment-science', name: 'Environmental Science' },
        { id: 'electricity', name: 'Electricity' },
        { id: 'light-optics', name: 'Light & Optics' },
        { id: 'motion-laws', name: 'Motion & Laws' },
        { id: 'acids-bases', name: 'Acids & Bases' },
        { id: 'metals-nonmetals', name: 'Metals & Non-metals' },
        { id: 'carbon-compounds', name: 'Carbon Compounds' },
        { id: 'life-processes', name: 'Life Processes' },
        { id: 'reproduction', name: 'Reproduction' },
        { id: 'heredity', name: 'Heredity' },
        { id: 'natural-resources', name: 'Natural Resources' }
      ]
    },
    {
      id: 'english',
      name: '📖 English (School)',
      group: 'School (1-10)',
      subcategories: [
        { id: 'grammar', name: 'Grammar' },
        { id: 'vocabulary', name: 'Vocabulary' },
        { id: 'reading-comprehension', name: 'Reading Comprehension' },
        { id: 'writing-skills', name: 'Writing Skills' },
        { id: 'poetry', name: 'Poetry' },
        { id: 'prose', name: 'Prose' },
        { id: 'parts-of-speech', name: 'Parts of Speech' },
        { id: 'sentence-structure', name: 'Sentence Structure' },
        { id: 'punctuation', name: 'Punctuation' }
      ]
    },
    {
      id: 'hindi',
      name: '📚 Hindi (School)',
      group: 'School (1-10)',
      subcategories: [
        { id: 'vyakaran', name: 'व्याकरण (Grammar)' },
        { id: 'sahitya', name: 'साहित्य (Literature)' },
        { id: 'lekhan', name: 'लेखन (Writing)' },
        { id: 'apathit-gadyansh', name: 'अपठित गद्यांश' },
        { id: 'muhavare', name: 'मुहावरे' },
        { id: 'paryayvachi', name: 'पर्यायवाची' },
        { id: 'vilom', name: 'विलोम शब्द' },
        { id: 'anekarthi', name: 'अनेकार्थी शब्द' },
        { id: 'vaky-rachna', name: 'वाक्य रचना' }
      ]
    },
    {
      id: 'social-science',
      name: '🏛️ Social Science (School)',
      group: 'School (1-10)',
      subcategories: [
        { id: 'history-india', name: 'Indian History' },
        { id: 'history-world', name: 'World History' },
        { id: 'geography-india', name: 'Indian Geography' },
        { id: 'geography-world', name: 'World Geography' },
        { id: 'civics', name: 'Civics' },
        { id: 'economics-basic', name: 'Basic Economics' },
        { id: 'resources', name: 'Resources' },
        { id: 'maps', name: 'Maps' },
        { id: 'disaster-management', name: 'Disaster Management' },
        { id: 'nationalism', name: 'Nationalism' }
      ]
    },

    // ===== HIGHER SECONDARY (Class 11-12) =====
    {
      id: 'physics',
      name: '⚛️ Physics (11-12)',
      group: 'Higher Secondary',
      subcategories: [
        { id: 'mechanics', name: 'Mechanics' },
        { id: 'thermodynamics', name: 'Thermodynamics' },
        { id: 'waves', name: 'Waves' },
        { id: 'optics', name: 'Optics' },
        { id: 'electrostatics', name: 'Electrostatics' },
        { id: 'current-electricity', name: 'Current Electricity' },
        { id: 'magnetism', name: 'Magnetism' },
        { id: 'modern-physics', name: 'Modern Physics' },
        { id: 'semiconductors', name: 'Semiconductors' },
        { id: 'communication', name: 'Communication Systems' },
        { id: 'rotational-motion', name: 'Rotational Motion' },
        { id: 'gravitation', name: 'Gravitation' },
        { id: 'fluid-mechanics', name: 'Fluid Mechanics' }
      ]
    },
    {
      id: 'chemistry',
      name: '⚗️ Chemistry (11-12)',
      group: 'Higher Secondary',
      subcategories: [
        { id: 'atomic-structure', name: 'Atomic Structure' },
        { id: 'chemical-bonding', name: 'Chemical Bonding' },
        { id: 'states-of-matter', name: 'States of Matter' },
        { id: 'thermodynamics-chem', name: 'Thermodynamics' },
        { id: 'equilibrium', name: 'Equilibrium' },
        { id: 'redox-reactions', name: 'Redox Reactions' },
        { id: 'organic-chemistry', name: 'Organic Chemistry' },
        { id: 'inorganic-chemistry', name: 'Inorganic Chemistry' },
        { id: 'solutions', name: 'Solutions' },
        { id: 'kinetics', name: 'Chemical Kinetics' },
        { id: 'surface-chemistry', name: 'Surface Chemistry' },
        { id: 'polymers', name: 'Polymers' },
        { id: 'biomolecules', name: 'Biomolecules' },
        { id: 'd-f-block', name: 'd & f Block Elements' }
      ]
    },
    {
      id: 'biology',
      name: '🧬 Biology (11-12)',
      group: 'Higher Secondary',
      subcategories: [
        { id: 'cell-biology', name: 'Cell Biology' },
        { id: 'genetics', name: 'Genetics' },
        { id: 'evolution', name: 'Evolution' },
        { id: 'ecology', name: 'Ecology' },
        { id: 'plant-physiology', name: 'Plant Physiology' },
        { id: 'animal-physiology', name: 'Animal Physiology' },
        { id: 'reproduction', name: 'Reproduction' },
        { id: 'biotechnology', name: 'Biotechnology' },
        { id: 'human-health', name: 'Human Health & Diseases' },
        { id: 'microorganisms', name: 'Microorganisms' },
        { id: 'plant-anatomy', name: 'Plant Anatomy' },
        { id: 'animal-anatomy', name: 'Animal Anatomy' },
        { id: 'molecular-biology', name: 'Molecular Biology' }
      ]
    },
    {
      id: 'accountancy',
      name: '📒 Accountancy (11-12)',
      group: 'Higher Secondary',
      subcategories: [
        { id: 'accounting-basics', name: 'Accounting Basics' },
        { id: 'journal-ledger', name: 'Journal & Ledger' },
        { id: 'trial-balance', name: 'Trial Balance' },
        { id: 'financial-statements', name: 'Financial Statements' },
        { id: 'partnership', name: 'Partnership' },
        { id: 'company-accounts', name: 'Company Accounts' },
        { id: 'cash-flow', name: 'Cash Flow Statement' },
        { id: 'ratio-analysis', name: 'Ratio Analysis' },
        { id: 'depreciation', name: 'Depreciation' },
        { id: 'bank-reconciliation', name: 'Bank Reconciliation' }
      ]
    },
    {
      id: 'business-studies',
      name: '💼 Business Studies (11-12)',
      group: 'Higher Secondary',
      subcategories: [
        { id: 'business-environment', name: 'Business Environment' },
        { id: 'management', name: 'Management' },
        { id: 'planning', name: 'Planning' },
        { id: 'organizing', name: 'Organizing' },
        { id: 'staffing', name: 'Staffing' },
        { id: 'directing', name: 'Directing' },
        { id: 'controlling', name: 'Controlling' },
        { id: 'marketing', name: 'Marketing' },
        { id: 'finance', name: 'Finance' },
        { id: 'consumer-protection', name: 'Consumer Protection' },
        { id: 'entrepreneurship', name: 'Entrepreneurship' }
      ]
    },
    {
      id: 'economics-class',
      name: '📈 Economics (11-12)',
      group: 'Higher Secondary',
      subcategories: [
        { id: 'microeconomics', name: 'Microeconomics' },
        { id: 'macroeconomics', name: 'Macroeconomics' },
        { id: 'money-banking', name: 'Money & Banking' },
        { id: 'international-trade', name: 'International Trade' },
        { id: 'statistics-economics', name: 'Statistics' },
        { id: 'indian-economy', name: 'Indian Economy' },
        { id: 'economic-development', name: 'Economic Development' },
        { id: 'market-structures', name: 'Market Structures' },
        { id: 'production', name: 'Production' },
        { id: 'government-budget', name: 'Government Budget' }
      ]
    },
    {
      id: 'computer-science',
      name: '💻 Computer Science (11-12)',
      group: 'Higher Secondary',
      subcategories: [
        { id: 'programming-basics', name: 'Programming Basics' },
        { id: 'python', name: 'Python' },
        { id: 'java', name: 'Java' },
        { id: 'cpp', name: 'C++' },
        { id: 'data-structures', name: 'Data Structures' },
        { id: 'algorithms', name: 'Algorithms' },
        { id: 'databases', name: 'Databases & SQL' },
        { id: 'networking', name: 'Networking' },
        { id: 'web-development', name: 'Web Development' },
        { id: 'cyber-security', name: 'Cyber Security' },
        { id: 'boolean-algebra', name: 'Boolean Algebra' }
      ]
    },

    // ===== COMPETITIVE EXAMS =====
    {
      id: 'banking',
      name: '🏦 Banking Exams',
      group: 'Competitive',
      subcategories: [
        { id: 'banking-terms', name: 'Banking Terms' },
        { id: 'rbi', name: 'RBI' },
        { id: 'banking-history', name: 'Banking History' },
        { id: 'financial-institutions', name: 'Financial Institutions' },
        { id: 'banking-reforms', name: 'Banking Reforms' },
        { id: 'insurance', name: 'Insurance' },
        { id: 'investment', name: 'Investment' },
        { id: 'fintech', name: 'FinTech' }
      ]
    },
    {
      id: 'ssc',
      name: '📋 SSC Exams',
      group: 'Competitive',
      subcategories: [
        { id: 'english-ssc', name: 'English for SSC' },
        { id: 'maths-ssc', name: 'Maths for SSC' },
        { id: 'reasoning-ssc', name: 'Reasoning for SSC' },
        { id: 'gk-ssc', name: 'GK for SSC' }
      ]
    },
    {
      id: 'gate',
      name: '🎓 GATE',
      group: 'Competitive',
      subcategories: [
        { id: 'engineering-mathematics', name: 'Engineering Mathematics' },
        { id: 'digital-logic', name: 'Digital Logic' },
        { id: 'computer-organization', name: 'Computer Organization' },
        { id: 'operating-systems', name: 'Operating Systems' },
        { id: 'dbms', name: 'DBMS' },
        { id: 'compiler-design', name: 'Compiler Design' },
        { id: 'theory-of-computation', name: 'Theory of Computation' },
        { id: 'computer-networks', name: 'Computer Networks' }
      ]
    },
    {
      id: 'upsc',
      name: '🇮🇳 UPSC',
      group: 'Competitive',
      subcategories: [
        { id: 'indian-history', name: 'Indian History' },
        { id: 'indian-geography', name: 'Indian Geography' },
        { id: 'indian-polity', name: 'Indian Polity' },
        { id: 'indian-economy', name: 'Indian Economy' },
        { id: 'environment-ecology', name: 'Environment & Ecology' },
        { id: 'science-technology', name: 'Science & Technology' },
        { id: 'current-affairs', name: 'Current Affairs' },
        { id: 'ethics', name: 'Ethics' }
      ]
    },
    {
      id: 'jee',
      name: '🎯 JEE',
      group: 'Competitive',
      subcategories: [
        { id: 'jee-physics', name: 'Physics for JEE' },
        { id: 'jee-chemistry', name: 'Chemistry for JEE' },
        { id: 'jee-mathematics', name: 'Mathematics for JEE' }
      ]
    },
    {
      id: 'neet',
      name: '⚕️ NEET',
      group: 'Competitive',
      subcategories: [
        { id: 'neet-physics', name: 'Physics for NEET' },
        { id: 'neet-chemistry', name: 'Chemistry for NEET' },
        { id: 'neet-biology', name: 'Biology for NEET' }
      ]
    },
    {
      id: 'cat',
      name: '📊 CAT',
      group: 'Competitive',
      subcategories: [
        { id: 'quant-cat', name: 'Quantitative Aptitude' },
        { id: 'verbal-cat', name: 'Verbal Ability' },
        { id: 'lrdi-cat', name: 'LRDI' }
      ]
    },
    {
      id: 'nimcet',
      name: '🎓 NIMCET 2026',
      group: 'Competitive',
      subcategories: [
        { id: 'nimcet-math-sets', name: 'Math - Set Theory & Logic' },
        { id: 'nimcet-math-algebra', name: 'Math - Algebra' },
        { id: 'nimcet-math-calculus', name: 'Math - Calculus' },
        { id: 'nimcet-math-coordinate', name: 'Math - Coordinate Geometry' },
        { id: 'nimcet-math-probability', name: 'Math - Probability & Statistics' },
        { id: 'nimcet-reasoning-puzzles', name: 'Reasoning - Puzzles' },
        { id: 'nimcet-reasoning-coding', name: 'Reasoning - Coding-Decoding' },
        { id: 'nimcet-reasoning-blood', name: 'Reasoning - Blood Relations' },
        { id: 'nimcet-reasoning-series', name: 'Reasoning - Series' },
        { id: 'nimcet-reasoning-syllogism', name: 'Reasoning - Syllogisms' },
        { id: 'nimcet-reasoning-direction', name: 'Reasoning - Directions' },
        { id: 'nimcet-reasoning-di', name: 'Reasoning - Data Interpretation' },
        { id: 'nimcet-computer-basics', name: 'Computer - Basics' },
        { id: 'nimcet-computer-number', name: 'Computer - Number Systems' },
        { id: 'nimcet-computer-boolean', name: 'Computer - Boolean Algebra' },
        { id: 'nimcet-computer-os', name: 'Computer - Operating Systems' },
        { id: 'nimcet-computer-arch', name: 'Computer - Architecture' },
        { id: 'nimcet-english-rc', name: 'English - Reading Comprehension' },
        { id: 'nimcet-english-vocab', name: 'English - Vocabulary' },
        { id: 'nimcet-english-grammar', name: 'English - Grammar' },
        { id: 'nimcet-english-sentence', name: 'English - Sentence Structure' },
        { id: 'nimcet-english-idioms', name: 'English - Idioms' }
      ]
    }
  ]
  
  // Competitive exam categories for PDF upload
  const competitiveCategories = [
    // IT Company Exams
    { id: 'tcs', name: 'TCS', subjects: ['aptitude', 'reasoning', 'verbal', 'programming', 'coding'] },
    { id: 'infosys', name: 'Infosys', subjects: ['aptitude', 'reasoning', 'puzzle', 'programming'] },
    { id: 'wipro', name: 'Wipro', subjects: ['aptitude', 'verbal', 'technical', 'essay'] },
    { id: 'tech-mahindra', name: 'Tech Mahindra', subjects: ['aptitude', 'technical', 'english', 'coding'] },
    { id: 'cognizant', name: 'Cognizant', subjects: ['aptitude', 'reasoning', 'coding'] },
    { id: 'accenture', name: 'Accenture', subjects: ['cognitive', 'technical', 'coding', 'communication'] },
    { id: 'capgemini', name: 'Capgemini', subjects: ['aptitude', 'reasoning', 'verbal', 'pseudo-code'] },
    { id: 'amazon', name: 'Amazon', subjects: ['dsa', 'algorithms', 'system-design', 'oops', 'problem-solving'] },
    { id: 'google', name: 'Google', subjects: ['dsa', 'algorithms', 'system-design', 'coding'] },
    { id: 'microsoft', name: 'Microsoft', subjects: ['dsa', 'algorithms', 'system-design', 'oops'] },
    
    // Government Exams
    { id: 'ssc', name: 'SSC', subjects: ['gk', 'quantitative', 'english', 'reasoning'] },
    { id: 'banking', name: 'Banking (IBPS/SBI)', subjects: ['gk', 'reasoning', 'english', 'quantitative', 'computer'] },
    { id: 'railway', name: 'Railway', subjects: ['gk', 'mathematics', 'reasoning', 'science'] },
    { id: 'bihar-police', name: 'Bihar Police', subjects: ['gk', 'hindi', 'reasoning', 'math'] },
    { id: 'upsc', name: 'UPSC', subjects: ['gk', 'current-affairs', 'essay', 'csat', 'history', 'geography'] },
    { id: 'state-psc', name: 'State PSC', subjects: ['gk', 'state-gk', 'current-affairs', 'reasoning'] },
    
    // DSA Categories
    { id: 'dsa', name: 'DSA (General)', subjects: ['arrays', 'linked-lists', 'trees', 'graphs', 'dp', 'sorting', 'searching', 'stacks', 'queues', 'recursion', 'hashing'] },
    { id: 'dsa-arrays', name: 'DSA - Arrays', subjects: ['array-manipulation', 'two-pointers', 'sliding-window', 'strings', 'prefix-sum'] },
    { id: 'dsa-trees', name: 'DSA - Trees', subjects: ['binary-trees', 'bst', 'avl', 'traversals', 'segment-trees', 'tries'] },
    { id: 'dsa-graphs', name: 'DSA - Graphs', subjects: ['bfs', 'dfs', 'shortest-path', 'mst', 'topological-sort'] },
    { id: 'dsa-dp', name: 'DSA - Dynamic Programming', subjects: ['1d-dp', '2d-dp', 'knapsack', 'lcs', 'lis', 'matrix-chain'] },
    
    // Technical
    { id: 'web-development', name: 'Web Development', subjects: ['html-css', 'javascript', 'react', 'nodejs', 'typescript', 'rest-apis'] },
    { id: 'react', name: 'React.js', subjects: ['react-basics', 'hooks', 'state-management', 'redux', 'nextjs'] },
    { id: 'javascript', name: 'JavaScript', subjects: ['es6', 'dom', 'async-await', 'closures', 'promises', 'oops'] },
    { id: 'python', name: 'Python', subjects: ['basics', 'oops', 'data-structures', 'libraries', 'web-frameworks'] },
    { id: 'java', name: 'Java', subjects: ['core-java', 'oops', 'collections', 'multithreading', 'spring', 'jdbc'] },
    { id: 'cpp', name: 'C++', subjects: ['basics', 'oops', 'stl', 'pointers', 'memory-management'] },
    { id: 'database', name: 'Database', subjects: ['sql', 'nosql', 'design', 'indexing', 'transactions', 'normalization'] },
    { id: 'system-design', name: 'System Design', subjects: ['scalability', 'load-balancing', 'caching', 'sharding', 'microservices'] },
    { id: 'operating-systems', name: 'Operating Systems', subjects: ['process', 'memory', 'file-systems', 'scheduling', 'deadlocks'] },
    { id: 'networking', name: 'Computer Networks', subjects: ['osi-model', 'tcp-ip', 'http', 'dns', 'firewalls', 'security'] },
    { id: 'artificial-intelligence', name: 'AI/ML', subjects: ['ml-basics', 'deep-learning', 'nlp', 'computer-vision', 'neural-networks'] },
    
    // Educational
    { id: 'neet', name: 'NEET', subjects: ['physics', 'chemistry', 'biology-botany', 'biology-zoology'] },
    { id: 'class-11-12', name: 'Class 11-12', subjects: ['physics', 'chemistry', 'mathematics', 'biology', 'computer-science'] },
    { id: 'class-9-10', name: 'Class 9-10', subjects: ['mathematics', 'science', 'english', 'social-science', 'hindi'] },
    
    // General
    { id: 'aptitude', name: 'General Aptitude', subjects: ['quantitative', 'logical-reasoning', 'verbal', 'data-interpretation'] },
    { id: 'current-affairs', name: 'Current Affairs', subjects: ['national', 'international', 'sports', 'science-tech', 'economy'] },
    { id: 'computer-science-gk', name: 'CS General Knowledge', subjects: ['programming', 'data-structures', 'networking', 'os', 'database'] },
    
    // NIMCET 2026 - NIT MCA Common Entrance Test
    { id: 'nimcet', name: 'NIMCET (Full Mock)', subjects: ['mathematics', 'reasoning', 'computer', 'english'] },
    { id: 'nimcet-math', name: 'NIMCET - Mathematics (50Q, 12 marks each)', subjects: ['set-theory-logic', 'algebra', 'calculus', 'coordinate-geometry', 'probability-statistics'] },
    { id: 'nimcet-reasoning', name: 'NIMCET - Analytical Reasoning (40Q)', subjects: ['puzzles', 'coding-decoding', 'blood-relations', 'series', 'syllogisms', 'directions', 'data-interpretation'] },
    { id: 'nimcet-computer', name: 'NIMCET - Computer Awareness (15Q)', subjects: ['computer-basics', 'number-systems', 'boolean-algebra', 'operating-systems', 'computer-architecture'] },
    { id: 'nimcet-english', name: 'NIMCET - General English (15Q)', subjects: ['reading-comprehension', 'vocabulary', 'grammar', 'sentence-structure', 'idioms'] }
  ]
  
  // Check if user is admin
  const isAdmin = currentUser?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) {
      navigate('/')
      return
    }
    fetchDashboardData()
    fetchCategories()
    fetchAnalytics()
  }, [isAdmin, navigate])

  const getAuthHeaders = async () => {
    const token = await currentUser.getIdToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${API_URL}/admin/dashboard`, { headers })
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        console.error('Dashboard error:', data.error)
        alert('Failed to load dashboard: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      alert('Failed to connect to server. Please check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (period = analyticsPeriod) => {
    try {
      setAnalyticsLoading(true)
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/admin/analytics?period=${period}`, { headers })
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/admin/categories`, { headers })
      const data = await response.json()
      
      if (data.success && data.data && data.data.length > 0) {
        setCategories(data.data)
      }
      // If fetch fails or returns empty, keep default categories
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Keep using default categories on error
    }
  }

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/admin/questions?limit=100`, { headers })
      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/admin/users`, { headers })
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    try {
      setGenerating(true)
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${API_URL}/admin/generate-questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(genConfig)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedQuestions(data.data)
      } else {
        alert('Failed to generate questions: ' + data.error)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      alert('Error generating questions')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveGeneratedQuestions = async () => {
    try {
      setGenerating(true)
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${API_URL}/admin/save-questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: generatedQuestions })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Successfully saved ${data.data.length} questions!`)
        setGeneratedQuestions([])
        fetchDashboardData()
      } else {
        alert('Failed to save questions: ' + data.error)
      }
    } catch (error) {
      console.error('Error saving questions:', error)
      alert('Error saving questions')
    } finally {
      setGenerating(false)
    }
  }

  // DSA Coding Problem Handlers
  const handleGenerateDsaProblem = async () => {
    setGeneratingDsaProblem(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/admin/generate-dsa-problem`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: dsaTopic,
          difficulty: dsaDifficulty
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedDsaProblem(data.data)
      } else {
        alert('Failed to generate problem: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error generating DSA problem:', error)
      alert('Error generating DSA problem')
    } finally {
      setGeneratingDsaProblem(false)
    }
  }

  const handleSaveDsaProblem = async () => {
    if (!generatedDsaProblem) {
      alert('Please generate a problem first')
      return
    }

    setSavingDsaProblem(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/admin/save-dsa-problem`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          problem: generatedDsaProblem,
          category: 'dsa'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('DSA problem saved successfully!')
        setGeneratedDsaProblem(null)
        fetchDashboardData()
      } else {
        alert('Failed to save problem: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving DSA problem:', error)
      alert('Error saving DSA problem')
    } finally {
      setSavingDsaProblem(false)
    }
  }

  const handleUploadQuestions = async () => {
    if (!uploadContent.trim()) {
      alert('Please paste JSON content')
      return
    }

    try {
      setUploading(true)
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${API_URL}/admin/upload-questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: uploadContent,
          format: 'json',
          category: uploadCategory,
          subcategory: uploadSubcategory
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Successfully uploaded ${data.data.length} questions!`)
        setUploadContent('')
        fetchDashboardData()
      } else {
        alert('Failed to upload questions: ' + data.error)
      }
    } catch (error) {
      console.error('Error uploading questions:', error)
      alert('Error uploading questions. Make sure JSON is valid.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/admin/questions/${id}`, {
        method: 'DELETE',
        headers
      })
      
      const data = await response.json()
      
      if (data.success) {
        setQuestions(questions.filter(q => q.id !== id))
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  // PDF Upload Handlers
  const handlePdfFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setExtractedQuestions([])
    } else {
      alert('Please select a PDF file')
    }
  }

  const handleExtractFromPdf = async () => {
    if (!pdfFile) {
      alert('Please select a PDF file first')
      return
    }

    setExtractingPdf(true)
    try {
      const headers = await getAuthHeaders()
      delete headers['Content-Type'] // Let browser set multipart boundary
      
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      formData.append('category', pdfCategory)
      formData.append('subject', pdfSubject)

      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/competitive/upload-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': headers['Authorization']
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        alert(`Successfully extracted ${data.data.extractedCount} questions from PDF!`)
        setPdfFile(null)
        if (pdfInputRef.current) {
          pdfInputRef.current.value = ''
        }
        fetchDashboardData()
      } else {
        alert('Failed to extract questions: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('PDF extraction error:', error)
      alert('Error extracting questions from PDF. Please try again.')
    } finally {
      setExtractingPdf(false)
    }
  }

  const handleGenerateAIQuestions = async () => {
    setExtractingPdf(true)
    try {
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/generate/competitive`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: pdfCategory,
          subject: pdfSubject,
          difficulty: 'medium',
          count: parseInt(questionCount) || 10,
          aiProvider: aiProvider
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        let errMsg = `Server error (${response.status})`
        try { const errJson = JSON.parse(errText); errMsg = errJson.message || errJson.error || errMsg } catch {}
        alert('Failed to generate questions: ' + errMsg)
        return
      }

      const data = await response.json()

      if (data.success) {
        const genCount = data.data?.generatedCount || data.count || data.data?.length || 0
        alert(`Successfully generated ${genCount} questions using ${aiProvider.toUpperCase()}!`)
        fetchDashboardData()
      } else {
        alert('Failed to generate questions: ' + (data.error || data.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('AI generation error:', error)
      alert('Error generating questions: ' + (error.message || 'Network error. Check if backend is running.'))
    } finally {
      setExtractingPdf(false)
    }
  }

  const getPdfCategorySubjects = (categoryId) => {
    const category = competitiveCategories.find(c => c.id === categoryId)
    return category?.subjects || []
  }

  // Direct Feed Helper Functions
  const getDirectFeedSubcategories = (categoryId) => {
    const category = directFeedCategories.find(c => c.id === categoryId)
    return category?.subcategories || []
  }

  // ─── Local Question Parser ──────────────────────────────────────────
  // Parses raw text with multiple numbered MCQ questions into structured objects
  const parseQuestionsLocally = (rawText) => {
    const text = rawText.trim()
    if (!text) return []

    // Step 1: Split into individual question blocks by finding numbered question starts
    // We look for patterns like "1." "2." "Q1." etc. that appear to start a new question
    const questionBlocks = []
    
    // Find all potential question start positions (number followed by period/parenthesis)
    // But we need to be smart - numbers appear in content too
    // Strategy: find positions where (A) appears, then work backwards to find the question start
    const optionAPositions = []
    const optionARegex = /\(A\)/g
    let m
    while ((m = optionARegex.exec(text)) !== null) {
      optionAPositions.push(m.index)
    }

    if (optionAPositions.length === 0) {
      // No (A)(B)(C)(D) format - try A) B) C) D) format
      const altOptionRegex = /(?:^|\n)\s*A[).]\s/gm
      while ((m = altOptionRegex.exec(text)) !== null) {
        optionAPositions.push(m.index)
      }
    }

    if (optionAPositions.length === 0) {
      // Can't parse locally - return single raw block for AI
      return [{ question: text, options: [], correctAnswer: -1, explanation: '', raw: true }]
    }

    // For each (A) position, extract the question and its options
    for (let qi = 0; qi < optionAPositions.length; qi++) {
      const aPos = optionAPositions[qi]
      
      // Find the question text: everything from end of previous block (or start) to this (A)
      let prevEnd = 0
      if (qi > 0) {
        // Previous block ends after its (D) option
        // Find end by looking at region before current (A)
        prevEnd = questionBlocks[qi - 1]?._endPos || 0
      }
      
      let questionText = text.slice(prevEnd, aPos).trim()
      
      // Remove leading question number patterns: "1.", "1)", "Q1.", "Q.1", etc.
      questionText = questionText.replace(/^\s*(?:Q\.?\s*)?\d+\s*[.)]\s*/i, '').trim()
      // Remove trailing dots or colons
      questionText = questionText.replace(/[:\s]+$/, '').trim()
      
      // Find the boundary for this question's options
      // Options end at the next (A) or end of text  
      const nextAPos = qi + 1 < optionAPositions.length ? optionAPositions[qi + 1] : text.length
      const optionsRegion = text.slice(aPos, nextAPos)
      
      // Parse options: (A)...(B)...(C)...(D)...
      let options = []
      let correctAnswer = -1
      let explanation = ''
      let endPos = nextAPos
      
      const optMatch = optionsRegion.match(
        /\(A\)\s*([\s\S]*?)\s*\(B\)\s*([\s\S]*?)\s*\(C\)\s*([\s\S]*?)\s*\(D\)\s*([\s\S]*)/i
      )
      
      if (!optMatch) {
        // Try A) B) C) D) format
        const altMatch = optionsRegion.match(
          /A[).]\s*([\s\S]*?)\s*B[).]\s*([\s\S]*?)\s*C[).]\s*([\s\S]*?)\s*D[).]\s*([\s\S]*)/i
        )
        if (altMatch) {
          Object.assign(optMatch || {}, altMatch)
        }
      }
      
      if (optMatch) {
        let optA = optMatch[1].trim()
        let optB = optMatch[2].trim()
        let optC = optMatch[3].trim()
        let optD = optMatch[4].trim()
        
        // Clean optD - may contain next question number, answer, explanation, or source text
        // Remove trailing source like "acmeacademy.in" or similar
        optD = optD.replace(/\s*[a-zA-Z]+academy\.[a-z]+\s*/gi, '').trim()
        optD = optD.replace(/\s*www\.\S+\s*/gi, '').trim()
        
        // Extract answer from text: "Answer: A", "Ans: (B)", "Correct Answer: C", etc.
        const answerPatterns = [
          /(?:Correct\s*Answer|Answer|Ans|Correct)\s*[:\s-]+\s*\(?([A-Da-d])\)?/i,
          /(?:Correct\s*Answer|Answer|Ans|Correct)\s*[:\s-]+\s*(?:Option\s*)?([A-Da-d])/i,
          /\b([A-D])\s+is\s+(?:the\s+)?correct\b/i,
        ]
        
        // Search for answer in optD (often appended at the end) and in the full region
        const searchText = optD + ' ' + optionsRegion
        for (const pat of answerPatterns) {
          const ansMatch = searchText.match(pat)
          if (ansMatch) {
            correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65
            // Clean the answer text from optD
            optD = optD.replace(pat, '').trim()
            break
          }
        }
        
        // Extract explanation
        const explPatterns = [
          /(?:Explanation|Solution|Reason|Hint)\s*[:\s-]+\s*([\s\S]+)/i,
        ]
        for (const pat of explPatterns) {
          const explMatch = optD.match(pat)
          if (explMatch) {
            explanation = explMatch[1].trim()
            optD = optD.replace(pat, '').trim()
            break
          }
        }
        
        // Remove trailing question number that belongs to next question
        optD = optD.replace(/\s*\d+\s*[.)]\s*$/, '').trim()
        
        options = [optA, optB, optC, optD]
      }
      
      if (questionText || options.length > 0) {
        const block = {
          question: questionText,
          options,
          correctAnswer,
          explanation,
          _endPos: aPos + (optMatch ? optMatch[0].length + optMatch.index : optionsRegion.length),
        }
        questionBlocks.push(block)
      }
    }
    
    // Clean up internal tracking and return
    return questionBlocks.map(({ _endPos, ...q }) => q)
  }

  const handleParseQuestion = () => {
    if (!directFeedInput.trim()) {
      alert('Please enter question text')
      return
    }

    setParsingQuestion(true)
    try {
      const results = parseQuestionsLocally(directFeedInput)
      
      if (results.length === 0) {
        alert('Could not parse any questions. Check the format.')
        return
      }
      
      // Check if any question is raw (couldn't parse options)
      const hasRaw = results.some(q => q.raw)
      
      if (hasRaw && results.length === 1) {
        // Single unparseable question - fall back to showing it raw
        setParsedQuestions(results)
        setParsedQuestion(results[0])
      } else {
        setParsedQuestions(results)
        setParsedQuestion(results[0])
      }
      setCurrentParsedIndex(0)
      
      if (results.length > 1) {
        alert(`Successfully parsed ${results.length} questions! Use the navigation arrows to review each one.`)
      }
    } catch (error) {
      console.error('Parse error:', error)
      alert('Error parsing questions')
    } finally {
      setParsingQuestion(false)
    }
  }

  const handleParseWithAI = async () => {
    if (!directFeedInput.trim()) {
      alert('Please enter question text')
      return
    }

    setParsingQuestion(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/direct-feed/parse-question`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rawText: directFeedInput,
          aiProvider: directFeedAiProvider
        })
      })

      const data = await response.json()

      if (data.success) {
        const q = data.data
        setParsedQuestion(q)
        setParsedQuestions([q])
        setCurrentParsedIndex(0)
        if (q.suggestedCategory) setDirectFeedCategory(q.suggestedCategory)
        if (q.suggestedSubcategory) setDirectFeedSubcategory(q.suggestedSubcategory)
        if (q.difficulty) setDirectFeedDifficulty(q.difficulty)
      } else {
        alert('Failed to parse question: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Parse error:', error)
      alert('Error parsing question with AI')
    } finally {
      setParsingQuestion(false)
    }
  }

  const handleValidateQuestion = async () => {
    if (!parsedQuestion) {
      alert('Please parse a question first')
      return
    }

    setParsingQuestion(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/direct-feed/validate-question`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: parsedQuestion,
          aiProvider: directFeedAiProvider
        })
      })

      const data = await response.json()

      if (data.success) {
        const updated = data.data
        setParsedQuestion(updated)
        // Also update in array
        setParsedQuestions(prev => {
          const copy = [...prev]
          copy[currentParsedIndex] = updated
          return copy
        })
        if (data.data.improvements && data.data.improvements.length > 0) {
          alert('Question improved:\n' + data.data.improvements.join('\n'))
        }
      } else {
        alert('Validation failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Validate error:', error)
      alert('Error validating question')
    } finally {
      setParsingQuestion(false)
    }
  }

  const handleSaveDirectFeedQuestion = async () => {
    if (!parsedQuestion) {
      alert('Please parse a question first')
      return
    }

    if (parsedQuestion.correctAnswer === -1 || parsedQuestion.correctAnswer === undefined) {
      alert('Please set the correct answer before saving')
      return
    }

    setSavingQuestion(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/direct-feed/save-question`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: parsedQuestion.question,
          options: parsedQuestion.options,
          correctAnswer: parsedQuestion.correctAnswer,
          explanation: parsedQuestion.explanation,
          category: directFeedCategory,
          subcategory: directFeedSubcategory,
          difficulty: directFeedDifficulty
        })
      })

      const data = await response.json()

      if (data.success) {
        // Mark as saved in the array
        setParsedQuestions(prev => {
          const copy = [...prev]
          copy[currentParsedIndex] = { ...copy[currentParsedIndex], _saved: true }
          return copy
        })
        alert(`Question ${currentParsedIndex + 1} saved successfully!`)
        fetchDirectFeedStats()
        fetchDashboardData()
        // Move to next unsaved question
        const nextUnsaved = parsedQuestions.findIndex((q, i) => i > currentParsedIndex && !q._saved)
        if (nextUnsaved !== -1) {
          setCurrentParsedIndex(nextUnsaved)
          setParsedQuestion(parsedQuestions[nextUnsaved])
        }
      } else {
        alert('Failed to save question: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving question')
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleSaveAllParsedQuestions = async () => {
    const validQuestions = parsedQuestions.filter(q => 
      q.question && q.options?.length === 4 && !q._saved && !q.raw
    )
    
    if (validQuestions.length === 0) {
      alert('No valid unsaved questions to save. Each question needs text and 4 options.')
      return
    }

    setSavingQuestion(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/direct-feed/save-bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questions: validQuestions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer >= 0 ? q.correctAnswer : 0,
            explanation: q.explanation || ''
          })),
          category: directFeedCategory,
          subcategory: directFeedSubcategory,
          difficulty: directFeedDifficulty
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Successfully saved ${data.count} questions!`)
        setParsedQuestions(prev => prev.map(q => ({ ...q, _saved: true })))
        fetchDirectFeedStats()
        fetchDashboardData()
      } else {
        alert('Failed to save questions: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Bulk save error:', error)
      alert('Error saving questions')
    } finally {
      setSavingQuestion(false)
    }
  }

  // Navigate parsed questions
  const goToParsedQuestion = (index) => {
    if (index >= 0 && index < parsedQuestions.length) {
      setCurrentParsedIndex(index)
      setParsedQuestion(parsedQuestions[index])
    }
  }

  // Update correct answer for current question
  const setCorrectAnswerForCurrent = (answerIndex) => {
    const updated = { ...parsedQuestion, correctAnswer: answerIndex }
    setParsedQuestion(updated)
    setParsedQuestions(prev => {
      const copy = [...prev]
      copy[currentParsedIndex] = updated
      return copy
    })
  }

  const handleGenerateDirectFeedQuestions = async () => {
    setGeneratingDirectFeed(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/direct-feed/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: directFeedCategory,
          subcategory: directFeedSubcategory,
          difficulty: directFeedDifficulty,
          count: parseInt(directFeedGenerateCount) || 5,
          aiProvider: directFeedAiProvider
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        let errMsg = `Server error (${response.status})`
        try { const errJson = JSON.parse(errText); errMsg = errJson.error || errMsg } catch {}
        alert('Failed to generate questions: ' + errMsg)
        return
      }

      const data = await response.json()

      if (data.success) {
        setGeneratedDirectFeedQuestions(data.data || [])
        if (!data.data || data.data.length === 0) {
          alert('AI returned no questions. Try a different category or provider.')
        }
      } else {
        alert('Failed to generate questions: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Generate error:', error)
      alert('Error generating questions: ' + (error.message || 'Network error. Check if backend is running.'))
    } finally {
      setGeneratingDirectFeed(false)
    }
  }

  const handleSaveGeneratedDirectFeedQuestions = async () => {
    if (generatedDirectFeedQuestions.length === 0) {
      alert('No questions to save')
      return
    }

    setSavingQuestion(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/direct-feed/save-bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questions: generatedDirectFeedQuestions,
          category: directFeedCategory,
          subcategory: directFeedSubcategory,
          difficulty: directFeedDifficulty
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Successfully saved ${data.count} questions!`)
        setGeneratedDirectFeedQuestions([])
        fetchDirectFeedStats()
        fetchDashboardData()
      } else {
        alert('Failed to save questions: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving questions')
    } finally {
      setSavingQuestion(false)
    }
  }

  const fetchDirectFeedStats = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/direct-feed/stats`, { headers })
      const data = await response.json()

      if (data.success) {
        setDirectFeedStats(data.data)
      }
    } catch (error) {
      console.error('Stats error:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'direct-feed') {
      fetchDirectFeedStats()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions()
    } else if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
    { id: 'direct-feed', label: 'Direct Feed', icon: FiZap },
    { id: 'scheduled-exams', label: 'Scheduled Exams', icon: FiCalendar },
    { id: 'dsa-coding', label: 'DSA Coding', icon: FiCode },
    { id: 'pdf-upload', label: 'PDF Extract', icon: FiFile },
    { id: 'generate', label: 'AI Generate', icon: FiCpu },
    { id: 'upload', label: 'JSON Upload', icon: FiUpload },
    { id: 'questions', label: 'Questions', icon: FiFileText },
    { id: 'users', label: 'Users', icon: FiUsers }
  ]

  const getCategorySubcategories = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.subcategories || []
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FiSettings className="w-8 h-8 text-cyan-400" />
            Admin Panel
          </h1>
          <p className="text-gray-400 mt-2">
            Manage questions, users, and system settings
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-[#111d2e] text-gray-400 hover:bg-[#162a42] hover:text-gray-200 border border-gray-700/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {loading && !analytics ? (
                <LoadingSpinner text="Loading analytics..." />
              ) : (
                <>
                  {/* ── Summary Stat Cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { label: 'Total Users', value: analytics?.summaryStats?.totalUsers ?? stats?.totalUsers ?? 0, icon: FiUsers, color: 'blue', growth: analytics?.summaryStats?.userGrowth },
                      { label: 'Total Questions', value: analytics?.summaryStats?.totalQuestions ?? stats?.totalQuestions ?? 0, icon: FiFileText, color: 'emerald', growth: analytics?.summaryStats?.questionGrowth },
                      { label: 'Practice Tests', value: analytics?.summaryStats?.totalTests ?? stats?.totalTests ?? 0, icon: FiBarChart2, color: 'violet', sub: `${analytics?.summaryStats?.testsToday ?? stats?.todayTests ?? 0} today` },
                      { label: 'Total Exams', value: analytics?.summaryStats?.totalExams ?? stats?.totalExams ?? 0, icon: FiAward, color: 'amber', sub: `${analytics?.summaryStats?.examsToday ?? stats?.todayExams ?? 0} today` }
                    ].map((card, i) => (
                      <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2.5 rounded-xl ${
                            card.color === 'blue' ? 'bg-blue-500/15' :
                            card.color === 'emerald' ? 'bg-emerald-500/15' :
                            card.color === 'violet' ? 'bg-violet-500/15' : 'bg-amber-500/15'
                          }`}>
                            <card.icon className={`w-5 h-5 ${
                              card.color === 'blue' ? 'text-blue-400' :
                              card.color === 'emerald' ? 'text-emerald-400' :
                              card.color === 'violet' ? 'text-violet-400' : 'text-amber-400'
                            }`} />
                          </div>
                          {card.growth && (
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FiTrendingUp className="w-3 h-3" /> {card.growth}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-white">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{card.label}</p>
                        {card.sub && <p className="text-xs text-gray-500 mt-1">{card.sub}</p>}
                      </motion.div>
                    ))}
                  </div>

                  {/* ── Row 2: Daily Activity Chart + Recent Actions + System Health ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Daily Activity Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="lg:col-span-2 bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white">Daily Activity</h3>
                          <p className="text-sm text-gray-400">Active Users vs Exams Taken</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="text-xs text-gray-400">Active Users</span>
                            {analytics?.dailyActivity?.length > 1 && (
                              <span className="text-xs text-emerald-400 font-medium">
                                +{Math.round(((analytics.dailyActivity[analytics.dailyActivity.length - 1]?.activeUsers || 0) / Math.max(1, analytics.dailyActivity[0]?.activeUsers || 1) - 1) * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="text-xs text-gray-400">Exams</span>
                          </div>
                          <select
                            value={analyticsPeriod}
                            onChange={(e) => { setAnalyticsPeriod(e.target.value); fetchAnalytics(e.target.value) }}
                            className="bg-[#0a1628] text-sm text-gray-300 border border-gray-700/50 rounded-lg px-3 py-1.5 focus:outline-none"
                          >
                            <option value="7">Last 7 Days</option>
                            <option value="14">Last 14 Days</option>
                            <option value="30">Last 30 Days</option>
                          </select>
                        </div>
                      </div>

                      {/* SVG Area Chart */}
                      <div className="relative h-52">
                        {analytics?.dailyActivity && analytics.dailyActivity.length > 0 ? (() => {
                          const data = analytics.dailyActivity
                          const maxVal = Math.max(...data.map(d => Math.max(d.activeUsers, d.exams + d.tests)), 1)
                          const w = 100
                          const h = 100
                          const points = data.map((d, i) => ({
                            x: (i / Math.max(data.length - 1, 1)) * w,
                            yUsers: h - (d.activeUsers / maxVal) * h * 0.85,
                            yExams: h - ((d.exams + d.tests) / maxVal) * h * 0.85,
                            label: d.dayLabel,
                            users: d.activeUsers,
                            exams: d.exams + d.tests,
                            date: d.date
                          }))
                          const linePath = (key) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p[key]}`).join(' ')
                          const areaPath = (key) => `${linePath(key)} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`

                          return (
                            <svg viewBox={`0 0 ${w} ${h + 12}`} className="w-full h-full" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="areaGradUsers" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                                </linearGradient>
                                <linearGradient id="areaGradExams" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                                </linearGradient>
                              </defs>
                              {/* Grid lines */}
                              {[0.25, 0.5, 0.75].map(frac => (
                                <line key={frac} x1="0" y1={h * frac} x2={w} y2={h * frac} stroke="#1e3a5f" strokeWidth="0.3" strokeDasharray="2,2" />
                              ))}
                              {/* Area fills */}
                              <path d={areaPath('yUsers')} fill="url(#areaGradUsers)" />
                              <path d={areaPath('yExams')} fill="url(#areaGradExams)" />
                              {/* Lines */}
                              <path d={linePath('yUsers')} fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d={linePath('yExams')} fill="none" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              {/* Data points */}
                              {points.map((p, i) => (
                                <g key={i}>
                                  <circle cx={p.x} cy={p.yUsers} r="1.5" fill="#06b6d4" />
                                  {/* Tooltip label on hover via title */}
                                  <title>{p.label}: {p.users} users, {p.exams} exams</title>
                                  {/* Show peak label */}
                                  {p.users === Math.max(...points.map(pp => pp.users)) && p.users > 0 && (
                                    <g>
                                      <rect x={p.x - 10} y={p.yUsers - 12} width="20" height="9" rx="2" fill="#111d2e" stroke="#06b6d4" strokeWidth="0.3" />
                                      <text x={p.x} y={p.yUsers - 5.5} textAnchor="middle" fill="#06b6d4" fontSize="4" fontWeight="bold">
                                        {p.users.toLocaleString()}
                                      </text>
                                    </g>
                                  )}
                                </g>
                              ))}
                              {/* X-axis labels */}
                              {points.filter((_, i) => data.length <= 7 || i % Math.ceil(data.length / 7) === 0).map((p) => (
                                <text key={p.x} x={p.x} y={h + 8} textAnchor="middle" fill="#6b7280" fontSize="3.5">
                                  {p.label}
                                </text>
                              ))}
                            </svg>
                          )
                        })() : (
                          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                            No activity data available
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Right Column: Recent Actions + System Health */}
                    <div className="space-y-5">
                      {/* Recent Actions */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-bold text-white">Recent Actions</h3>
                          <button
                            onClick={fetchAnalytics}
                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            View All
                          </button>
                        </div>
                        <div className="space-y-3">
                          {analytics?.recentActions && analytics.recentActions.length > 0 ? (
                            analytics.recentActions.map((action, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg mt-0.5 ${
                                  action.type === 'exam' ? 'bg-cyan-500/15 text-cyan-400' :
                                  action.type === 'question' ? 'bg-emerald-500/15 text-emerald-400' :
                                  action.type === 'user' ? 'bg-violet-500/15 text-violet-400' :
                                  'bg-amber-500/15 text-amber-400'
                                }`}>
                                  {action.type === 'exam' ? <FiAward className="w-3.5 h-3.5" /> :
                                   action.type === 'question' ? <FiFileText className="w-3.5 h-3.5" /> :
                                   <FiActivity className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{action.title}</p>
                                  <p className="text-xs text-gray-500">{action.detail}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {(() => {
                                    const diff = Date.now() - new Date(action.time).getTime()
                                    if (diff < 60000) return 'Just now'
                                    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
                                    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
                                    return `${Math.floor(diff / 86400000)}d ago`
                                  })()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-cyan-500/15"><FiActivity className="w-3.5 h-3.5 text-cyan-400" /></div>
                                <div><p className="text-sm text-white">System Online</p><p className="text-xs text-gray-500">Server running</p></div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-emerald-500/15"><FiDatabase className="w-3.5 h-3.5 text-emerald-400" /></div>
                                <div><p className="text-sm text-white">Database Connected</p><p className="text-xs text-gray-500">Supabase + Firebase</p></div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>

                      {/* System Health */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30"
                      >
                        <h3 className="text-base font-bold text-white mb-4">System Health</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FiServer className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">API Status</span>
                            </div>
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                              {analytics?.systemHealth?.apiStatus || 'Operational'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-sm text-gray-300">Database Latency</span>
                            </div>
                            <span className="text-sm text-gray-400">{analytics?.systemHealth?.dbLatency || '--'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="text-sm text-gray-300">Memory Usage</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, (analytics?.systemHealth?.memoryUsage || 0) / 5)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-400">{analytics?.systemHealth?.memoryUsage || 0}MB</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* ── Row 3: User Engagement Trends ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-bold text-white">User Engagement Trends</h3>
                        <p className="text-sm text-gray-400">Daily active users vs Exam completions over last {analyticsPeriod} days</p>
                      </div>
                      <select
                        value={analyticsPeriod}
                        onChange={(e) => { setAnalyticsPeriod(e.target.value); fetchAnalytics(e.target.value) }}
                        className="bg-[#0a1628] text-sm text-gray-300 border border-gray-700/50 rounded-lg px-3 py-1.5 focus:outline-none"
                      >
                        <option value="7">Last 7 Days</option>
                        <option value="14">Last 14 Days</option>
                        <option value="30">Last 30 Days</option>
                      </select>
                    </div>
                    {/* Bar Chart */}
                    <div className="flex items-end gap-1 h-48">
                      {analytics?.engagementTrends && analytics.engagementTrends.length > 0 ? (
                        analytics.engagementTrends.map((d, i) => {
                          const maxEngagement = Math.max(...analytics.engagementTrends.map(t => Math.max(t.examCompletions, t.activeSessions)), 1)
                          const completionH = (d.examCompletions / maxEngagement) * 100
                          const sessionH = (d.activeSessions / maxEngagement) * 100
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative" title={`${d.label}: ${d.examCompletions} completions, ${d.activeSessions} sessions`}>
                              <div className="w-full flex items-end gap-[2px] h-40">
                                <div
                                  className="flex-1 bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-400"
                                  style={{ height: `${Math.max(completionH, 2)}%` }}
                                />
                                <div
                                  className="flex-1 bg-cyan-500/60 rounded-t-sm transition-all group-hover:bg-cyan-400/60"
                                  style={{ height: `${Math.max(sessionH, 2)}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-gray-500 mt-1">{d.label}</span>
                            </div>
                          )
                        })
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                          No engagement data
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-blue-500" />
                        <span className="text-xs text-gray-400">Exam Completions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-cyan-500/60" />
                        <span className="text-xs text-gray-400">Active Sessions</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* ── Row 4: Recent Submissions + Top Subjects ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Recent Exam Submissions */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="lg:col-span-2 bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-white">Recent Exam Submissions</h3>
                        <button
                          onClick={() => setActiveTab('users')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          View All
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/30">
                              <th className="pb-3 pl-1">Student</th>
                              <th className="pb-3">Subject</th>
                              <th className="pb-3">Score</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/40">
                            {analytics?.recentSubmissions && analytics.recentSubmissions.length > 0 ? (
                              analytics.recentSubmissions.slice(0, 5).map((sub, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-3 pl-1">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                        {sub.student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </div>
                                      <span className="text-sm text-white font-medium">{sub.student}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-sm text-gray-400">{sub.subject}</td>
                                  <td className="py-3 text-sm font-semibold text-white">{sub.score}</td>
                                  <td className="py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      sub.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400' :
                                      sub.status === 'Needs Review' ? 'bg-red-500/15 text-red-400' :
                                      'bg-amber-500/15 text-amber-400'
                                    }`}>
                                      {sub.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-xs text-gray-500">
                                    {(() => {
                                      const diff = Date.now() - new Date(sub.date).getTime()
                                      if (diff < 60000) return 'Just now'
                                      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
                                      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
                                      const d = new Date(sub.date)
                                      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    })()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                                  No recent submissions
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>

                    {/* Top Subjects */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-bold text-white">Top Subjects</h3>
                        <button className="text-gray-500 hover:text-gray-300">
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {analytics?.topSubjects && analytics.topSubjects.length > 0 ? (
                          analytics.topSubjects.map((subject, i) => {
                            const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500']
                            return (
                              <div key={i}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm text-gray-300">{subject.name}</span>
                                  <span className="text-sm font-semibold text-white">{subject.percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${subject.percentage}%` }}
                                    transition={{ delay: 0.6 + i * 0.08, duration: 0.6 }}
                                    className={`h-full rounded-full ${colors[i % colors.length]}`}
                                  />
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4">No subject data</p>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* ── Row 5: Category Stats Table ── */}
                  {stats?.categoryStats && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30"
                    >
                      <h3 className="text-lg font-bold text-white mb-5">Questions by Category</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/30">
                              <th className="pb-3">Category</th>
                              <th className="pb-3">Total</th>
                              <th className="pb-3">Easy</th>
                              <th className="pb-3">Medium</th>
                              <th className="pb-3">Hard</th>
                              <th className="pb-3">Distribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/40">
                            {Object.entries(stats.categoryStats).map(([category, data]) => {
                              const total = data.total || 1
                              return (
                                <tr key={category} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-3 font-medium text-white capitalize">
                                    {category.replace(/-/g, ' ')}
                                  </td>
                                  <td className="py-3 text-gray-300 font-semibold">{data.total}</td>
                                  <td className="py-3 text-emerald-400">{data.easy}</td>
                                  <td className="py-3 text-amber-400">{data.medium}</td>
                                  <td className="py-3 text-red-400">{data.hard}</td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-0.5 w-24">
                                      <div className="h-1.5 bg-emerald-500 rounded-l-full" style={{ width: `${(data.easy / total) * 100}%` }} />
                                      <div className="h-1.5 bg-amber-500" style={{ width: `${(data.medium / total) * 100}%` }} />
                                      <div className="h-1.5 bg-red-500 rounded-r-full" style={{ width: `${(data.hard / total) * 100}%` }} />
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Refresh Button ── */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => { fetchDashboardData(); fetchAnalytics() }}
                      disabled={analyticsLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#111d2e] border border-gray-700/30 rounded-xl text-gray-300 hover:text-white hover:border-cyan-500/30 transition-all text-sm"
                    >
                      <FiRefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                      {analyticsLoading ? 'Refreshing...' : 'Refresh Analytics'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'direct-feed' && (
            <motion.div
              key="direct-feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              {directFeedStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FiFileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Questions</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{directFeedStats.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <FiCheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Approved</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{directFeedStats.approved}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pending</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{directFeedStats.pending}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-200 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FiZap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Direct Feed</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{directFeedStats.bySource?.['direct-feed'] || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Approve Section */}
              {directFeedStats && directFeedStats.pending > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
                        📋 Bulk Approve Pending Questions
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {directFeedStats.pending} question{directFeedStats.pending !== 1 ? 's' : ''} waiting for approval
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`Approve all ${directFeedStats.pending} pending questions?`)) return;
                        
                        try {
                          const headers = await getAuthHeaders();
                          const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/competitive/questions/bulk-approve`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ filters: {} })
                          });
                          
                          const data = await response.json();
                          
                          if (data.success) {
                            alert(`✅ Successfully approved ${data.data.count} questions!`);
                            // Refresh stats
                            const statsResponse = await fetch(`${API_URL.replace('/api', '')}/api/v2/competitive/stats`, { headers });
                            const statsData = await statsResponse.json();
                            if (statsData.success) {
                              setDirectFeedStats(statsData.data);
                            }
                          } else {
                            alert('Failed to approve questions: ' + data.error);
                          }
                        } catch (error) {
                          console.error('Bulk approve error:', error);
                          alert('Error approving questions');
                        }
                      }}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <FiCheckCircle className="w-5 h-5" />
                      Approve All ({directFeedStats.pending})
                    </button>
                  </div>
                </div>
              )}

              {/* Main Direct Feed Section */}
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiZap className="w-5 h-5 text-yellow-500" />
                  Direct Question Feed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Directly feed questions to Supabase with AI-assisted parsing and categorization
                </p>

                {/* AI Provider & Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AI Provider
                    </label>
                    <select
                      value={directFeedAiProvider}
                      onChange={(e) => setDirectFeedAiProvider(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value="openrouter">🧠 DeepSeek R1 (OpenRouter)</option>
                      <option value="groq">🚀 Groq (Llama 3.3 70B)</option>
                      <option value="gemini">✨ Gemini (Google AI)</option>
                      <option value="nvidia">🟢 NVIDIA NIM (Llama 3.1 70B)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={directFeedCategory}
                      onChange={(e) => {
                        setDirectFeedCategory(e.target.value)
                        const subs = getDirectFeedSubcategories(e.target.value)
                        setDirectFeedSubcategory(subs[0]?.id || 'general')
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      {directFeedCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subcategory
                    </label>
                    <select
                      value={directFeedSubcategory}
                      onChange={(e) => setDirectFeedSubcategory(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      {getDirectFeedSubcategories(directFeedCategory).map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={directFeedDifficulty}
                      onChange={(e) => setDirectFeedDifficulty(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Generate Count
                    </label>
                    <select
                      value={directFeedGenerateCount}
                      onChange={(e) => setDirectFeedGenerateCount(parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                      <option value={30}>30 Questions</option>
                      <option value={50}>50 Questions</option>
                      <option value={75}>75 Questions</option>
                      <option value={100}>100 Questions</option>
                    </select>
                  </div>
                </div>

                {/* Question Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Paste Raw Question (AI will parse it)
                  </label>
                  <textarea
                    value={directFeedInput}
                    onChange={(e) => setDirectFeedInput(e.target.value)}
                    rows={6}
                    placeholder={`Paste your question here in any format, for example:

Q. What is 25% of 800?
A) 200
B) 250
C) 180
D) 220
Answer: A
Explanation: 25% of 800 = (25/100) × 800 = 200`}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <button
                    onClick={handleParseQuestion}
                    disabled={parsingQuestion || !directFeedInput.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {parsingQuestion ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <FiCpu className="w-5 h-5" />
                        Parse Locally
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleParseWithAI}
                    disabled={parsingQuestion || !directFeedInput.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {parsingQuestion ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <FiZap className="w-5 h-5" />
                        Parse with AI
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGenerateDirectFeedQuestions}
                    disabled={generatingDirectFeed}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {generatingDirectFeed ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiZap className="w-5 h-5" />
                        Generate {directFeedGenerateCount} Questions
                      </>
                    )}
                  </button>
                </div>

                {/* Parsed Question Preview */}
                {parsedQuestions.length > 0 && parsedQuestion && (
                  <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
                    {/* Header with navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FiEye className="w-5 h-5 text-blue-500" />
                          Parsed Question Preview
                        </h3>
                        {parsedQuestions.length > 1 && (
                          <div className="flex items-center gap-2 bg-gray-200 dark:bg-dark-200 rounded-lg px-2 py-1">
                            <button
                              onClick={() => goToParsedQuestion(currentParsedIndex - 1)}
                              disabled={currentParsedIndex === 0}
                              className="p-1 rounded hover:bg-gray-300 dark:hover:bg-dark-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <FiChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                              {currentParsedIndex + 1} / {parsedQuestions.length}
                            </span>
                            <button
                              onClick={() => goToParsedQuestion(currentParsedIndex + 1)}
                              disabled={currentParsedIndex === parsedQuestions.length - 1}
                              className="p-1 rounded hover:bg-gray-300 dark:hover:bg-dark-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <FiChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        {parsedQuestion._saved && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                            ✓ Saved
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleValidateQuestion}
                          disabled={parsingQuestion}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50"
                        >
                          <FiCheck className="w-4 h-4" />
                          Validate & Improve
                        </button>
                        <button
                          onClick={() => { setParsedQuestions([]); setParsedQuestion(null); setCurrentParsedIndex(0) }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                        >
                          <FiX className="w-4 h-4" />
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Question number pills for quick navigation */}
                    {parsedQuestions.length > 1 && (
                      <div className="flex flex-wrap gap-1 mb-4 p-2 bg-gray-100 dark:bg-dark-200 rounded-lg">
                        {parsedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => goToParsedQuestion(idx)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                              idx === currentParsedIndex
                                ? 'bg-blue-500 text-white'
                                : q._saved
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : q.correctAnswer === -1 || q.correctAnswer === undefined
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    : 'bg-gray-200 text-gray-700 dark:bg-dark-100 dark:text-gray-300 hover:bg-gray-300'
                            }`}
                            title={q._saved ? 'Saved' : q.correctAnswer === -1 ? 'No answer set' : `Question ${idx + 1}`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Question:</p>
                        <p className="text-gray-900 dark:text-white font-medium">{parsedQuestion.question || '(Could not extract question text)'}</p>
                      </div>

                      {parsedQuestion.options?.length > 0 ? (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Options (click to set correct answer):</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parsedQuestion.options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => setCorrectAnswerForCurrent(i)}
                                className={`p-3 rounded-lg text-left transition-all ${
                                  i === parsedQuestion.correctAnswer
                                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-800 dark:text-green-300'
                                    : 'bg-white dark:bg-dark-200 border border-gray-200 dark:border-dark-100 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                }`}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                                {i === parsedQuestion.correctAnswer && (
                                  <span className="ml-2 text-green-600 dark:text-green-400">✓ Correct</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-700 dark:text-orange-300">
                          ⚠️ Could not parse options. The question format may not be recognized.
                        </div>
                      )}

                      {parsedQuestion.correctAnswer === -1 && parsedQuestion.options?.length > 0 && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-700 dark:text-orange-300 text-sm">
                          ⚠️ No correct answer detected. Click an option above to set it.
                        </div>
                      )}

                      {parsedQuestion.explanation && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Explanation:</p>
                          <p className="text-gray-700 dark:text-gray-300">{parsedQuestion.explanation}</p>
                        </div>
                      )}

                      {parsedQuestion.suggestedCategory && (
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                            Suggested: {parsedQuestion.suggestedCategory}
                          </span>
                          {parsedQuestion.suggestedSubcategory && (
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs">
                              {parsedQuestion.suggestedSubcategory}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Save buttons */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleSaveDirectFeedQuestion}
                        disabled={savingQuestion || parsedQuestion._saved}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {savingQuestion ? (
                          <>
                            <FiRefreshCw className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : parsedQuestion._saved ? (
                          <>
                            <FiCheck className="w-5 h-5" />
                            Already Saved
                          </>
                        ) : (
                          <>
                            <FiSend className="w-5 h-5" />
                            Save This Question
                          </>
                        )}
                      </button>
                      
                      {parsedQuestions.length > 1 && (
                        <button
                          onClick={handleSaveAllParsedQuestions}
                          disabled={savingQuestion || parsedQuestions.every(q => q._saved)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {savingQuestion ? (
                            <>
                              <FiRefreshCw className="w-5 h-5 animate-spin" />
                              Saving All...
                            </>
                          ) : (
                            <>
                              <FiDatabase className="w-5 h-5" />
                              Save All ({parsedQuestions.filter(q => !q._saved && !q.raw && q.options?.length === 4).length} questions)
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Generated Questions Preview */}
                {generatedDirectFeedQuestions.length > 0 && (
                  <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiZap className="w-5 h-5 text-purple-500" />
                        Generated Questions ({generatedDirectFeedQuestions.length})
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveGeneratedDirectFeedQuestions}
                          disabled={savingQuestion}
                          className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                        >
                          <FiCheck className="w-4 h-4" />
                          Save All
                        </button>
                        <button
                          onClick={() => setGeneratedDirectFeedQuestions([])}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                        >
                          <FiX className="w-4 h-4" />
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {generatedDirectFeedQuestions.map((q, index) => (
                        <div key={index} className="bg-white dark:bg-dark-200 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white mb-2">
                            {index + 1}. {q.question}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {q.options?.map((opt, i) => (
                              <div
                                key={i}
                                className={`p-2 rounded ${
                                  i === q.correctAnswer
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800/50">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  ⚡ Direct Feed Features
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• <strong>DeepSeek R1:</strong> Advanced reasoning model for accurate question parsing and generation</li>
                  <li>• <strong>Groq (Llama 3.3 70B):</strong> Fast inference for quick question processing</li>
                  <li>• <strong>Gemini:</strong> Google's AI for diverse question generation</li>
                  <li>• <strong>Auto-Categorization:</strong> AI suggests the best category based on question content</li>
                  <li>• <strong>Validation:</strong> AI improves question quality and adds explanations</li>
                  <li>• Questions are directly saved to Supabase with auto-approval</li>
                </ul>
              </div>
            </motion.div>
          )}

          {activeTab === 'scheduled-exams' && (
            <motion.div
              key="scheduled-exams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FiCalendar className="w-5 h-5 text-primary-500" />
                      Scheduled Exams Management
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Create and manage scheduled competitive exams
                    </p>
                  </div>
                  <a
                    href="/admin/exams"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Open Exam Manager
                  </a>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border border-gray-200 dark:border-dark-100 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FiPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Create Exam</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Schedule new competitive exams with AI-generated questions
                    </p>
                    <a href="/admin/exams" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                      Go to Exam Manager →
                    </a>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-dark-100 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <FiBarChart2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">View Results</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Check exam results, scores and participant statistics
                    </p>
                    <a href="/admin/exams" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                      View All Results →
                    </a>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-dark-100 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FiUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Manage Participants</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      View registered participants and manage access
                    </p>
                    <a href="/admin/exams" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                      Manage Access →
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dsa-coding' && (
            <motion.div
              key="dsa-coding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiCode className="w-5 h-5 text-green-500" />
                  DSA Coding Problem Generator
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Generate LeetCode-style coding problems with test cases, starter code, and solutions using AI.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic
                    </label>
                    <select
                      value={dsaTopic}
                      onChange={(e) => setDsaTopic(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      {dsaTopics.map(topic => (
                        <option key={topic.id} value={topic.id}>{topic.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={dsaDifficulty}
                      onChange={(e) => setDsaDifficulty(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateDsaProblem}
                      disabled={generatingDsaProblem}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {generatingDsaProblem ? (
                        <>
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FiPlay className="w-4 h-4" />
                          Generate Problem
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Generated Problem Preview */}
                {generatedDsaProblem && (
                  <div className="mt-6 border-t border-gray-200 dark:border-dark-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          generatedDsaProblem.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          generatedDsaProblem.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {generatedDsaProblem.difficulty?.toUpperCase()}
                        </span>
                        {generatedDsaProblem.title}
                      </h3>
                      <button
                        onClick={handleSaveDsaProblem}
                        disabled={savingDsaProblem}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                      >
                        {savingDsaProblem ? (
                          <>
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FiCheck className="w-4 h-4" />
                            Save to Database
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Problem Description */}
                    <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                      <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">📝 Description</h4>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-dark-100 p-4 rounded-lg">
                        {generatedDsaProblem.description}
                      </p>
                    </div>
                    
                    {/* Examples */}
                    {generatedDsaProblem.examples && generatedDsaProblem.examples.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">📌 Examples</h4>
                        <div className="space-y-3">
                          {generatedDsaProblem.examples.map((ex, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-dark-100 p-4 rounded-lg font-mono text-sm">
                              <p><span className="text-gray-500">Input:</span> <span className="text-green-600 dark:text-green-400">{ex.input}</span></p>
                              <p><span className="text-gray-500">Output:</span> <span className="text-blue-600 dark:text-blue-400">{ex.output}</span></p>
                              {ex.explanation && (
                                <p className="text-gray-500 mt-1 font-sans text-xs">{ex.explanation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Constraints */}
                    {generatedDsaProblem.constraints && generatedDsaProblem.constraints.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">⚠️ Constraints</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {generatedDsaProblem.constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Starter Code */}
                    {generatedDsaProblem.starterCode && (
                      <div className="mb-6">
                        <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">💻 Starter Code</h4>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-green-400 text-sm font-mono">
                            {generatedDsaProblem.starterCode.javascript || generatedDsaProblem.starterCode.python || 'No starter code available'}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Solution Approach */}
                    {generatedDsaProblem.solution && (
                      <div className="mb-6">
                        <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">💡 Solution Approach</h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{generatedDsaProblem.solution.approach}</p>
                          <div className="flex gap-4 text-xs">
                            <span className="text-gray-500">Time: <span className="text-blue-600 dark:text-blue-400">{generatedDsaProblem.solution.timeComplexity}</span></span>
                            <span className="text-gray-500">Space: <span className="text-blue-600 dark:text-blue-400">{generatedDsaProblem.solution.spaceComplexity}</span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Hints */}
                    {generatedDsaProblem.hints && generatedDsaProblem.hints.length > 0 && (
                      <div>
                        <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-2">🎯 Hints</h4>
                        <div className="space-y-2">
                          {generatedDsaProblem.hints.map((hint, i) => (
                            <details key={i} className="bg-gray-50 dark:bg-dark-100 rounded-lg">
                              <summary className="px-4 py-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                Hint {i + 1}
                              </summary>
                              <p className="px-4 pb-2 text-sm text-gray-600 dark:text-gray-400">{hint}</p>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'pdf-upload' && (
            <motion.div
              key="pdf-upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiFile className="w-5 h-5 text-primary-500" />
                  PDF Question Extractor (Competitive Exams)
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Upload PDF exam papers and let AI extract questions for competitive exams (TCS, Infosys, SSC, Banking, etc.)
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Category
                    </label>
                    <select
                      value={pdfCategory}
                      onChange={(e) => {
                        setPdfCategory(e.target.value)
                        const subjects = getPdfCategorySubjects(e.target.value)
                        setPdfSubject(subjects[0] || 'aptitude')
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      {competitiveCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <select
                      value={pdfSubject}
                      onChange={(e) => setPdfSubject(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      {getPdfCategorySubjects(pdfCategory).map(sub => (
                        <option key={sub} value={sub}>{sub.charAt(0).toUpperCase() + sub.slice(1).replace(/-/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AI Provider
                    </label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value="groq">🚀 Groq (Llama 3.3 70B)</option>
                      <option value="gemini">✨ Gemini (Google AI)</option>
                      <option value="openrouter">🧠 DeepSeek R1 (OpenRouter)</option>
                      <option value="nvidia">🟢 NVIDIA NIM (Llama 3.1 70B)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Count
                    </label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                      <option value={30}>30 Questions</option>
                      <option value={50}>50 Questions</option>
                      <option value={75}>75 Questions</option>
                      <option value={100}>100 Questions</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload PDF File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-dark-100 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      ref={pdfInputRef}
                      accept="application/pdf"
                      onChange={handlePdfFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer"
                    >
                      {pdfFile ? (
                        <div>
                          <FiFile className="w-12 h-12 mx-auto text-green-500 mb-2" />
                          <p className="text-gray-900 dark:text-white font-medium">{pdfFile.name}</p>
                          <p className="text-sm text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">Click to upload PDF</p>
                          <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleExtractFromPdf}
                    disabled={extractingPdf || !pdfFile}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extractingPdf ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <FiFile className="w-5 h-5" />
                        Extract from PDF
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleGenerateAIQuestions}
                    disabled={extractingPdf}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extractingPdf ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiCpu className="w-5 h-5" />
                        Generate {questionCount} Questions ({aiProvider === 'groq' ? 'Groq' : aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'openrouter' ? 'OpenRouter' : 'NVIDIA'})
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  💡 How it works
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• <strong>PDF Extract:</strong> Upload exam papers from TCS, Infosys, SSC, Banking etc. The AI will analyze and extract MCQ questions.</li>
                  <li>• <strong>AI Generate (Groq):</strong> Uses Llama 3.3 70B model - fast and high quality generation.</li>
                  <li>• <strong>AI Generate (Gemini):</strong> Uses Google's Gemini AI - excellent for diverse questions.</li>
                  <li>• <strong>Categories:</strong> Support for IT companies, Government exams, DSA, Web Dev, Python, Java, and more!</li>
                  <li>• Questions are saved to Supabase and can be used in competitive exam tests.</li>
                  <li>• All questions are initially marked as pending approval.</li>
                </ul>
              </div>
            </motion.div>
          )}

          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiCpu className="w-5 h-5 text-primary-500" />
                  AI Question Generator (Daily Practice)
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Use Gemini AI to generate new MCQ questions for daily practice.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={genConfig.category}
                      onChange={(e) => setGenConfig({ ...genConfig, category: e.target.value, subcategory: '' })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subcategory
                    </label>
                    <select
                      value={genConfig.subcategory}
                      onChange={(e) => setGenConfig({ ...genConfig, subcategory: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value="">Select subcategory</option>
                      {getCategorySubcategories(genConfig.category).map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={genConfig.difficulty}
                      onChange={(e) => setGenConfig({ ...genConfig, difficulty: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Count
                    </label>
                    <select
                      value={genConfig.count}
                      onChange={(e) => setGenConfig({ ...genConfig, count: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 questions</option>
                      <option value={10}>10 questions</option>
                      <option value={15}>15 questions</option>
                      <option value={20}>20 questions</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <FiRefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiCpu className="w-5 h-5" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
              
              {/* Generated Questions Preview */}
              {generatedQuestions.length > 0 && (
                <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Generated Questions ({generatedQuestions.length})
                    </h3>
                    <button
                      onClick={handleSaveGeneratedQuestions}
                      disabled={generating}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4" />
                      Save All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {generatedQuestions.map((q, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-dark-100 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                          {index + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded ${
                                i === q.correctAnswer
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiUpload className="w-5 h-5 text-primary-500" />
                  Upload Questions
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Upload questions from a JSON file. Format should be an array of question objects.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subcategory
                    </label>
                    <select
                      value={uploadSubcategory}
                      onChange={(e) => setUploadSubcategory(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white"
                    >
                      <option value="">Select subcategory</option>
                      {getCategorySubcategories(uploadCategory).map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    JSON Content
                  </label>
                  <textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    rows={10}
                    placeholder={`[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "medium",
    "explanation": "Optional explanation"
  }
]`}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-100 bg-white dark:bg-dark-100 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
                
                <button
                  onClick={handleUploadQuestions}
                  disabled={uploading || !uploadContent.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <FiRefreshCw className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-5 h-5" />
                      Upload Questions
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Questions Database
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {questions.length} questions
                  </span>
                </div>
                
                {loading ? (
                  <LoadingSpinner text="Loading questions..." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-100">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Question</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Difficulty</th>
                          <th className="pb-3">Source</th>
                          <th className="pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((q) => (
                          <tr key={q.id} className="border-b border-gray-100 dark:border-dark-100">
                            <td className="py-3 text-gray-500 dark:text-gray-400 text-sm">
                              {typeof q.id === 'number' ? q.id : q.id?.slice(0, 8) + '...'}
                            </td>
                            <td className="py-3 text-gray-900 dark:text-white max-w-md truncate">
                              {q.question}
                            </td>
                            <td className="py-3 text-gray-600 dark:text-gray-400 capitalize">
                              <div>{q.category?.replace(/-/g, ' ')}</div>
                              {q.subcategory && (
                                <div className="text-xs text-gray-400">{q.subcategory?.replace(/-/g, ' ')}</div>
                              )}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                q.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                q.source === 'file' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              }`}>
                                {q.source || 'file'}
                              </span>
                            </td>
                            <td className="py-3">
                              {q.source === 'firestore' && (
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                  title="Delete question"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              )}
                              {q.source === 'file' && (
                                <span className="text-xs text-gray-400">Read-only</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {questions.length === 0 && (
                      <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No questions found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Registered Users
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total: {users.length} users
                  </span>
                </div>
                
                {loading ? (
                  <LoadingSpinner text="Loading users..." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-100">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Tests</th>
                          <th className="pb-3">Exams</th>
                          <th className="pb-3">Avg Score</th>
                          <th className="pb-3">Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100 dark:border-dark-100">
                            <td className="py-3 text-gray-900 dark:text-white font-medium">
                              {user.name || 'Anonymous'}
                            </td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              {user.email}
                            </td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              {user.testsTaken || 0}
                            </td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              {user.examsTaken || 0}
                            </td>
                            <td className="py-3">
                              <div className="text-gray-600 dark:text-gray-400">
                                {user.avgScore || 0}%
                                {user.avgExamScore !== undefined && user.avgExamScore > 0 && (
                                  <span className="text-xs text-orange-500 ml-1">
                                    (Exam: {user.avgExamScore}%)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">
                              🔥 {user.streak || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {users.length === 0 && (
                      <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No users registered yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default AdminPanel
