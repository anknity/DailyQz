/**
 * Question Service
 * Handles fetching and processing questions for tests
 * 
 * Fetches questions from backend API (Supabase question_bank)
 * Falls back to local JSON if API is unavailable
 */

import questionsData from '../data/questions.json'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate unique ID for each question instance
const generateQuestionId = () => {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Fetch questions from the backend API (Supabase question_bank)
 */
const fetchQuestionsFromAPI = async (category, difficulty, count, subject = null) => {
  try {
    const params = new URLSearchParams({
      count: count.toString(),
      ...(category && category !== 'all' && { category }),
      ...(difficulty && difficulty !== 'ai-mix' && difficulty !== 'all' && { difficulty }),
      ...(subject && subject !== 'all' && { subject })
    });

    const response = await fetch(`${API_URL}/exams/questions/random?${params}`);
    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      console.log(`✅ Fetched ${data.data.length} questions from database`);
      return data.data;
    }
    
    console.warn('⚠️ No questions from API, falling back to local data');
    return null;
  } catch (error) {
    console.warn('⚠️ API unavailable, using local questions:', error.message);
    return null;
  }
}

/**
 * Fetch questions based on category/categories and difficulty
 * 
 * @param {string|Array} categories - Single category ID or array of category IDs
 * @param {string} difficulty - The difficulty level ('easy', 'medium', 'hard', 'ai-mix')
 * @param {number} count - Number of questions to fetch
 * @param {string} subcategory - Optional subcategory filter (e.g., 'react', 'arrays')
 * @returns {Promise<Array>} - Array of question objects
 */
export const getQuestions = async (categories, difficulty, count = 20, subcategory = null) => {
  try {
    // Support both single category and multiple categories
    const categoryArray = Array.isArray(categories) ? categories : [categories]
    const primaryCategory = categoryArray[0]

    // Try to fetch from API first
    const apiQuestions = await fetchQuestionsFromAPI(
      primaryCategory,
      difficulty,
      count,
      subcategory
    );

    if (apiQuestions && apiQuestions.length > 0) {
      // Process API questions
      return processQuestions(apiQuestions, count);
    }

    // Fallback to local JSON if API fails
    console.log('📁 Using local questions data as fallback');
    return getQuestionsFromLocal(categoryArray, difficulty, count, subcategory);

  } catch (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
}

/**
 * Process questions from API into the format expected by the test
 */
const processQuestions = (questions, count) => {
  // Shuffle and limit
  const shuffled = shuffleArray(questions).slice(0, count);

  return shuffled.map((question, index) => {
    // Parse options if they're a string
    let options = question.options;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
    }

    // Shuffle options and track correct answer
    const shuffledOptions = shuffleArray(options.map((opt, idx) => ({
      text: typeof opt === 'string' ? opt : opt.text || `Option ${idx + 1}`,
      originalIndex: idx
    }))).map((opt, newIdx) => ({
      ...opt,
      index: newIdx
    }));

    // Find new position of correct answer
    const correctOption = shuffledOptions.find(
      opt => opt.originalIndex === question.correctAnswer
    );

    return {
      id: question.id || generateQuestionId(),
      number: index + 1,
      question: question.text || question.question_text,
      options: shuffledOptions,
      correctAnswer: correctOption ? correctOption.index : 0,
      _originalCorrectAnswer: question.correctAnswer,
      difficulty: question.difficulty || 'medium',
      category: question.category,
      subject: question.subject,
      explanation: question.explanation || ''
    };
  });
}

/**
 * Get questions from local JSON (fallback)
 */
