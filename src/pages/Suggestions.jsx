import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '../components'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const CATEGORIES = [
  { id: 'feature', label: 'New Feature', icon: 'lightbulb', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { id: 'bug',     label: 'Bug Report',  icon: 'bug_report', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { id: 'content', label: 'Content / Questions', icon: 'edit_note', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'course',  label: 'Course Request', icon: 'menu_book', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'ux',      label: 'UI / UX',     icon: 'palette', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { id: 'other',   label: 'Other',       icon: 'more_horiz', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
]

const SAMPLE_SUGGESTIONS = [
  { id: 1, category: 'feature', title: 'Pomodoro timer inside course viewer', votes: 42, author: 'Priya M.' },
  { id: 2, category: 'course',  title: 'React.js full course (free)', votes: 38, author: 'Rohan K.' },
  { id: 3, category: 'feature', title: 'Dark / light theme toggle', votes: 31, author: 'Ananya S.' },
  { id: 4, category: 'content', title: 'More System Design interview questions', votes: 27, author: 'Amit J.' },
  { id: 5, category: 'ux',      title: 'Progress tracking per course', votes: 24, author: 'Sneha P.' },
]

const Suggestions = () => {
  const { userProfile, currentUser } = useAuth()
  const [activeCategory, setActiveCategory] = useState('all')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [selectedCat, setSelectedCat] = useState('feature')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [upvoted, setUpvoted] = useState(new Set())
  const [localSuggestions, setLocalSuggestions] = useState(SAMPLE_SUGGESTIONS)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      // POST to backend so admin can see it
      if (currentUser) {
        const token = await currentUser.getIdToken()
        await fetch(`${API_URL}/users/feedback`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: title.trim(),
            message: detail.trim() || title.trim(),
            category: selectedCat
          })
        })
      }
    } catch (err) {
      console.warn('Failed to submit suggestion to server:', err)
    } finally {
      setSubmitting(false)
    }
    // Also add optimistically to local community board
    const newSuggestion = {
      id: Date.now(),
      category: selectedCat,
      title: title.trim(),
      votes: 1,
      author: userProfile?.name?.split(' ')[0] || 'You',
    }
    setLocalSuggestions(prev => [newSuggestion, ...prev])
    setTitle('')
    setDetail('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const toggleUpvote = (id) => {
    setUpvoted(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setLocalSuggestions(s => s.map(x => x.id === id ? { ...x, votes: x.votes - 1 } : x))
      } else {
        next.add(id)
        setLocalSuggestions(s => s.map(x => x.id === id ? { ...x, votes: x.votes + 1 } : x))
      }
      return next
    })
  }

  const filtered = activeCategory === 'all'
    ? localSuggestions
    : localSuggestions.filter(s => s.category === activeCategory)

  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Suggestions 💡
          </h1>
          <p className="text-slate-400 text-sm">
            Got an idea? Found a bug? We'd love to hear from you. Upvote ideas you want to see built.
          </p>
        </div>

        {/* Submit form */}
        <div className="dq-glass-panel rounded-3xl p-6 flex flex-col gap-5">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">add_circle</span>
            Submit a suggestion
          </h2>

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 px-4 py-3 bg-green-500/15 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Thanks! Your suggestion has been submitted 🎉
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Category picker */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                    ${selectedCat === cat.id
                      ? cat.color + ' shadow-sm'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Title <span className="text-red-400">*</span></label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Add dark mode toggle"
                maxLength={120}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            {/* Detail (optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Details <span className="text-slate-500">(optional)</span></label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Describe your idea in more detail…"
                rows={3}
                maxLength={500}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 resize-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">{submitting ? 'hourglass_empty' : 'send'}</span>
              {submitting ? 'Submitting…' : 'Submit Suggestion'}
            </button>
          </form>
        </div>

        {/* ── Community Board ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-white font-bold text-lg">Community Board</h2>
            {/* Filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                  ${activeCategory === 'all' ? 'bg-white/10 text-white border-white/20' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                    ${activeCategory === cat.id ? 'bg-white/10 text-white border-white/20' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <span className="material-symbols-outlined text-5xl opacity-30 block mb-3">inbox</span>
              No suggestions yet in this category. Be the first!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.sort((a, b) => b.votes - a.votes).map((s, i) => {
                const cat = catInfo(s.category)
                const isUp = upvoted.has(s.id)
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="dq-glass-card rounded-2xl p-4 flex items-start gap-4"
                  >
                    {/* Upvote */}
                    <button
                      onClick={() => toggleUpvote(s.id)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all flex-shrink-0
                        ${isUp ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-slate-400 hover:border-purple-500/30 hover:text-purple-400'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{isUp ? 'arrow_upward' : 'arrow_upward'}</span>
                      <span className="text-xs font-bold">{s.votes}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${cat.color}`}>
                          <span className="material-symbols-outlined text-[11px]">{cat.icon}</span>
                          {cat.label}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium leading-snug">{s.title}</p>
                      <p className="text-slate-500 text-[11px] mt-1">by {s.author}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default Suggestions
