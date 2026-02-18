import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Exam category definitions — icons use Material Symbols names
const EXAM_CATEGORIES = [
  { id: 'daily-practice', name: 'Practice', subtitle: 'Test your knowledge', icon: 'quiz', iconColor: 'text-blue-400', bgColor: 'bg-blue-500/10 group-hover:bg-blue-500/20', route: '/daily-practice' },
  { id: 'scheduled-exams', name: 'Scheduled Exams', subtitle: 'Upcoming events', icon: 'event_note', iconColor: 'text-purple-400', bgColor: 'bg-purple-500/10 group-hover:bg-purple-500/20', route: '/exams', badge: 'Live', badgeClass: 'bg-green-500/20 text-green-400' },
  { id: 'schools', name: 'Schools & Colleges', subtitle: 'Academic exams', icon: 'school', iconColor: 'text-green-400', bgColor: 'bg-green-500/10 group-hover:bg-green-500/20', route: '/schools' },
  { id: 'dsa-coding', name: 'DSA', subtitle: 'Data structures', icon: 'code', iconColor: 'text-orange-400', bgColor: 'bg-orange-500/10 group-hover:bg-orange-500/20', route: '/dsa' },
  { id: 'competitive-exams', name: 'Competitive', subtitle: 'Contests & more', icon: 'psychology', iconColor: 'text-pink-400', bgColor: 'bg-pink-500/10 group-hover:bg-pink-500/20', route: '/competitive-exams', badge: 'New', badgeClass: 'bg-pink-500/20 text-pink-400' },
  { id: 'typing-test', name: 'Typing Speed', subtitle: 'Improve wpm', icon: 'keyboard', iconColor: 'text-cyan-400', bgColor: 'bg-cyan-500/10 group-hover:bg-cyan-500/20', route: '/typing-test' },
]