const getQuestionsFromLocal = async (categoryArray, difficulty, count, subcategory) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  let allCategoryQuestions = []
  
  // Fetch questions from all selected categories
  for (const category of categoryArray) {
    const categoryQuestions = questionsData[category] || []
    
    if (categoryQuestions.length === 0) {
      console.warn(`No questions found for category: ${category}`)
      continue
    }
    
    const markedQuestions = categoryQuestions.map(q => ({
      ...q,
      sourceCategory: category
    }))
    
    allCategoryQuestions = [...allCategoryQuestions, ...markedQuestions]
  }
  
  if (allCategoryQuestions.length === 0) {
    throw new Error('No questions found for selected categories')
  }
  
  let categoryQuestions = allCategoryQuestions
  
  // Filter by subcategory if provided
  if (subcategory && categoryArray.length === 1) {
    const subcategoryQuestions = categoryQuestions.filter(q => q.subcategory === subcategory)
    
    if (subcategoryQuestions.length >= count) {
      categoryQuestions = subcategoryQuestions
    }
  }
  
  // Get questions from all difficulty levels
  const easyQuestions = categoryQuestions.filter(q => q.difficulty === 'easy')
  const mediumQuestions = categoryQuestions.filter(q => q.difficulty === 'medium')
  const hardQuestions = categoryQuestions.filter(q => q.difficulty === 'hard')
  const allQuestions = shuffleArray([...categoryQuestions])
  
  let selectedQuestions = []
  
  // Helper function to fill remaining slots
  const fillToCount = (currentQuestions, targetCount, availablePool) => {
    if (currentQuestions.length >= targetCount) {
      return currentQuestions.slice(0, targetCount)
    }
    
    const selectedIds = new Set(currentQuestions.map(q => q.question))
    const remainingPool = availablePool.filter(q => !selectedIds.has(q.question))
    const shuffledRemaining = shuffleArray(remainingPool)
    
    const needed = targetCount - currentQuestions.length
    const additional = shuffledRemaining.slice(0, needed)
    
    return [...currentQuestions, ...additional]
  }
  
  if (difficulty === 'ai-mix') {
    const easyCount = Math.floor(count * 0.4)
    const mediumCount = Math.floor(count * 0.4)
    const hardCount = count - easyCount - mediumCount
    
    const shuffledEasy = shuffleArray(easyQuestions).slice(0, easyCount)
    const shuffledMedium = shuffleArray(mediumQuestions).slice(0, mediumCount)
    const shuffledHard = shuffleArray(hardQuestions).slice(0, hardCount)
    
    selectedQuestions = [...shuffledEasy, ...shuffledMedium, ...shuffledHard]
    selectedQuestions = fillToCount(selectedQuestions, count, allQuestions)
    selectedQuestions = shuffleArray(selectedQuestions)
    
  } else if (difficulty === 'easy') {
    let selected = shuffleArray(easyQuestions).slice(0, count)
    if (selected.length < count) {
      selected = fillToCount(selected, count, [...mediumQuestions, ...hardQuestions])
    }
    selectedQuestions = shuffleArray(selected)
    
  } else if (difficulty === 'medium') {
    let selected = shuffleArray(mediumQuestions).slice(0, count)
    if (selected.length < count) {
      selected = fillToCount(selected, count, [...easyQuestions, ...hardQuestions])
    }
    selectedQuestions = shuffleArray(selected)
    
  } else if (difficulty === 'hard') {
    let selected = shuffleArray(hardQuestions).slice(0, count)
    if (selected.length < count) {
      selected = fillToCount(selected, count, [...mediumQuestions, ...easyQuestions])
    }
    selectedQuestions = shuffleArray(selected)
    
  } else {
    selectedQuestions = allQuestions.slice(0, count)
  }
  
  selectedQuestions = selectedQuestions.slice(0, count)
  
  if (selectedQuestions.length < count) {
    console.warn(`Only ${selectedQuestions.length} questions available, requested ${count}`)
  }
  
  // Format questions
  return selectedQuestions.map((question, index) => ({
    ...question,
    id: generateQuestionId(),
    number: index + 1,
    options: shuffleArray(question.options.map((opt, idx) => ({
      text: opt,
      originalIndex: idx
    }))).map((opt, newIdx) => ({
      ...opt,
      index: newIdx
    })),
    correctAnswer: undefined,
    _originalCorrectAnswer: question.correctAnswer
  })).map(question => {
    const correctOption = question.options.find(
      opt => opt.originalIndex === question._originalCorrectAnswer
    )
    return {
      ...question,
      correctAnswer: correctOption ? correctOption.index : 0
    }
  })
}

/**
 * AI Question Service
 * This can be implemented when AI integration is needed
 */
export const AIQuestionService = {
  /**
   * Generate questions using AI
   * @param {string} category 
   * @param {string} difficulty 
   * @param {number} count 
   * @returns {Promise<Array>}
   */
  generateQuestions: async (category, difficulty, count) => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/competitive/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, difficulty, count })
      });
      const data = await response.json();
      if (data.success && data.data.questions) {
        return processQuestions(data.data.questions, count);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    }
    return getQuestions(category, difficulty, count);
  },
  
  /**
   * Get personalized questions based on user performance
   * @param {string} userId 
   * @param {string} category 
   * @param {object} performanceData 
   * @returns {Promise<Array>}
   */
  getPersonalizedQuestions: async (userId, category, performanceData) => {
    // Placeholder for personalized question selection
    console.log('Personalized questions not yet implemented')
    return getQuestions(category, 'ai-mix', 20)
  }
}

/**
 * Get question bank stats
 */
export const getQuestionBankStats = async () => {
  try {
    const response = await fetch(`${API_URL}/exams/questions/categories`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
  } catch (error) {
    console.error('Failed to fetch question bank stats:', error);
  }
  return null;
}

export default {
  getQuestions,
  AIQuestionService,
  getQuestionBankStats
}
