/**
 * DailyQ - Category Configuration
 * All test categories, subcategories, and exam types
 */

// Icons for categories (using emoji for now, can replace with icon components)
export const CATEGORY_ICONS = {
  daily: '📅',
  competitive: '🏆',
  government: '🏛️',
  dsa: '💻',
  exam: '📝'
};

// Color themes for categories
export const CATEGORY_COLORS = {
  daily: {
    gradient: 'from-cyan-500 to-blue-600',
    bg: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    border: 'border-cyan-500',
    text: 'text-cyan-400'
  },
  competitive: {
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    border: 'border-purple-500',
    text: 'text-purple-400'
  },
  government: {
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    border: 'border-emerald-500',
    text: 'text-emerald-400'
  },
  company: {
    gradient: 'from-orange-500 to-red-500',
    bg: 'bg-gradient-to-r from-orange-500 to-red-500',
    border: 'border-orange-500',
    text: 'text-orange-400'
  },
  subject: {
    gradient: 'from-fuchsia-500 to-purple-600',
    bg: 'bg-gradient-to-r from-fuchsia-500 to-purple-600',
    border: 'border-fuchsia-500',
    text: 'text-fuchsia-400'
  }
};

// ==========================================
// DAILY PRACTICE TESTS
// ==========================================
export const DAILY_TEST_CONFIG = {
  questionCount: 20,
  durationMinutes: 25,
  title: 'Daily Practice',
  description: 'Quick daily exercises',
  subcategories: [
    {
      id: 'web-development',
      name: 'Web Development',
      icon: '🌐',
      description: 'HTML, CSS, JavaScript, React',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'data-structures',
      name: 'Data Structures',
      icon: '🔢',
      description: 'Arrays, Trees, Graphs, etc.',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'data-science',
      name: 'Data Science',
      icon: '📊',
      description: 'ML, Statistics, Python',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'artificial-intelligence',
      name: 'AI & ML',
      icon: '🤖',
      description: 'Artificial Intelligence & Machine Learning',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'networking',
      name: 'Networking',
      icon: '🔗',
      description: 'Computer Networks, Protocols',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'general-knowledge',
      name: 'General Knowledge',
      icon: '📚',
      description: 'World facts, History, Science',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'sports',
      name: 'Sports',
      icon: '⚽',
      description: 'Sports trivia and facts',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'quantitative-aptitude',
      name: 'Quantitative Aptitude',
      icon: '🔢',
      description: 'Math, Numbers, Calculations',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'logical-reasoning',
      name: 'Logical Reasoning',
      icon: '🧠',
      description: 'Puzzles, Logic, Patterns',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'neet-practice',
      name: 'NEET Practice',
      icon: '🔬',
      description: 'Biology, Chemistry, Physics',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'python',
      name: 'Python',
      icon: '🐍',
      description: 'Core Python, OOP, Libraries, Data Structures',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'java',
      name: 'Java',
      icon: '☕',
      description: 'Core Java, OOP, Collections, Multithreading',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'sql',
      name: 'SQL & Databases',
      icon: '🗄️',
      description: 'SQL queries, Joins, Normalization, DBMS concepts',
      questionCount: 20,
      duration: 25
    }
  ]
};

// ==========================================
// COMPETITIVE COMPANY TESTS
// ==========================================
export const COMPANY_TEST_CONFIG = {
  questionCount: 20,
  durationMinutes: 25,
  title: 'Company Tests',
  description: 'Placement preparation',
  companies: [
    {
      id: 'tcs',
      name: 'TCS',
      icon: '🏢',
      fullName: 'Tata Consultancy Services',
      description: 'TCS NQT Pattern',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'cognizant',
      name: 'Cognizant',
      icon: '🏢',
      fullName: 'Cognizant Technology Solutions',
      description: 'CTS Placement Pattern',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'tech-mahindra',
      name: 'Tech Mahindra',
      icon: '🏢',
      fullName: 'Tech Mahindra',
      description: 'Tech M Pattern',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'infosys',
      name: 'Infosys',
      icon: '🏢',
      fullName: 'Infosys Limited',
      description: 'Infosys InfyTQ Pattern',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'wipro',
      name: 'Wipro',
      icon: '🏢',
      fullName: 'Wipro Limited',
      description: 'Wipro NLTH Pattern',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'accenture',
      name: 'Accenture',
      icon: '🏢',
      fullName: 'Accenture',
      description: 'Accenture Pattern',
      questionCount: 20,
      duration: 25
    },
    {
      id: 'capgemini',
      name: 'Capgemini',
      icon: '🏢',
      fullName: 'Capgemini',
      description: 'Capgemini Pattern',
      questionCount: 20,
      duration: 25
    }
  ]
};

