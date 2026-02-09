import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '../components'
import { useAuth } from '../context/AuthContext'
import {
  FiType, FiClock, FiTarget, FiTrendingUp, FiZap, FiRefreshCw,
  FiCode, FiFileText, FiAward, FiBarChart2, FiHash, FiGlobe,
  FiAlignLeft
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ═══════════════════════════════════════════════════
   10 DIVERSE TYPING PASSAGES — each user gets variety
   ═══════════════════════════════════════════════════ */
const TYPING_PASSAGES = [
  {
    id: 'local-1',
    text: 'The quick brown fox jumps over the lazy dog near the riverbank while the sun sets behind the mountains casting golden light across the valley. Birds sing their evening songs as the wind gently rustles through the tall grass creating a peaceful symphony of nature. The farmer walks home along the dusty path carrying fresh vegetables from his garden thinking about the warm dinner awaiting him. Stars begin to appear one by one in the darkening sky as crickets start their nightly chorus filling the air with familiar sounds of summer.',
    type: 'general', difficulty: 'easy', charCount: 520, wordCount: 88
  },
  {
    id: 'local-2',
    text: 'Software engineering is a discipline that combines mathematical precision with creative problem solving. Developers must understand algorithms data structures and system design to build scalable applications. The process of debugging requires patience and logical thinking as errors can hide in the most unexpected places. Testing is equally important because it ensures reliability and helps catch issues before they reach production. Modern development practices like continuous integration and automated testing have transformed how teams deliver software making it faster and more dependable.',
    type: 'general', difficulty: 'medium', charCount: 540, wordCount: 82
  },
  {
    id: 'local-3',
    text: 'In the heart of every great city lies a story waiting to be told. Streets filled with people from different backgrounds create a tapestry of cultures languages and traditions. Coffee shops serve as meeting points where ideas are born and friendships are forged over steaming cups. The architecture tells tales of centuries past while modern skyscrapers reach toward the clouds symbolizing human ambition. Public parks provide green spaces where families gather children play and elderly couples walk hand in hand enjoying the simple pleasures that make life beautiful.',
    type: 'general', difficulty: 'medium', charCount: 530, wordCount: 86
  },
  {
    id: 'local-4',
    text: 'Artificial intelligence has revolutionized the way we interact with technology. Machine learning models can now recognize speech translate languages and even generate creative content. Neural networks inspired by the human brain process vast amounts of data to find patterns that would take humans years to discover. From self driving cars to medical diagnostics these systems are becoming integral to our daily lives. However ethical considerations around privacy bias and job displacement remain important topics that society must address as this technology continues to evolve rapidly.',
    type: 'general', difficulty: 'hard', charCount: 550, wordCount: 84
  },
  {
    id: 'local-5',
    text: 'The ocean covers more than seventy percent of our planet yet we have explored less than five percent of it. Deep beneath the waves mysterious creatures thrive in complete darkness near hydrothermal vents where temperatures can exceed four hundred degrees. Coral reefs often called the rainforests of the sea support thousands of marine species and protect coastal communities from storms. Scientists continue to discover new species every year reminding us how much remains unknown about our own world. Preserving these ecosystems is crucial for maintaining the delicate balance of life on Earth.',
    type: 'general', difficulty: 'medium', charCount: 560, wordCount: 90
  },
  {
    id: 'local-6',
    text: 'Music has been a fundamental part of human culture since the earliest civilizations. From ancient drums and flutes to modern electronic synthesizers the tools have changed but the desire to create rhythm and melody remains constant. Studies show that playing an instrument improves memory coordination and emotional intelligence. Listening to music activates multiple areas of the brain simultaneously creating a unique neurological experience. Whether it is classical jazz rock or hip hop every genre carries the power to move people unite communities and express emotions that words alone cannot capture.',
    type: 'general', difficulty: 'medium', charCount: 555, wordCount: 88
  },
  {
    id: 'local-7',
    text: 'The art of cooking transforms simple ingredients into extraordinary experiences. A skilled chef understands how heat chemistry and timing work together to create flavors that delight the senses. Different cultures have developed unique culinary traditions passed down through generations each reflecting local ingredients climate and history. From the spicy curries of India to the delicate sushi of Japan food tells the story of a people. Learning to cook is not just about following recipes it is about understanding the science behind each technique and developing an intuition that comes only with practice.',
    type: 'general', difficulty: 'medium', charCount: 545, wordCount: 88
  },
  {
    id: 'local-8',
    text: 'Space exploration represents humanitys greatest adventure pushing the boundaries of what we thought possible. The first moon landing in nineteen sixty nine inspired an entire generation to dream bigger and reach further. Today private companies are making space travel more accessible while scientists search for signs of life on Mars and beyond. Telescopes peer deep into the cosmos revealing galaxies that formed billions of years ago. The International Space Station serves as a symbol of international cooperation where astronauts from different countries work together advancing our understanding of science and the universe.',
    type: 'general', difficulty: 'hard', charCount: 560, wordCount: 86
  },
  {
    id: 'local-9',
    text: 'Reading is one of the most powerful habits a person can develop. Books open doors to new worlds ideas and perspectives that we might never encounter otherwise. Fiction cultivates empathy by allowing us to experience life through different characters while nonfiction expands our knowledge of the real world. Great writers have the ability to capture complex emotions in simple sentences creating connections across time and distance. Libraries serve as sanctuaries of knowledge free and open to everyone regardless of background. In an age of digital distraction the simple act of reading a book remains a profound exercise.',
    type: 'general', difficulty: 'medium', charCount: 560, wordCount: 92
  },
  {
    id: 'local-10',
    text: 'Physical exercise is essential for both mental and physical health. Regular movement strengthens the heart improves circulation and helps maintain a healthy weight. Beyond the obvious physical benefits exercise releases endorphins that reduce stress and improve mood. Team sports teach valuable lessons about cooperation communication and perseverance. Even simple activities like walking or stretching can make a significant difference in overall wellbeing. The key is consistency rather than intensity because small daily efforts compound over time leading to lasting improvements in energy focus and quality of life.',
    type: 'general', difficulty: 'easy', charCount: 530, wordCount: 85
  }
]

/* Memoized character span to avoid re-renders */
const CharSpan = memo(({ char, color, bg, isCurrent, activeCharRef, isCode }) => (
  <span
    ref={isCurrent ? activeCharRef : null}
    style={{ color, backgroundColor: bg, position: 'relative', willChange: isCurrent ? 'color' : 'auto' }}
  >
    {isCurrent && (
      <span
        className="caret-blink"
        style={{
          position: 'absolute',
          left: '-1.5px',
          top: '3px',
          bottom: '3px',
          width: '2.5px',
          backgroundColor: '#e2b714',
          borderRadius: '2px',
        }}
      />
    )}
    {char === '\n' ? '\u21B5\n' : char}
  </span>
))
CharSpan.displayName = 'CharSpan'

const getRandomPassage = () => {
  const idx = Math.floor(Math.random() * TYPING_PASSAGES.length)
  return TYPING_PASSAGES[idx]
}

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
    /* Reset state immediately */
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

    /* Show a random local passage INSTANTLY — no loading spinner */
    const localPassage = getRandomPassage()
    setPassage(localPassage)
    setLoading(false)

    /* Then try API in background (non-blocking) to get a better passage */
    try {
      const token = await currentUser?.getIdToken()
      if (!token) return

      const endpoint = useAI ? 'passage/ai' : 'passage'
      const params = new URLSearchParams({ difficulty, type: testType })
      if (testType === 'code') params.append('language', codeLanguage)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s max

      const response = await fetch(`${API_URL}/v2/typing/${endpoint}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const data = await response.json()
      if (data.success && data.data?.text) {
        /* Only swap if user hasn't started typing yet */
        setStarted(prev => {
          if (!prev) setPassage(data.data)
          return prev
        })
      }
    } catch (error) {
      /* Silently keep local passage — user already has text to type */
      if (error.name !== 'AbortError') {
        console.warn('API passage fetch skipped:', error.message)
      }
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
        style={{ maxHeight: isCode ? '14rem' : '12rem', wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', willChange: 'scroll-position' }}
        onClick={() => hiddenInputRef.current?.focus()}
      >
        {displayText.split('').map((char, i) => {
          let color = '#6b7a8d'
          let bg = 'transparent'
          if (i < charIndex) {
            if (errors.has(i)) {
              color = '#ff6b6b'
              bg = 'rgba(255,107,107,0.12)'
            } else {
              color = isCode ? '#98c379' : '#e2e0d8'
            }
          }
          const isCurrent = i === charIndex
          if (isCurrent) color = '#ffffff'

          return (
            <CharSpan
              key={i}
              char={char}
              color={color}
              bg={bg}
              isCurrent={isCurrent}
              activeCharRef={activeCharRef}
              isCode={isCode}
            />
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

      {/* Caret blink keyframe + GPU acceleration */}
      <style>{`
        @keyframes caret-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .caret-blink {
          animation: caret-blink 1s step-end infinite;
          will-change: opacity;
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
