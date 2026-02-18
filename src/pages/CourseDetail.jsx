import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components'
import { getCourseById, getCourseCurriculum, generateLessonContent } from '../services/courseService'

// Provider badge colours (same as Courses.jsx)
const PROVIDER_COLORS = {
  'freeCodeCamp':       'bg-green-500/20 text-green-400 border-green-500/30',
  'The Odin Project':   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'edX / Harvard':      'bg-red-500/20 text-red-400 border-red-500/30',
  'YouTube':            'bg-red-600/20 text-red-400 border-red-600/30',
  'Google':             'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'MDN Web Docs':       'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Dev.to':             'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'javascript.info':    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'SQLZoo':             'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'Mooc.fi / Helsinki': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'W3Schools':          'bg-green-500/20 text-green-400 border-green-500/30',
}

// Static lesson content for text-type lessons (shown in platform reader)
const LESSON_CONTENT = {
  'Variables & Data Types':
`## Python Variables & Data Types

In Python, you don't need to declare a variable's type — it is inferred automatically.

\`\`\`python
# Integer
age = 25

# Float
price = 9.99

# String
name = "Alice"

# Boolean
is_active = True

# NoneType
nothing = None
\`\`\`

### Checking Types
Use the built-in \`type()\` function:

\`\`\`python
print(type(age))     # <class 'int'>
print(type(price))   # <class 'float'>
print(type(name))    # <class 'str'>
\`\`\`

### Key Rules
- Variable names are **case-sensitive** (\`Name\` ≠ \`name\`)
- Names can contain letters, digits and underscores but **cannot start with a digit**
- Use descriptive names: \`user_email\` is better than \`ue\`

### Multiple Assignment
\`\`\`python
x = y = z = 0          # all three assigned 0
a, b, c = 1, 2, 3      # tuple unpacking
\`\`\``,

  'HTML Document Structure':
`## The Anatomy of an HTML Document

Every HTML file follows this skeleton:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>
\`\`\`

### Key Elements
| Tag | Role |
|-----|------|
| \`<!DOCTYPE html>\` | Tells the browser this is HTML5 |
| \`<html lang="en">\` | Root element; \`lang\` helps screen readers |
| \`<head>\` | Metadata — not visible on page |
| \`<meta charset="UTF-8">\` | Character encoding for all languages |
| \`<title>\` | Text shown in the browser tab |
| \`<body>\` | Visible page content |

Always place stylesheets in \`<head>\` and scripts at the **bottom** of \`<body>\` (or use \`defer\`).`,

  'SELECT & WHERE':
`## SELECT & WHERE in SQL

The most fundamental SQL statement retrieves data from a table.

\`\`\`sql
-- Select all columns
SELECT * FROM employees;

-- Select specific columns
SELECT first_name, last_name, salary FROM employees;

-- Filter rows with WHERE
SELECT * FROM employees
WHERE department = 'Engineering';

-- Multiple conditions
SELECT * FROM employees
WHERE department = 'Engineering'
  AND salary > 80000;

-- Pattern matching
SELECT * FROM employees
WHERE last_name LIKE 'Sm%';  -- starts with "Sm"
\`\`\`

### Comparison Operators
| Operator | Meaning |
|----------|---------|
| \`=\` | Equal |
| \`<>\` or \`!=\` | Not equal |
| \`>\` / \`<\` | Greater / Less than |
| \`BETWEEN a AND b\` | Inclusive range |
| \`IN (x, y, z)\` | Matches any listed value |
| \`IS NULL\` | No value |

### Best Practice
Always specify column names instead of \`*\` in production — it makes queries faster and more readable.`,
}

// Get static content for a lesson (used as quick initial render)
function getStaticLessonContent(lesson) {
  if (LESSON_CONTENT[lesson.title]) return LESSON_CONTENT[lesson.title]
  return null // null means we should try AI generation
}