// ==========================================
// GOVERNMENT EXAMS
// ==========================================
export const GOVERNMENT_EXAM_CONFIG = {
  questionCount: 30,
  durationMinutes: 30,
  title: 'Govt. Exams',
  description: 'Public sector jobs',
  categories: [
    {
      id: 'current-affairs',
      name: 'Current Affairs',
      icon: '📰',
      description: 'Latest news and events',
      questionCount: 30,
      duration: 30
    },
    {
      id: 'ssc',
      name: 'SSC',
      icon: '📋',
      fullName: 'Staff Selection Commission',
      description: 'SSC CGL, CHSL, MTS',
      questionCount: 30,
      duration: 30
    },
    {
      id: 'banking',
      name: 'Banking',
      icon: '🏦',
      description: 'IBPS, SBI, RBI exams',
      questionCount: 30,
      duration: 30
    },
    {
      id: 'upsc',
      name: 'UPSC',
      icon: '🏛️',
      fullName: 'Union Public Service Commission',
      description: 'Civil Services Prelims',
      questionCount: 30,
      duration: 30
    },
    {
      id: 'railway',
      name: 'Railway',
      icon: '🚂',
      description: 'RRB NTPC, Group D',
      questionCount: 30,
      duration: 30
    }
  ]
};

// ==========================================
// SUBJECT EXAMS (Full Tests)
// ==========================================
export const SUBJECT_EXAM_CONFIG = {
  title: 'Subject Exams',
  description: 'Full comprehensive tests',
  subjects: [
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: '📐',
      questionCount: 50,
      duration: 60
    },
    {
      id: 'physics',
      name: 'Physics',
      icon: '⚛️',
      questionCount: 50,
      duration: 60
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: '🧪',
      questionCount: 50,
      duration: 60
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: '🧬',
      questionCount: 50,
      duration: 60
    },
    {
      id: 'english',
      name: 'English',
      icon: '📖',
      questionCount: 50,
      duration: 60
    },
    {
      id: 'computer-science',
      name: 'Computer Science',
      icon: '💻',
      questionCount: 50,
      duration: 60
    }
  ]
};

// ==========================================
// SCHEDULED EXAM CATEGORIES
// ==========================================
export const SCHEDULED_EXAM_CONFIG = {
  title: 'Scheduled Exams',
  description: 'Competitive tests with live rankings',
  categories: [
    {
      id: 'class-1-5',
      name: 'Class 1-5',
      icon: '📚',
      description: 'Primary school level',
      grades: [1, 2, 3, 4, 5]
    },
    {
      id: 'class-6-8',
      name: 'Class 6-8',
      icon: '📚',
      description: 'Middle school level',
      grades: [6, 7, 8]
    },
    {
      id: 'class-9-10',
      name: 'Class 9-10',
      icon: '📚',
      description: 'High school level',
      grades: [9, 10]
    },
    {
      id: 'class-11-12',
      name: 'Class 11-12',
      icon: '📚',
      description: 'Senior secondary level',
      grades: [11, 12]
    },
    {
      id: 'computer-science-gk',
      name: 'Computer Science GK',
      icon: '💻',
      description: 'CS fundamentals and GK'
    },
    {
      id: 'neet',
      name: 'NEET',
      icon: '🔬',
      description: 'Medical entrance preparation'
    },
    {
      id: 'jee',
      name: 'JEE',
      icon: '⚙️',
      description: 'Engineering entrance preparation'
    },
    {
      id: 'gate',
      name: 'GATE',
      icon: '🎓',
      description: 'Graduate Aptitude Test'
    }
  ]
};

// ==========================================
// DSA TOPICS
// ==========================================
export const DSA_TOPICS = [
  { id: 'array', name: 'Array', count: 2079 },
  { id: 'string', name: 'String', count: 844 },
  { id: 'hash-table', name: 'Hash Table', count: 771 },
  { id: 'math', name: 'Math', count: 649 },
  { id: 'dynamic-programming', name: 'Dynamic Programming', count: 636 },
  { id: 'sorting', name: 'Sorting', count: 495 },
  { id: 'greedy', name: 'Greedy', count: 455 },
  { id: 'depth-first-search', name: 'Depth-First Search', count: 333 },
  { id: 'binary-search', name: 'Binary Search', count: 320 },
  { id: 'breadth-first-search', name: 'Breadth-First Search', count: 280 },
  { id: 'tree', name: 'Tree', count: 250 },
  { id: 'graph', name: 'Graph', count: 240 },
  { id: 'linked-list', name: 'Linked List', count: 180 },
  { id: 'stack', name: 'Stack', count: 170 },
  { id: 'queue', name: 'Queue', count: 120 },
  { id: 'heap', name: 'Heap', count: 150 },
  { id: 'recursion', name: 'Recursion', count: 200 },
  { id: 'backtracking', name: 'Backtracking', count: 130 },
  { id: 'bit-manipulation', name: 'Bit Manipulation', count: 110 },
  { id: 'two-pointers', name: 'Two Pointers', count: 190 },
  { id: 'sliding-window', name: 'Sliding Window', count: 100 }
];

