import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { TestProvider } from './context/TestContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DailyPractice from './pages/DailyPractice'
import Instructions from './pages/Instructions'
import Test from './pages/Test'
import Suspense from './pages/Suspense'
import Result from './pages/Result'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'

// Admin Pages
import AdminPanel from './pages/AdminPanel'
import AdminExamManager from './pages/AdminExamManager'

// Exam Pages
import ExamSelection from './pages/ExamSelection'
import ExamTest from './pages/ExamTest'
import ExamResult from './pages/ExamResult'
import ExamLeaderboard from './pages/ExamLeaderboard'

// Scheduled Exam Pages
import ScheduledExams from './pages/ScheduledExams'
import ExamWaitingRoom from './pages/ExamWaitingRoom'
import ScheduledExamTest from './pages/ScheduledExamTest'
import ScheduledExamResult from './pages/ScheduledExamResult'

// DSA Pages
import DSAProblems from './pages/DSAProblems'
import DSAProblemDetail from './pages/DSAProblemDetail'

// Competitive Exam Pages
import CompetitiveExams from './pages/CompetitiveExams'
import CompetitiveInstructions from './pages/CompetitiveInstructions'
import CompetitiveTest from './pages/CompetitiveTest'

// Schools & Colleges Pages
import Schools from './pages/Schools'
import SchoolTest from './pages/SchoolTest'
import SchoolResult from './pages/SchoolResult'

// Typing Test
import TypingTest from './pages/TypingTest'

// Courses
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Suggestions from './pages/Suggestions'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <TestProvider>
            <div className="dq-app-bg min-h-screen transition-colors duration-300">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/daily-practice" element={
                  <ProtectedRoute>
                    <DailyPractice />
                  </ProtectedRoute>
                } />
                <Route path="/instructions" element={
                  <ProtectedRoute>
                    <Instructions />
                  </ProtectedRoute>
                } />
                <Route path="/test" element={
                  <ProtectedRoute>
                    <Test />
                  </ProtectedRoute>
                } />
                <Route path="/suspense" element={
                  <ProtectedRoute>
                    <Suspense />
                  </ProtectedRoute>
                } />
                <Route path="/result" element={
                  <ProtectedRoute>
                    <Result />
                  </ProtectedRoute>
                } />
                <Route path="/leaderboard" element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="/admin/exams" element={
                  <ProtectedRoute>
                    <AdminExamManager />
                  </ProtectedRoute>
                } />
                
                {/* Exam Routes */}
                <Route path="/exam" element={
                  <ProtectedRoute>
                    <ExamSelection />
                  </ProtectedRoute>
                } />
                <Route path="/exam/test" element={
                  <ProtectedRoute>
                    <ExamTest />
                  </ProtectedRoute>
                } />
                <Route path="/exam/result" element={
                  <ProtectedRoute>
                    <ExamResult />
                  </ProtectedRoute>
                } />
                <Route path="/exam/leaderboard" element={
                  <ProtectedRoute>
                    <ExamLeaderboard />
                  </ProtectedRoute>
                } />
                
                {/* Scheduled Exam Routes */}
                <Route path="/exams" element={
                  <ProtectedRoute>
                    <ScheduledExams />
                  </ProtectedRoute>
                } />
                <Route path="/exam/:examId/waiting-room" element={
                  <ProtectedRoute>
                    <ExamWaitingRoom />
                  </ProtectedRoute>
                } />
                <Route path="/exam/:examId/start" element={
                  <ProtectedRoute>
                    <ScheduledExamTest />
                  </ProtectedRoute>
                } />
                <Route path="/exam/:examId/result" element={
                  <ProtectedRoute>
                    <ScheduledExamResult />
                  </ProtectedRoute>
                } />
                <Route path="/exam/:examId/leaderboard" element={
                  <ProtectedRoute>
                    <ExamLeaderboard />
                  </ProtectedRoute>
                } />
                
                {/* DSA Routes */}
                <Route path="/dsa" element={
                  <ProtectedRoute>
                    <DSAProblems />
                  </ProtectedRoute>
                } />
                <Route path="/dsa/:slug" element={
                  <ProtectedRoute>
                    <DSAProblemDetail />
                  </ProtectedRoute>
                } />
                
                {/* Competitive Exam Routes */}
                <Route path="/competitive-exams" element={
                  <ProtectedRoute>
                    <CompetitiveExams />
                  </ProtectedRoute>
                } />
                <Route path="/competitive-instructions/:category/:subject" element={
                  <ProtectedRoute>
                    <CompetitiveInstructions />
                  </ProtectedRoute>
                } />
                <Route path="/competitive-test/:category/:subject" element={
                  <ProtectedRoute>
                    <CompetitiveTest />
                  </ProtectedRoute>
                } />
                
                {/* Schools & Colleges Routes */}
                <Route path="/schools" element={
                  <ProtectedRoute>
                    <Schools />
                  </ProtectedRoute>
                } />
                <Route path="/school-test" element={
                  <ProtectedRoute>
                    <SchoolTest />
                  </ProtectedRoute>
                } />
                <Route path="/school-result" element={
                  <ProtectedRoute>
                    <SchoolResult />
                  </ProtectedRoute>
                } />

                {/* Typing Test Route */}
                <Route path="/typing-test" element={
                  <ProtectedRoute>
                    <TypingTest />
                  </ProtectedRoute>
                } />

                {/* Courses Routes */}
                <Route path="/courses" element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                } />
                <Route path="/courses/:courseId" element={
                  <ProtectedRoute>
                    <CourseDetail />
                  </ProtectedRoute>
                } />

                {/* Suggestions */}
                <Route path="/suggestions" element={
                  <ProtectedRoute>
                    <Suggestions />
                  </ProtectedRoute>
                } />
                
                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </TestProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
