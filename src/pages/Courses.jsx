import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components'
import { fetchCourses, getAllCuratedCourses, COURSE_TOPICS, getCourseById } from '../services/courseService'

// Provider badge colour mapping
const PROVIDER_COLORS = {
  'freeCodeCamp':       'bg-green-500/20 text-green-400 border-green-500/30',
  'The Odin Project':   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'edX / Harvard':      'bg-red-500/20 text-red-400 border-red-500/30',
  'YouTube':            'bg-red-600/20 text-red-400 border-red-600/30',
  'Google':             'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'web.dev (Google)':   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'MDN Web Docs':       'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Dev.to':             'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'javascript.info':    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'SQLZoo':             'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'Mooc.fi / Helsinki': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'W3Schools':          'bg-green-500/20 text-green-400 border-green-500/30',
  'automate.org':       'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Mode Analytics':     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'VisuAlgo.net':       'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Jenkov.com':         'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

const TYPE_ICONS = {
  course:      'school',
  video:       'play_circle',
  article:     'article',
  docs:        'menu_book',
  book:        'auto_stories',
  interactive: 'code',
}

const TYPE_LABELS = {
  course: 'Course', video: 'Video', article: 'Article',
  docs: 'Docs', book: 'Book', interactive: 'Interactive',
}

function CourseCard({ course }) {
  const navigate = useNavigate()
  const providerClass = PROVIDER_COLORS[course.provider] || 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  const typeIcon = TYPE_ICONS[course.type] || 'school'
  const typeLabel = TYPE_LABELS[course.type] || course.type

  // Courses with known curriculum open the in-platform viewer
  // Others open externally (Dev.to articles, YouTube API results, etc.)
  const hasInternalPage = !!getCourseById(course.id)

  const handleClick = () => {
    if (hasInternalPage) {
      navigate(`/courses/${course.id}`)
    } else {
      window.open(course.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      onClick={handleClick}
      className="dq-glass-card rounded-3xl overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="h-44 w-full relative overflow-hidden flex-shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-slate-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-400 text-[56px] opacity-30">{typeIcon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />

        {/* Type badge top-left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[12px]">{typeIcon}</span>
            {typeLabel}
          </span>
        </div>

        {/* External link indicator (only for non-curated) */}
        <div className="absolute top-3 right-3 z-10">
          <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined text-white text-[16px]">
              {hasInternalPage ? 'play_circle' : 'open_in_new'}
            </span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Provider */}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border self-start ${providerClass}`}>
          {course.providerLogo} {course.provider}
        </span>

        {/* Title */}
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2">{course.title}</h3>

        {/* Description */}
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-1">{course.description}</p>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-white/5 mt-auto">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
            {course.level}
          </span>
        </div>

        {/* Tags */}
        {course.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="w-full py-2.5 rounded-xl relative overflow-hidden group/btn mt-1 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 opacity-80 group-hover/btn:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2">
            {hasInternalPage ? 'Start Course' : 'Open Resource'}
            <span className="material-symbols-outlined text-[16px]">
              {hasInternalPage ? 'arrow_forward' : 'open_in_new'}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Courses Page
 * Free courses aggregated from YouTube, freeCodeCamp, Dev.to, Khan Academy, and more.
 */
const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialTopic = searchParams.get('topic') || 'all'

  const [activeTopic, setActiveTopic] = useState(initialTopic)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const searchRef = useRef(null)

  // Load courses whenever topic or search changes
  useEffect(() => {
    loadCourses()
  }, [activeTopic, searchQuery])

  const loadCourses = async () => {
    setLoading(true)
    try {
      let query = searchQuery.trim()
      if (!query) query = activeTopic === 'all' ? 'programming' : activeTopic

      const results = activeTopic === 'all' && !searchQuery.trim()
        ? getAllCuratedCourses()
        : await fetchCourses(query)

      // Deduplicate by id
      const seen = new Set()
      setCourses(results.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true }))
    } finally {
      setLoading(false)
    }
  }

  const handleTopicSelect = (topicId) => {
    setActiveTopic(topicId)
    setSearchQuery('')
    setActiveType('all')
    setSearchParams({ topic: topicId })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      setActiveTopic('all')
      setSearchParams({ q })
    }
  }

  const filteredCourses = activeType === 'all'
    ? courses
    : courses.filter(c => c.type === activeType)

  const typeFilters = [
    { id: 'all', label: 'All' },
    { id: 'course', label: 'Courses' },
    { id: 'video', label: 'Videos' },
    { id: 'article', label: 'Articles' },
    { id: 'docs', label: 'Docs' },
    { id: 'interactive', label: 'Interactive' },
    { id: 'book', label: 'Books' },
  ]

  return (
    <Layout>
      <main className="min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-20 lg:pt-8 pb-16 flex flex-col gap-8">

          {/* ── Header ── */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Free Courses 🎓
            </h1>
            <p className="text-slate-400 text-sm">
              Hand-picked free resources from freeCodeCamp, Harvard, Google, YouTube, Dev.to and more.
            </p>
          </div>

          {/* ── Search bar ── */}
          <form onSubmit={handleSearch} className="relative group max-w-2xl">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-orange-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-300 pointer-events-none" />
            <div className="relative flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500/40 transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[22px] flex-shrink-0">search</span>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Python, SQL, HTML, Java, DSA…"
                className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setActiveTopic('all'); setSearchParams({}) }}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
              <button type="submit"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold hover:from-purple-400 hover:to-purple-500 transition-all flex-shrink-0">
                Search
              </button>
            </div>
          </form>

          {/* ── Topic chips ── */}
          <div className="flex flex-wrap gap-2">
            {COURSE_TOPICS.map(topic => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
                  ${activeTopic === topic.id
                    ? 'bg-purple-500/20 text-white border-purple-500/50 shadow-sm shadow-purple-500/20'
                    : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20'
                  }`}
              >
                <span>{topic.icon}</span>
                {topic.label}
              </button>
            ))}
          </div>

          {/* ── Type filter pills ── */}
          <div className="flex gap-2 flex-wrap -mt-4">
            {typeFilters.map(tf => (
              <button
                key={tf.id}
                onClick={() => setActiveType(tf.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border
                  ${activeType === tf.id
                    ? 'bg-white/10 text-white border-white/20'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* ── Results ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="dq-glass-card rounded-3xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-white/5" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-5 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-4/5" />
                    <div className="h-10 bg-white/5 rounded-xl mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-600">search_off</span>
              <p className="text-slate-400 text-lg">No courses found for <span className="text-white font-semibold">"{searchQuery || activeTopic}"</span></p>
              <button onClick={() => { setSearchQuery(''); setActiveTopic('all'); setActiveType('all'); setSearchParams({}) }}
                className="px-5 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-medium hover:bg-purple-500/30 transition-colors">
                Show all courses
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 -mt-4">
                Showing <span className="text-slate-300 font-medium">{filteredCourses.length}</span> free resources
                {searchQuery && <> for <span className="text-purple-400 font-medium">"{searchQuery}"</span></>}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </>
          )}

          {/* ── Note on YouTube API ── */}
          {!import.meta.env.VITE_YOUTUBE_API_KEY && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3 text-sm">
              <span className="material-symbols-outlined text-yellow-400 text-[20px] flex-shrink-0 mt-0.5">tips_and_updates</span>
              <div>
                <p className="text-yellow-400 font-semibold mb-0.5">Unlock YouTube Course Search</p>
                <p className="text-yellow-400/70 text-xs">
                  Add <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-300">VITE_YOUTUBE_API_KEY=your_key</code> to your <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-300">.env</code> file to also fetch live YouTube playlists. Get a free key from the{' '}
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300 transition-colors">Google Cloud Console</a>.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </Layout>
  )
}

export default Courses
