import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * ExamSelection - Redirects to CompetitiveExams
 * This page has been consolidated into the CompetitiveExams page
 * which provides a unified experience for all exam categories
 */
const ExamSelection = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to the new competitive exams page
    navigate('/competitive-exams', { replace: true })
  }, [navigate])

  // Show brief loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to Competitive Exams...</p>
      </div>
    </div>
  )
}

export default ExamSelection