// ── Markdown-to-HTML renderer (minimal, no dependency) ──────────────────────
function renderMarkdown(md) {
  if (!md) return ''
  let html = md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-3">$1</h1>')
    // code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="bg-[#0d1117] border border-white/10 rounded-xl p-4 overflow-x-auto my-4 text-sm"><code class="text-green-300 font-mono whitespace-pre">${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`
    )
    // inline code
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // table header separator rows (ignore them)
    .replace(/^\|[-| :]+\|$/gm, '')
    // table rows
    .replace(/^\|(.+)\|$/gm, (_, cells) => {
      const tds = cells.split('|').map(c => `<td class="border border-white/10 px-3 py-1.5 text-sm text-slate-300">${c.trim()}</td>`).join('')
      return `<tr>${tds}</tr>`
    })
    // wrap consecutive <tr> in a table
    .replace(/(<tr>[\s\S]*?<\/tr>(\s*<tr>[\s\S]*?<\/tr>)*)/g,
      '<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-white/10 rounded-lg overflow-hidden text-sm">$1</table></div>'
    )
    // list items
    .replace(/^- (.+)$/gm, '<li class="text-slate-300 text-sm ml-4 list-disc">$1</li>')
    .replace(/(<li[\s\S]+?<\/li>)/g, '<ul class="my-3 space-y-1">$1</ul>')
    // paragraphs (lines not already wrapped)
    .split('\n\n')
    .map(block => {
      const b = block.trim()
      if (!b) return ''
      if (b.startsWith('<')) return b
      return `<p class="text-slate-300 text-sm leading-relaxed my-2">${b}</p>`
    })
    .join('\n')

  return html
}