// Course cards for "Continue Learning" section — links to our internal courses page
const FEATURED_COURSES = [
  { title: 'Python for Beginners', tag: 'Python', duration: '8h 20m', lessons: 32, progress: 45, progressColor: 'from-purple-500 to-purple-400', tagColor: 'bg-black/40', thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80', route: '/courses?q=python' },
  { title: 'SQL Mastery', tag: 'SQL', duration: '6h 15m', lessons: 24, progress: 10, progressColor: 'from-orange-400 to-yellow-400', tagColor: 'bg-black/40', thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80', route: '/courses?q=sql' },
  { title: 'Web Dev Bootcamp', tag: 'Web Dev', duration: '22h 30m', lessons: 48, progress: 80, progressColor: 'from-green-400 to-emerald-400', tagColor: 'bg-black/40', thumb: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&q=80', route: '/courses?q=web' },
]

/**
 * Dashboard Page — Glassmorphism redesign
 * All original functionality preserved: live/upcoming exams, stats, categories
 */
const Dashboard = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth()
  const navigate = useNavigate()
  const [liveExams, setLiveExams] = useState([])
  const [upcomingExams, setUpcomingExams] = useState([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadProfile = async () => { if (!userProfile) await refreshUserProfile() }
    loadProfile()
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const token = currentUser ? await currentUser.getIdToken() : null
      const response = await fetch(`${API_URL}/exams/scheduled`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await response.json()
      if (data.success) {
        const now = new Date()
        const live = [], upcoming = []
        ;(data.data || []).forEach(exam => {
          const start = new Date(exam.startTime), end = new Date(exam.endTime)
          if (now >= start && now <= end) live.push({ ...exam, status: 'live' })
          else if (now < start) upcoming.push({ ...exam, status: 'upcoming' })
        })
        upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        setLiveExams(live)
        setUpcomingExams(upcoming.slice(0, 3))
      }
    } catch (e) { /* silent */ } finally { setExamsLoading(false) }
  }

  const getTimeUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    if (diff <= 0) return 'Now'
    const h = Math.floor(diff / (1000 * 60 * 60)), m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <Layout upcomingExams={upcomingExams}>
      {/* Main content */}
      <main className="min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-20 lg:pt-8 flex flex-col gap-10 pb-10">

          {/* ── Header ── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}! <span className="inline-block animate-bounce">👋</span>
              </h2>
              <p className="text-slate-400 text-sm font-light">Your learning journey continues here.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full blur opacity-0 group-focus-within:opacity-30 transition duration-300 pointer-events-none" />
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-400 group-focus-within:text-white transition-colors text-[20px]">search</span>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-12 pr-5 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-white w-56 sm:w-72 focus:outline-none focus:ring-1 focus:ring-purple-500/50 placeholder:text-slate-600"
                    placeholder="Search courses..."
                    type="text"
                  />
                </div>
              </form>
              {/* Notifications */}
              <button className="w-12 h-12 rounded-full dq-glass-card flex items-center justify-center hover:bg-white/10 transition-all relative flex-shrink-0">
                <span className="material-symbols-outlined text-slate-300 text-[24px]">notifications</span>
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1e293b] shadow-lg shadow-red-500/50" />
              </button>
            </div>
          </header>

          {/* ── Stats Grid ── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Streak', value: `${userProfile?.streak || 0}`, unit: 'Days', icon: 'local_fire_department', iconBg: 'bg-orange-500/20 border-orange-500/20', iconColor: 'text-orange-400', glow: 'bg-orange-500/10 group-hover:bg-orange-500/20' },
              { label: 'Tests',  value: `${userProfile?.testsTaken || 0}`, unit: 'Exams', icon: 'assignment_turned_in', iconBg: 'bg-blue-500/20 border-blue-500/20', iconColor: 'text-blue-400', glow: 'bg-blue-500/10 group-hover:bg-blue-500/20' },
              { label: 'Avg Score', value: `${userProfile?.avgScore || 0}%`, unit: '', icon: 'trending_up', iconBg: 'bg-green-500/20 border-green-500/20', iconColor: 'text-green-400', glow: 'bg-green-500/10 group-hover:bg-green-500/20', badge: '+4.2%', badgeClass: 'text-green-400 bg-green-500/10' },
              { label: 'Total XP', value: `${userProfile?.totalScore || 0}`, unit: 'Points', icon: 'military_tech', iconBg: 'bg-purple-500/20 border-purple-500/20', iconColor: 'text-purple-400', glow: 'bg-purple-500/10 group-hover:bg-purple-500/20' },
            ].map((s, i) => (
              <div key={i} className="dq-glass-card p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                <div className={`absolute -right-6 -top-6 w-24 h-24 ${s.glow} rounded-full blur-2xl transition-all pointer-events-none`} />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{s.label}</span>
                  <div className={`p-2 rounded-xl border ${s.iconBg}`}>
                    <span className={`material-symbols-outlined ${s.iconColor} text-[20px]`}>{s.icon}</span>
                  </div>
                </div>
                <div className="relative z-10 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{s.value}</span>
                  {s.unit && <span className="text-slate-500 text-sm">{s.unit}</span>}
                  {s.badge && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ml-1 ${s.badgeClass}`}>{s.badge}</span>}
                </div>
              </div>
            ))}
          </section>

          {/* ── Live & Upcoming Exams ── */}
          {!examsLoading && (liveExams.length > 0 || upcomingExams.length > 0) && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
                  Live & Upcoming Exams
                </h3>
                <Link to="/exams" className="text-slate-400 text-sm font-medium hover:text-white transition-colors flex items-center gap-1 group">
                  View All <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveExams.map(exam => (
                  <div
                    key={exam.id}
                    onClick={() => navigate(`/exam/${exam.id}/waiting-room`)}
                    className="dq-glass-card rounded-2xl p-5 cursor-pointer border border-green-500/30 hover:border-green-500/60 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-green-400 text-[20px]">play_circle</span>
                        </div>
                        <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />LIVE
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base mb-1">{exam.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                        <span>{exam.questionCount} Qs</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span>{exam.durationMinutes} min</span>
                        {exam.isProctored && <><span className="w-1 h-1 rounded-full bg-slate-600" /><span className="text-yellow-400">Proctored</span></>}
                      </div>
                      <button className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span> Join Now
                      </button>
                    </div>
                  </div>
                ))}
                {upcomingExams.map(exam => (
                  <div
                    key={exam.id}
                    onClick={() => navigate(`/exam/${exam.id}/waiting-room`)}
                    className="dq-glass-card rounded-2xl p-5 cursor-pointer border border-blue-500/20 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-blue-400 text-[20px]">event</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Starts in</p>
                          <p className="text-base font-bold text-white">{getTimeUntil(exam.startTime)}</p>
                        </div>
                      </div>
                      <h4 className="font-bold text-white text-base mb-1">{exam.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                        <span>{exam.questionCount} Qs</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span>{exam.durationMinutes} min</span>
                      </div>
                      <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium uppercase">Upcoming</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Exam Categories ── */}
          <section className="bg-white/5 rounded-3xl p-6 sm:p-8 border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-7">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
                Exam Categories
              </h3>
              <Link to="/daily-practice" className="text-slate-400 text-sm font-medium hover:text-white transition-colors flex items-center gap-1 group">
                View All <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {EXAM_CATEGORIES.map(cat => (
                <Link key={cat.id} to={cat.route}
                  className="flex items-center justify-between p-5 rounded-2xl dq-glass-card hover:bg-white/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 border border-white/10 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${cat.bgColor}`}>
                      <span className={`material-symbols-outlined ${cat.iconColor} text-[24px]`}>{cat.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-200">{cat.name}</h4>
                        {cat.badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.badgeClass}`}>{cat.badge}</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{cat.subtitle}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-500 group-hover:text-slate-300 text-[16px]">arrow_forward_ios</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Continue Learning ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                Continue Learning
              </h3>
              <Link to="/courses" className="text-slate-400 text-sm font-medium hover:text-white transition-colors flex items-center gap-1 group">
                All Courses <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_COURSES.map((course, i) => (
                <Link key={i} to={course.route}
                  className="dq-glass-card rounded-3xl overflow-hidden group hover:-translate-y-2 transition-transform duration-300 relative block"
                >
                  {/* Tag & bookmark */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
                    <span className={`${course.tagColor} backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-wider`}>
                      {course.tag}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors">
                      <span className="material-symbols-outlined text-white text-[16px]">bookmark_border</span>
                    </span>
                  </div>
                  {/* Thumbnail */}
                  <div className="h-48 w-full relative overflow-hidden">
                    <img
                      src={course.thumb}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 z-10">
                      <h4 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-md">{course.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span> {course.duration}
                        </span>
                        <span className="w-1 h-1 bg-slate-500 rounded-full" />
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">play_circle</span> {course.lessons} Lessons
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-slate-400">Progress</span>
                        <span className={`text-xs font-bold bg-gradient-to-r ${course.progressColor} bg-clip-text text-transparent`}>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${course.progressColor} rounded-full`} style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                    <div className="w-full py-3 rounded-xl relative overflow-hidden group/btn cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2">
                        {course.progress > 0 ? 'Continue Learning' : 'Start Now'}
                        <span className="material-symbols-outlined text-[18px]">{course.progress > 0 ? 'arrow_forward' : 'play_arrow'}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>
    </Layout>
  )
}

export default Dashboard
