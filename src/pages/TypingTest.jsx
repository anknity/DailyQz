import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '../components'
import { useAuth } from '../context/AuthContext'
import {
  FiType, FiClock, FiTarget, FiTrendingUp, FiZap, FiRefreshCw,
  FiCode, FiFileText, FiAward, FiBarChart2, FiHash, FiGlobe,
  FiAlignLeft
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const TypingTest = () => {
  const { currentUser } = useAuth()

  /* ───────── Settings ───────── */
  const [difficulty, setDifficulty] = useState('medium')
  const [testType, setTestType] = useState('general')
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [testMode, setTestMode] = useState('time')
  const [timeLimit, setTimeLimit] = useState(30)
  const [wordCountOption, setWordCountOption] = useState(50)
  const [includePunctuation, setIncludePunctuation] = useState(false)
  const [includeNumbers, setIncludeNumbers] = useState(false)

  /* ───────── Test State ───────── */
  const [passage, setPassage] = useState(null)
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [errors, setErrors] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  /* ───────── Results & Data ───────── */
  const [result, setResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [activeView, setActiveView] = useState('test')

  /* ───────── Refs ───────── */
  const hiddenInputRef = useRef(null)
  const timerRef = useRef(null)
  const activeCharRef = useRef(null)
  const textContainerRef = useRef(null)

  /* ───────── Display text (truncated for word mode) ───────── */
  const displayText = useMemo(() => {
    if (!passage?.text) return ''
    if (testMode === 'words') {
      return passage.text.split(/\s+/).slice(0, wordCountOption).join(' ')
    }
    return passage.text
  }, [passage?.text, testMode, wordCountOption])

  /* ══════════════════════════════════════════════
     FETCH FUNCTIONS  (exact backend logic preserved)
     ══════════════════════════════════════════════ */

  const fetchPassage = useCallback(async (useAI = false) => {
    setLoading(true)
    setInput('')
    setStarted(false)
    setFinished(false)
    setStartTime(null)
    setElapsed(0)
    setCharIndex(0)
    setErrors(new Set())
    setResult(null)
    setTimeLeft(testMode === 'time' ? timeLimit : null)
    if (textContainerRef.current) textContainerRef.current.scrollTop = 0

    try {
      const token = await currentUser?.getIdToken()
      const endpoint = useAI ? 'passage/ai' : 'passage'
      const params = new URLSearchParams({ difficulty, type: testType })
      if (testType === 'code') params.append('language', codeLanguage)

      const response = await fetch(`${API_URL}/v2/typing/${endpoint}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setPassage(data.data)
      }
    } catch (error) {
      console.error('Error fetching passage:', error)
      setPassage({
        id: 'fallback',
        text: 'he make where present course become large right before over may of move still new that child early form again however keep would too must well system first that could would like of about over these after use two how our work first well way even new want because any these give day most us great big become through just form that state move high good very right large other',
        type: 'general',
        difficulty: 'easy',
        charCount: 300,
        wordCount: 60
      })
    } finally {
      setLoading(false)
    }
  }, [currentUser, difficulty, testType, codeLanguage, testMode, timeLimit])

  useEffect(() => {
    fetchPassage()
    fetchStats()
  }, [])

  /* ───────── Timer ───────── */
  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        const now = Date.now()
        setElapsed(now - startTime)
        if (testMode === 'time') {
          const remaining = Math.max(0, timeLimit - Math.floor((now - startTime) / 1000))
          setTimeLeft(remaining)
        }
      }, 100)
    }
    return () => clearInterval(timerRef.current)
  }, [started, finished, startTime, testMode, timeLimit])

  /* ───────── Auto-finish when time expires ───────── */
  useEffect(() => {
    if (timeLeft === 0 && started && !finished) {
      finishTest()
    }
  }, [timeLeft, started, finished])

  /* ───────── Scroll active character into view ───────── */
  useEffect(() => {
    if (charIndex === 0 && textContainerRef.current) {
      textContainerRef.current.scrollTop = 0
      return
    }
    if (activeCharRef.current && textContainerRef.current) {
      const container = textContainerRef.current
      const charEl = activeCharRef.current
      const charRect = charEl.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      if (charRect.bottom > containerRect.bottom - 8) {
        container.scrollTop += charRect.height + 12
      }
    }
  }, [charIndex])

  const fetchStats = async () => {
    try {
      const token = await currentUser?.getIdToken()
      const response = await fetch(`${API_URL}/v2/typing/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setStats(data.data)
    } catch (e) { /* ignore */ }
  }

  const fetchLeaderboard = async () => {
    try {
      const token = await currentUser?.getIdToken()
      const response = await fetch(`${API_URL}/v2/typing/leaderboard?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setLeaderboard(data.data || [])
    } catch (e) { /* ignore */ }
  }

  const fetchHistory = async () => {
    try {
      const token = await currentUser?.getIdToken()
      const response = await fetch(`${API_URL}/v2/typing/history?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setHistory(data.data || [])
    } catch (e) { /* ignore */ }
  }

  /* ══════════════════════════════════════════════
     TYPING HANDLER
     ══════════════════════════════════════════════ */

  const handleKeyDown = (e) => {
    if (finished || !displayText) return
    if (e.key === 'Tab') { e.preventDefault(); return }

    if (!started) {
      setStarted(true)
      setStartTime(Date.now())
      if (testMode === 'time') setTimeLeft(timeLimit)
    }

    const text = displayText

    if (e.key === 'Backspace') {
      if (charIndex > 0) {
        setCharIndex(prev => prev - 1)
        setInput(prev => prev.slice(0, -1))
        setErrors(prev => {
          const next = new Set(prev)
          next.delete(charIndex - 1)
          return next
        })
      }
      e.preventDefault()
      return
    }

    if (e.key.length > 1 && e.key !== 'Enter') return

    const expectedChar = text[charIndex]
    let typedChar = e.key
    if (e.key === 'Enter') typedChar = '\n'

    if (charIndex < text.length) {
      if (typedChar !== expectedChar) {
        setErrors(prev => new Set(prev).add(charIndex))
      }
      setCharIndex(prev => prev + 1)
      setInput(prev => prev + typedChar)

      if (charIndex + 1 >= text.length) {
        finishTest()
      }
    }

    e.preventDefault()
  }

  /* ══════════════════════════════════════════════
     FINISH TEST  (exact backend submission)
     ══════════════════════════════════════════════ */

  const finishTest = async () => {
    setFinished(true)
    clearInterval(timerRef.current)

    const text = displayText
    const typedChars = charIndex
    const correctChars = typedChars - errors.size
    const accuracy = typedChars > 0 ? (correctChars / typedChars) * 100 : 0
    const durationSec = (Date.now() - startTime) / 1000
    const wordsTyped = input.trim().split(/\s+/).filter(Boolean).length || 1
    const wpm = Math.round((wordsTyped / durationSec) * 60)
    const rawWpm = Math.round((typedChars / 5 / durationSec) * 60)

    const resultData = {
      wpm,
      rawWpm,
      accuracy: Math.round(accuracy * 100) / 100,
      duration: Math.round(durationSec),
      correctChars,
      incorrectChars: errors.size,
      totalChars: text.length,
      difficulty,
      type: testType,
      language: testType === 'code' ? codeLanguage : undefined,
      passageId: passage?.id
    }

    setResult(resultData)

    setSubmitting(true)
    try {
      const token = await currentUser?.getIdToken()
      await fetch(`${API_URL}/v2/typing/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      })
      await fetch(`${API_URL}/users/update-streak`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityType: 'typing' })
      })
      fetchStats()
    } catch (e) {
      console.error('Error submitting result:', e)
    } finally {
      setSubmitting(false)
    }
  }

  /* ───────── Helper Functions ───────── */

  const getWpmColor = (wpm) => {
    if (wpm >= 80) return 'text-green-500'
    if (wpm >= 60) return 'text-blue-500'
    if (wpm >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getWpmGrade = (wpm) => {
    if (wpm >= 100) return { grade: 'S', label: 'Legendary!', color: 'text-purple-400' }
    if (wpm >= 80) return { grade: 'A', label: 'Excellent!', color: 'text-green-400' }
    if (wpm >= 60) return { grade: 'B', label: 'Great!', color: 'text-blue-400' }
    if (wpm >= 40) return { grade: 'C', label: 'Good', color: 'text-yellow-400' }
    if (wpm >= 20) return { grade: 'D', label: 'Keep Practicing', color: 'text-orange-400' }
    return { grade: 'F', label: 'Try Again', color: 'text-red-400' }
  }

  const liveWpm = useMemo(() => {
    if (!started || elapsed < 1000) return 0
    return Math.round((charIndex / 5) / (elapsed / 60000))
  }, [charIndex, elapsed, started])

  const liveAccuracy = useMemo(() => {
    if (charIndex === 0) return 100
    return Math.round(((charIndex - errors.size) / charIndex) * 100)
  }, [charIndex, errors.size])

  /* ───────── Mode / Option Handlers ───────── */

  const handleRestart = () => fetchPassage()

  const handleModeChange = (mode) => {
    setTestMode(mode)
    if (!started) fetchPassage()
  }

  const handleTimeLimitChange = (t) => {
    setTimeLimit(t)
    setTimeLeft(t)
    if (!started) fetchPassage()
  }

  const handleWordCountChange = (w) => {
    setWordCountOption(w)
    if (!started) fetchPassage()
  }

  /* ══════════════════════════════════════════════
     RENDER PASSAGE  (MonkeyType-style)
     ══════════════════════════════════════════════ */

  const renderPassage = () => {
    if (!displayText) return null

    const isCode = testType === 'code'
    const fontSize = isCode
      ? 'text-[0.95rem] sm:text-[1.05rem]'
      : 'text-[1.35rem] sm:text-[1.55rem] md:text-[1.75rem]'
    const lineHeight = isCode
      ? 'leading-[1.8rem] sm:leading-[2rem]'
      : 'leading-[2.2rem] sm:leading-[2.6rem] md:leading-[3rem]'

    return (
      <div
        ref={textContainerRef}
        className={`font-mono ${fontSize} ${lineHeight} select-none overflow-hidden text-center`}
        style={{ maxHeight: isCode ? '14rem' : '12rem', wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
        onClick={() => hiddenInputRef.current?.focus()}
      >
        {displayText.split('').map((char, i) => {
          // Color logic
          let color = '#6b7a8d' // untyped — visible muted gray
          let bg = 'transparent'
          if (i < charIndex) {
            if (errors.has(i)) {
              color = '#ff6b6b' // error — bright red
              bg = 'rgba(255,107,107,0.12)'
            } else {
              color = isCode ? '#98c379' : '#e2e0d8' // correct — green for code, bright beige for text
            }
          }
          const isCurrent = i === charIndex
          if (isCurrent) {
            color = '#ffffff' // current char — white
          }

          return (
            <span
              key={i}
              ref={isCurrent ? activeCharRef : null}
              style={{ color, backgroundColor: bg, position: 'relative' }}
            >
              {isCurrent && (
                <span
                  style={{
                    position: 'absolute',
                    left: '-1.5px',
                    top: '3px',
                    bottom: '3px',
                    width: '2.5px',
                    backgroundColor: '#e2b714',
                    borderRadius: '2px',
                    animation: 'caret-blink 1s step-end infinite'
                  }}
                />
              )}
              {char === '\n' ? '\u21B5\n' : char}
            </span>
          )
        })}
      </div>
    )
  }

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#101922]">
      <Navbar />

      {/* Caret blink keyframe */}
      <style>{`
        @keyframes caret-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ═══════ VIEW TOGGLE ═══════ */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[#1a2632] rounded-xl p-1 border border-[#2f4b66] gap-1">
            {[
              { id: 'test', label: 'Test', icon: <FiType className="w-4 h-4" /> },
              { id: 'leaderboard', label: 'Leaderboard', icon: <FiAward className="w-4 h-4" /> },
              { id: 'history', label: 'History', icon: <FiBarChart2 className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveView(tab.id)
                  if (tab.id === 'leaderboard') fetchLeaderboard()
                  if (tab.id === 'history') fetchHistory()
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeView === tab.id
                    ? 'bg-[#e2b714] text-[#a5a2a2] shadow-lg shadow-yellow-500/10'
                    : 'text-[#d1d0c5] hover:text-[#ffffff]'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════ TEST VIEW ═══════ */}
        {activeView === 'test' && (
          <div className="flex flex-col items-center">

            {/* MonkeyType Mode Bar */}
            <AnimatePresence>
              {!started && !finished && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                  className="bg-[#1a2632] rounded-xl px-2 sm:px-3 py-2 mb-6 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 border border-[#2f4b66] text-[12px] sm:text-[13px] font-medium select-none"
                >
                  {/* Punctuation toggle */}
                  <button
                    onClick={() => setIncludePunctuation(p => !p)}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${
                      includePunctuation ? 'text-[#e2b714]' : 'text-[#d1d0c5] hover:text-[#ffffff]'
                    }`}
                  >
                    <span className="text-[11px]">@</span> punctuation
                  </button>

                  {/* Numbers toggle */}
                  <button
                    onClick={() => setIncludeNumbers(n => !n)}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${
                      includeNumbers ? 'text-[#e2b714]' : 'text-[#d1d0c5] hover:text-[#ffffff]'
                    }`}
                  >
                    <FiHash className="w-3 h-3" /> numbers
                  </button>

                  {/* Divider */}
                  <div className="w-px h-5 bg-[#2f4b66] mx-0.5 sm:mx-1 hidden sm:block" />

                  {/* Test modes */}
                  {[
                    { id: 'time', label: 'time', icon: <FiClock className="w-3.5 h-3.5" /> },
                    { id: 'words', label: 'words', icon: <FiAlignLeft className="w-3.5 h-3.5" /> },
                    { id: 'quote', label: 'quote', icon: <span className="text-[11px]">{'\u201C\u201D'}</span> }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleModeChange(m.id)}
                      className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${
                        testMode === m.id ? 'text-[#e2b714]' : 'text-[#d1d0c5] hover:text-[#ffffff]'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}

                  {/* Code toggle */}
                  <button
                    onClick={() => {
                      setTestType(prev => prev === 'code' ? 'general' : 'code')
                      fetchPassage()
                    }}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${
                      testType === 'code' ? 'text-[#e2b714]' : 'text-[#d1d0c5] hover:text-[#ffffff]'
                    }`}
                  >
                    <FiCode className="w-3.5 h-3.5" /> code
                  </button>

                  {/* Divider */}
                  <div className="w-px h-5 bg-[#2f4b66] mx-0.5 sm:mx-1 hidden sm:block" />

                  {/* Time / Word-count options */}
                  {testMode === 'time' && (
                    [15, 30, 60, 120].map(t => (
                      <button
                        key={t}
                        onClick={() => handleTimeLimitChange(t)}
                        className={`px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors min-w-[28px] ${
                          timeLimit === t ? 'text-[#e2b714]' : 'text-[#d1d0c5] hover:text-[#ffffff]'
                        }`}
                      >
                        {t}
                      </button>
                    ))
                  )}
                  {testMode === 'words' && (
                    [10, 25, 50, 100].map(w => (
                      <button
                        key={w}
                        onClick={() => handleWordCountChange(w)}
                        className={`px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors min-w-[28px] ${
                          wordCountOption === w ? 'text-[#e2b714]' : 'text-[#d1d0c5] hover:text-[#ffffff]'
                        }`}
                      >
                        {w}
                      </button>
                    ))
                  )}

                  {/* Code language */}
                  {testType === 'code' && (
                    <>
                      <div className="w-px h-5 bg-[#2f4b66] mx-0.5 sm:mx-1" />
                      <select
                        value={codeLanguage}
                        onChange={(e) => { setCodeLanguage(e.target.value); fetchPassage() }}
                        className="bg-[#1a2632] text-[#d1d0c5] text-[13px] border-none focus:ring-0 cursor-pointer hover:text-[#ffffff] rounded px-1"
                      >
                        <option value="javascript">javascript</option>
                        <option value="python">python</option>
                        <option value="java">java</option>
                        <option value="cpp">c++</option>
                      </select>
                    </>
                  )}

                  {/* Divider + AI */}
                  <div className="w-px h-5 bg-[#2f4b66] mx-0.5 sm:mx-1 hidden sm:block" />
                  <button
                    onClick={() => fetchPassage(true)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[#d1d0c5] hover:text-[#ffffff] transition-colors"
                  >
                    {'\u{1F916}'} ai
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Language / Difficulty */}
            <AnimatePresence>
              {!started && !finished && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="flex items-center gap-4 mb-6 text-sm"
                >
                  <span className="flex items-center gap-1.5 text-[#d1d0c5]">
                    <FiGlobe className="w-4 h-4" />
                    english
                  </span>
                  <div className="flex items-center gap-2">
                    {['easy', 'medium', 'hard'].map(d => (
                      <button
                        key={d}
                        onClick={() => { setDifficulty(d); fetchPassage() }}
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                          difficulty === d
                            ? 'text-[#e2b714] bg-[#e2b714]/10'
                            : 'text-[#d1d0c5] hover:text-[#ffffff]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Stats (visible while typing) */}
            <AnimatePresence>
              {started && !finished && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-6 sm:gap-8 mb-6"
                >
                  {testMode === 'time' && timeLeft !== null && (
                    <span className="text-[2.5rem] sm:text-[3rem] font-mono font-light text-[#e2b714] leading-none">
                      {timeLeft}
                    </span>
                  )}
                  <span className="text-[1.5rem] sm:text-[2rem] font-mono font-light text-[#ffffff]">
                    {liveWpm}
                    <span className="text-sm text-[#d1d0c5] font-sans ml-1">wpm</span>
                  </span>
                  <span className="text-[1.5rem] sm:text-[2rem] font-mono font-light text-[#ffffff]">
                    {liveAccuracy}
                    <span className="text-sm text-[#d1d0c5] font-sans ml-0.5">%</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══════ PASSAGE AREA ═══════ */}
            <div className="w-full max-w-4xl relative">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-2 border-[#e2b714] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displayText ? (
                <div className="relative">
                  {renderPassage()}

                  {/* Hidden input for capturing keystrokes */}
                  <input
                    ref={hiddenInputRef}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-text z-10"
                    onKeyDown={handleKeyDown}
                    autoFocus
                    readOnly
                    aria-label="Type here"
                  />

                  {!started && !finished && (
                    <p className="text-center text-[#d1d0c5]/70 mt-6 text-sm animate-pulse">
                      Click here and start typing...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-[#d1d0c5] py-12">Failed to load passage</p>
              )}
            </div>

            {/* Restart Button */}
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRestart}
              className="mt-8 text-[#d1d0c5] hover:text-[#ffffff] transition-colors p-2"
              title="Restart test"
            >
              <FiRefreshCw className="w-5 h-5" />
            </motion.button>

            {/* Stats Cards (shown when idle) */}
            <AnimatePresence>
              {stats && !started && !finished && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10 w-full max-w-3xl"
                >
                  {[
                    { icon: <FiZap className="w-5 h-5 text-[#e2b714]" />, val: stats.bestWpm || 0, label: 'Best WPM' },
                    { icon: <FiTrendingUp className="w-5 h-5 text-blue-400" />, val: stats.avgWpm || 0, label: 'Avg WPM' },
                    { icon: <FiTarget className="w-5 h-5 text-green-400" />, val: `${stats.bestAccuracy || 0}%`, label: 'Best Accuracy' },
                    { icon: <FiFileText className="w-5 h-5 text-purple-400" />, val: stats.testsTaken || 0, label: 'Tests Taken' }
                  ].map((s, i) => (
                    <div key={i} className="bg-[#1a2632] rounded-xl p-4 text-center border border-[#2f4b66]">
                      <div className="flex justify-center mb-1">{s.icon}</div>
                      <p className="text-2xl font-bold text-[#ffffff] font-mono">{s.val}</p>
                      <p className="text-xs text-[#d1d0c5] mt-1">{s.label}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══════ RESULT ═══════ */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-3xl mt-8"
                >
                  {/* Big WPM */}
                  <div className="text-center mb-8">
                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="text-[5rem] md:text-[6rem] font-mono font-bold text-[#e2b714] leading-none"
                    >
                      {result.wpm}
                    </motion.p>
                    <p className="text-[#d1d0c5] text-lg mt-1">words per minute</p>
                    <p className={`text-xl font-bold mt-2 ${getWpmGrade(result.wpm).color}`}>
                      {getWpmGrade(result.wpm).grade} {'\u2014'} {getWpmGrade(result.wpm).label}
                    </p>
                  </div>

                  {/* Result grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    <div className="bg-[#1a2632] rounded-xl p-4 text-center border border-[#2f4b66]">
                      <p className="text-3xl font-bold font-mono text-[#ffffff]">{result.rawWpm}</p>
                      <p className="text-xs text-[#d1d0c5] mt-1">raw wpm</p>
                    </div>
                    <div className="bg-[#1a2632] rounded-xl p-4 text-center border border-[#2f4b66]">
                      <p className={`text-3xl font-bold font-mono ${
                        result.accuracy >= 95 ? 'text-green-400' : result.accuracy >= 85 ? 'text-[#e2b714]' : 'text-[#ca4754]'
                      }`}>
                        {result.accuracy}%
                      </p>
                      <p className="text-xs text-[#d1d0c5] mt-1">accuracy</p>
                    </div>
                    <div className="bg-[#1a2632] rounded-xl p-4 text-center border border-[#2f4b66]">
                      <p className="text-3xl font-bold font-mono text-[#ffffff]">{result.duration}s</p>
                      <p className="text-xs text-[#d1d0c5] mt-1">time</p>
                    </div>
                    <div className="bg-[#1a2632] rounded-xl p-4 text-center border border-[#2f4b66]">
                      <p className="text-3xl font-bold font-mono text-[#ca4754]">{result.incorrectChars}</p>
                      <p className="text-xs text-[#d1d0c5] mt-1">errors</p>
                    </div>
                  </div>

                  {/* Restart buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={() => fetchPassage(false)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2632] text-[#ffffff] rounded-xl border border-[#2f4b66] hover:border-[#e2b714] hover:text-[#e2b714] transition-colors font-medium"
                    >
                      <FiRefreshCw className="w-4 h-4" /> Next Test
                    </button>
                    <button
                      onClick={() => fetchPassage(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2632] text-[#ffffff] rounded-xl border border-[#2f4b66] hover:border-purple-400 hover:text-purple-400 transition-colors font-medium"
                    >
                      {'\u{1F916}'} AI Passage
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ═══════ LEADERBOARD VIEW ═══════ */}
        {activeView === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a2632] rounded-xl overflow-hidden border border-[#2f4b66]"
          >
            <div className="px-6 py-4 border-b border-[#2f4b66]">
              <div className="hidden sm:grid grid-cols-12 gap-4 text-sm font-medium text-[#d1d0c5]">
                <div className="col-span-1">#</div>
                <div className="col-span-5">user</div>
                <div className="col-span-2 text-center">best</div>
                <div className="col-span-2 text-center">accuracy</div>
                <div className="col-span-2 text-center">tests</div>
              </div>
              <p className="sm:hidden text-sm font-medium text-[#d1d0c5]">Leaderboard</p>
            </div>

            <div className="divide-y divide-[#2f4b66]/50">
              {leaderboard.length === 0 ? (
                <div className="py-16 text-center text-[#d1d0c5]">
                  <FiAward className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No data yet. Be the first!</p>
                </div>
              ) : (
                leaderboard.map((user, index) => {
                  const isCurrentUser = user.uid === currentUser?.uid
                  return (
                    <div
                      key={user.id || index}
                      className={`px-6 py-3.5 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center flex flex-wrap items-center justify-between gap-2 transition-colors ${
                        isCurrentUser ? 'bg-[#e2b714]/5' : 'hover:bg-[#223649]'
                      }`}
                    >
                      <div className="sm:col-span-1 font-mono text-sm">
                        {user.rank <= 3 ? (
                          <span className="text-xl">{user.rank === 1 ? '\u{1F947}' : user.rank === 2 ? '\u{1F948}' : '\u{1F949}'}</span>
                        ) : (
                          <span className="text-[#d1d0c5]">{user.rank}</span>
                        )}
                      </div>
                      <div className="sm:col-span-5 flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isCurrentUser ? 'text-[#e2b714]' : 'text-[#ffffff]'}`}>
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] bg-[#e2b714]/20 text-[#e2b714] px-1.5 py-0.5 rounded-full">you</span>
                          )}
                        </p>
                        <p className="text-xs text-[#d1d0c5]">avg {user.avgWpm} wpm</p>
                      </div>
                      <div className="sm:col-span-2 text-center">
                        <span className={`font-bold font-mono text-sm ${getWpmColor(user.wpm)}`}>{user.wpm}</span>
                        <span className="sm:hidden text-xs text-[#d1d0c5] ml-1">wpm</span>
                      </div>
                      <div className="sm:col-span-2 text-center text-sm text-[#ffffff]/80 hidden sm:block">
                        {user.accuracy}%
                      </div>
                      <div className="sm:col-span-2 text-center text-sm text-[#d1d0c5] hidden sm:block">
                        {user.testsCompleted}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════ HISTORY VIEW ═══════ */}
        {activeView === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a2632] rounded-xl overflow-hidden border border-[#2f4b66]">
            <div className="px-6 py-4 border-b border-[#2f4b66]">
              <h3 className="font-semibold text-[#ffffff]">Recent Tests</h3>
            </div>

            <div className="divide-y divide-[#2f4b66]/50">
              {history.length === 0 ? (
                <div className="py-16 text-center text-[#d1d0c5]">
                  <FiClock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No tests taken yet</p>
                </div>
              ) : (
                history.map((test, i) => (
                  <div
                    key={test.id || i}
                    className="px-6 py-4 flex items-center justify-between hover:bg-[#223649] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[#ffffff] capitalize text-sm">
                        {test.type === 'code' ? `${test.language} code` : 'text'} {'\u00B7'} {test.difficulty}
                      </p>
                      <p className="text-xs text-[#d1d0c5]">
                        {new Date(test.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold font-mono ${getWpmColor(test.wpm)}`}>{test.wpm}</p>
                      <p className="text-xs text-[#d1d0c5]">wpm {'{\u00B7}'} {test.accuracy}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default TypingTest