export const DSA_CATEGORIES = [
  { id: 'all', name: 'All Topics', icon: '📋' },
  { id: 'algorithms', name: 'Algorithms', icon: '⚙️' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'shell', name: 'Shell', icon: '💲' },
  { id: 'concurrency', name: 'Concurrency', icon: '🔄' },
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'pandas', name: 'pandas', icon: '🐼' }
];

export const DSA_DIFFICULTY = {
  easy: { 
    label: 'Easy', 
    color: 'text-green-400', 
    bg: 'bg-green-900/30',
    border: 'border-green-800/50'
  },
  medium: { 
    label: 'Medium', 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-800/50'
  },
  hard: { 
    label: 'Hard', 
    color: 'text-red-400', 
    bg: 'bg-red-900/30',
    border: 'border-red-800/50'
  }
};

// ==========================================
// SUPPORTED PROGRAMMING LANGUAGES
// ==========================================
export const PROGRAMMING_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: 'js', monacoId: 'javascript' },
  { id: 'python', name: 'Python', extension: 'py', monacoId: 'python' },
  { id: 'java', name: 'Java', extension: 'java', monacoId: 'java' },
  { id: 'cpp', name: 'C++', extension: 'cpp', monacoId: 'cpp' },
  { id: 'c', name: 'C', extension: 'c', monacoId: 'c' }
];

// ==========================================
// EXAM STATUS TYPES
// ==========================================
export const EXAM_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// ==========================================
// LEADERBOARD CATEGORIES
// ==========================================
export const LEADERBOARD_CATEGORIES = [
  { id: 'global', name: 'Global Rankings', icon: '🌍' },
  { id: 'daily', name: 'Daily Practice', icon: '📅' },
  { id: 'dsa', name: 'DSA Coding', icon: '💻' },
  { id: 'exam', name: 'Scheduled Exams', icon: '📝' },
  { id: 'company', name: 'Company Tests', icon: '🏢' },
  { id: 'government', name: 'Govt. Exams', icon: '🏛️' }
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================
export const getCategoryById = (categoryId) => {
  const allCategories = [
    ...DAILY_TEST_CONFIG.subcategories,
    ...COMPANY_TEST_CONFIG.companies,
    ...GOVERNMENT_EXAM_CONFIG.categories,
    ...SUBJECT_EXAM_CONFIG.subjects,
    ...SCHEDULED_EXAM_CONFIG.categories
  ];
  return allCategories.find(cat => cat.id === categoryId);
};

export const getExamConfig = (type, subcategoryId) => {
  switch (type) {
    case 'daily':
      const dailySubcat = DAILY_TEST_CONFIG.subcategories.find(s => s.id === subcategoryId);
      return {
        questionCount: dailySubcat?.questionCount || 20,
        duration: dailySubcat?.duration || 25
      };
    case 'company':
      const company = COMPANY_TEST_CONFIG.companies.find(c => c.id === subcategoryId);
      return {
        questionCount: company?.questionCount || 20,
        duration: company?.duration || 25
      };
    case 'government':
      const govCat = GOVERNMENT_EXAM_CONFIG.categories.find(c => c.id === subcategoryId);
      return {
        questionCount: govCat?.questionCount || 30,
        duration: govCat?.duration || 30
      };
    default:
      return { questionCount: 20, duration: 25 };
  }
};

export default {
  DAILY_TEST_CONFIG,
  COMPANY_TEST_CONFIG,
  GOVERNMENT_EXAM_CONFIG,
  SUBJECT_EXAM_CONFIG,
  SCHEDULED_EXAM_CONFIG,
  DSA_TOPICS,
  DSA_CATEGORIES,
  DSA_DIFFICULTY,
  PROGRAMMING_LANGUAGES,
  EXAM_STATUS,
  LEADERBOARD_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS
};