// ── VideoPlayer ──────────────────────────────────────────────────────────────
function VideoPlayer({ videoId, title }) {
  return (
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/60 relative">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&color=white`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}

// ── ArticleReader ────────────────────────────────────────────────────────────
// Supports AI-generated content via Gemini API, with a loading skeleton
function ArticleReader({ lesson, courseTopic }) {
  const staticContent = getStaticLessonContent(lesson)
  const [content, setContent] = useState(staticContent || '')
  const [loading, setLoading] = useState(!staticContent)

  useEffect(() => {
    if (staticContent) {
      setContent(staticContent)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    generateLessonContent(courseTopic || 'Programming', lesson.title)
      .then(text => { if (!cancelled) { setContent(text); setLoading(false) } })
      .catch(() => {
        if (!cancelled) {
          setContent(`## ${lesson.title}\n\n${lesson.description || 'Content for this lesson will be available soon.'}`)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [lesson.id, lesson.title, courseTopic, staticContent])

  if (loading) {
    return (
      <div className="w-full dq-glass-card rounded-2xl p-6 lg:p-10 max-w-3xl mx-auto animate-pulse">
        <div className="h-7 bg-white/10 rounded-lg w-2/3 mb-6" />
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-white/5 rounded w-full" style={{ width: `${95 - i * 8}%` }} />)}
        </div>
        <div className="mt-6 h-24 bg-white/5 rounded-xl" />
        <div className="mt-4 space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-4 bg-white/5 rounded" style={{ width: `${80 - i * 10}%` }} />)}
        </div>
        <p className="mt-6 text-slate-500 text-xs text-center">✨ Generating lesson content…</p>
      </div>
    )
  }

  const html = renderMarkdown(content)
  return (
    <div className="w-full dq-glass-card rounded-2xl p-6 lg:p-10 max-w-3xl mx-auto">
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

/**
 * CourseDetail — in-platform course viewer
 * Route: /courses/:courseId
 */
const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const course = getCourseById(courseId)
  const curriculum = getCourseCurriculum(courseId)

  // Total lesson count
  const totalLessons = curriculum.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  // Active lesson state
  const [activeLesson, setActiveLesson] = useState(() => curriculum.modules[0]?.lessons[0] || null)
  const [openModules, setOpenModules] = useState({ [curriculum.modules[0]?.id]: true })
  const [completedLessons, setCompletedLessons] = useState(new Set())
  const [activeTab, setActiveTab] = useState('lesson') // lesson | overview | notes
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const contentRef = useRef(null)

  // Scroll to top when lesson changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeLesson])

  if (!course) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <span className="material-symbols-outlined text-6xl text-slate-600">search_off</span>
          <h2 className="text-2xl font-bold text-white">Course Not Found</h2>
          <p className="text-slate-400">This course doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/courses')}
            className="px-6 py-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium hover:bg-purple-500/30 transition-colors">
            Browse Courses
          </button>
        </div>
      </Layout>
    )
  }

  const providerClass = PROVIDER_COLORS[course.provider] || 'bg-purple-500/20 text-purple-400 border-purple-500/30'

  // Flatten all lessons in order for prev/next navigation
  const allLessons = curriculum.modules.flatMap(m => m.lessons)
  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  const toggleModule = (moduleId) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const markComplete = () => {
    if (activeLesson) {
      setCompletedLessons(prev => new Set([...prev, activeLesson.id]))
      if (nextLesson) setActiveLesson(nextLesson)
    }
  }

  const progress = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0

  // ── Sidebar content ─────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Course title + progress */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-3">{course.title}</h2>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">{progress}%</span>
        </div>
        <p className="text-[11px] text-slate-500">{completedLessons.size}/{totalLessons} lessons</p>
      </div>

      {/* Module accordion */}
      <div className="flex-1 overflow-y-auto dq-scrollbar py-2">
        {curriculum.modules.map((mod, modIdx) => (
          <div key={mod.id} className="border-b border-white/5 last:border-0">
            {/* Module header */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-slate-500 text-xs font-bold flex-shrink-0 w-5">{modIdx + 1}</span>
              <span className="flex-1 text-sm font-medium text-slate-300 text-left">{mod.title}</span>
              <span className="material-symbols-outlined text-slate-500 text-[18px] transition-transform flex-shrink-0"
                style={{ transform: openModules[mod.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>

            {/* Lessons */}
            {openModules[mod.id] && (
              <div className="pb-1">
                {mod.lessons.map((lesson, lessonIdx) => {
                  const isActive = activeLesson?.id === lesson.id
                  const isDone = completedLessons.has(lesson.id)
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => { setActiveLesson(lesson); setMobileSidebarOpen(false) }}
                      className={`w-full flex items-start gap-3 pl-10 pr-4 py-2.5 text-left transition-all group
                        ${isActive
                          ? 'bg-purple-500/15 border-r-2 border-purple-500'
                          : 'hover:bg-white/5'
                        }`}
                    >
                      {/* Status icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isDone ? (
                          <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
                        ) : (
                          <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-purple-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                            {lesson.type === 'video' ? 'play_circle' : 'article'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-medium leading-snug ${isActive ? 'text-white' : isDone ? 'text-slate-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {lessonIdx + 1}. {lesson.title}
                        </span>
                        <span className="text-[10px] text-slate-600 mt-0.5">{lesson.duration}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 dq-glass-panel">
          {/* Back */}
          <Link to="/courses" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="hidden sm:inline">Courses</span>
          </Link>

          <span className="text-slate-600 flex-shrink-0">/</span>

          {/* Course title (truncated) */}
          <h1 className="text-white font-bold text-sm truncate flex-1">{course.title}</h1>

          {/* Provider badge */}
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 hidden md:flex ${providerClass}`}>
            {course.providerLogo} {course.provider}
          </span>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:text-white transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">view_sidebar</span>
            Contents
          </button>
        </div>

        {/* ── Main content area ── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* ── Content pane ── */}
          <div ref={contentRef} className="flex-1 overflow-y-auto dq-scrollbar">
            {/* Tab bar */}
            <div className="sticky top-0 z-10 flex gap-1 px-4 py-2 border-b border-white/10 dq-glass-panel">
              {[
                { id: 'lesson', label: 'Lesson', icon: activeLesson?.type === 'video' ? 'play_circle' : 'article' },
                { id: 'overview', label: 'Overview', icon: 'info' },
                { id: 'notes', label: 'My Notes', icon: 'edit_note' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${activeTab === tab.id ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 lg:p-8 max-w-4xl mx-auto pb-32">
              {activeTab === 'lesson' && activeLesson && (
                <div className="flex flex-col gap-6">
                  {/* Lesson title */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="material-symbols-outlined text-[14px]">
                        {activeLesson.type === 'video' ? 'play_circle' : 'article'}
                      </span>
                      {activeLesson.type === 'video' ? 'Video' : 'Reading'} • {activeLesson.duration}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{activeLesson.title}</h2>
                    {activeLesson.description && (
                      <p className="text-slate-400 text-sm mt-2">{activeLesson.description}</p>
                    )}
                  </div>

                  {/* Content */}
                  {activeLesson.type === 'video' && activeLesson.videoId ? (
                    <VideoPlayer videoId={activeLesson.videoId} title={activeLesson.title} />
                  ) : (
                    <ArticleReader lesson={activeLesson} courseTopic={course?.tags?.[0] || course?.title || 'Programming'} />
                  )}

                  {/* Nav buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      disabled={!prevLesson}
                      onClick={() => prevLesson && setActiveLesson(prevLesson)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      Previous
                    </button>

                    <button
                      onClick={markComplete}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow"
                    >
                      {completedLessons.has(activeLesson.id)
                        ? <><span className="material-symbols-outlined text-[18px]">check</span> Completed</>
                        : <>{nextLesson ? 'Mark Complete & Continue' : 'Complete Course'} <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                      }
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="flex flex-col gap-6">
                  {/* Hero banner */}
                  <div className="relative rounded-2xl overflow-hidden h-48">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-slate-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
                    <div className="absolute bottom-4 left-5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${providerClass}`}>
                        {course.providerLogo} {course.provider}
                      </span>
                    </div>
                  </div>

                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { icon: 'schedule', label: course.duration },
                      { icon: 'signal_cellular_alt', label: course.level },
                      { icon: 'menu_book', label: `${totalLessons} Lessons` },
                      { icon: 'person', label: curriculum.instructor },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 dq-glass-card rounded-xl text-sm text-slate-300">
                        <span className="material-symbols-outlined text-purple-400 text-[18px]">{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* About */}
                  <div className="dq-glass-card rounded-2xl p-6">
                    <h3 className="text-white font-bold text-lg mb-3">About this course</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{curriculum.overview}</p>
                  </div>

                  {/* What you'll learn */}
                  <div className="dq-glass-card rounded-2xl p-6">
                    <h3 className="text-white font-bold text-lg mb-4">What you'll learn</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {curriculum.modules.map(mod => (
                        <div key={mod.id} className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-green-400 text-[18px] mt-0.5 flex-shrink-0">check_circle</span>
                          <span className="text-slate-300 text-sm">{mod.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {course.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">My Notes</h2>
                    <span className="text-xs text-slate-500">Auto-saved in session</span>
                  </div>
                  <p className="text-sm text-slate-400">Jot down anything — key points, code snippets, questions to revisit later.</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Start typing your notes here…"
                    rows={18}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 resize-none font-mono leading-relaxed transition-colors"
                  />
                  {notes.trim() && (
                    <p className="text-[11px] text-slate-600">{notes.length} characters</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:flex flex-col w-[320px] flex-shrink-0 border-l border-white/10 dq-glass-panel overflow-hidden">
            {sidebarContent}
          </aside>

          {/* ── Mobile sidebar overlay ── */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
              <aside className="relative ml-auto w-[300px] h-full dq-glass-panel flex flex-col overflow-hidden z-10">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                  <span className="text-white font-bold text-sm">Course Contents</span>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                {sidebarContent}
              </aside>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CourseDetail
