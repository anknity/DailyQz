/**
 * courseService.js
 * Fetches free courses from multiple open/free APIs:
 *   1. YouTube Data API v3  (requires VITE_YOUTUBE_API_KEY in .env)
 *   2. freeCodeCamp curriculum (JSON feed, no key needed)
 *   3. Khan Academy API (open, no key needed)
 *   4. Dev.to articles as reading resources (no key needed)
 *
 * All results are normalised to the shape:
 * {
 *   id, title, description, provider, providerLogo,
 *   url, thumbnail, duration, level, tags[], type
 * }
 */

const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''
const YT_BASE = 'https://www.googleapis.com/youtube/v3'

// ─── Topic → YouTube playlist / channel IDs ─────────────────────────────────
const YT_PLAYLISTS = {
  python:  ['PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3', 'PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU'], // Corey Schafer + Corey Schafer
  sql:     ['PLbGui_ZYuhigZkqrHbI_ZkPBrIr5Rsd5L', 'PLavw5C92dz9GVRBOfj6VFpPHBCZGwmCl3'],
  html:    ['PLillGF-RfqbZTASqIqdvm1R5mLrQq79CU'],
  css:     ['PLillGF-RfqbYRpji8t4SxUkMxfowG4Kqp'],
  java:    ['PLsyeobzWxl7pe_IiTfNyr55kwJPWbgxB5', 'PLBlnK6fEyqRjKA_NuK9mHmlk0dZzuP1P5'],
  javascript: ['PLillGF-RfqbbnEGy3ROiLWk7JMCuSyQtX', 'PLpPVLI0A_zSqjXCMHnRUBEKFE5OBjFXlJ'],
  web:     ['PLillGF-RfqbbnEGy3ROiLWk7JMCuSyQtX', 'PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3'],
  dsa:     ['PLBZBJbE_rGRV8D7XZ08LK6z-4zPoWzu5H', 'PLrmLmBdFIWZTbZKBFGGrAtULsm_RD6keW'],
  react:   ['PLillGF-RfqbY3c2r0htQyVbDJJoBFE6Rb', 'PLSsAz5wf2lkKm0BG9wUWWSgYWBzknenJTg'],
  c:       ['PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm'],
}

// Normalise a YouTube playlist item
function normaliseYT(item, query) {
  const snip = item.snippet || {}
  const thumbs = snip.thumbnails || {}
  return {
    id: `yt-${item.id?.playlistId || item.id}`,
    title: snip.title || 'YouTube Course',
    description: (snip.description || '').slice(0, 160),
    provider: 'YouTube',
    providerLogo: '▶️',
    url: `https://www.youtube.com/playlist?list=${item.id?.playlistId || item.id}`,
    thumbnail: (thumbs.high || thumbs.medium || thumbs.default || {}).url || '',
    duration: 'Free',
    level: 'All Levels',
    tags: [query, 'video', 'free'],
    type: 'video',
  }
}

/**
 * Search YouTube for course playlists
 */
export async function fetchYouTubeCourses(query) {
  if (!YT_KEY) return []
  try {
    const q = encodeURIComponent(`${query} full course tutorial`)
    const res = await fetch(
      `${YT_BASE}/search?part=snippet&type=playlist&maxResults=6&q=${q}&key=${YT_KEY}&relevanceLanguage=en`
    )
    const data = await res.json()
    if (!data.items) return []
    return data.items.map(item => ({
      id: `yt-${item.id?.playlistId}`,
      title: item.snippet?.title || 'YouTube Course',
      description: (item.snippet?.description || '').slice(0, 160),
      provider: 'YouTube',
      providerLogo: '▶️',
      url: `https://www.youtube.com/playlist?list=${item.id?.playlistId}`,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
      duration: 'Free',
      level: 'All Levels',
      tags: [query, 'video', 'free'],
      type: 'video',
    }))
  } catch (e) {
    console.warn('YouTube API error:', e)
    return []
  }
}

/**
 * Dev.to articles as readable resources (free, no key)
 */
export async function fetchDevToArticles(query) {
  try {
    const tag = query.toLowerCase().replace(/\s+/g, '')
    const res = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=6&top=7`)
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map(article => ({
      id: `devto-${article.id}`,
      title: article.title,
      description: (article.description || '').slice(0, 160),
      provider: 'Dev.to',
      providerLogo: '📝',
      url: article.url,
      thumbnail: article.cover_image || article.social_image || '',
      duration: `${article.reading_time_minutes || 5} min read`,
      level: 'All Levels',
      tags: [query, 'article', 'free', ...(article.tag_list || []).slice(0, 3)],
      type: 'article',
    }))
  } catch (e) {
    console.warn('Dev.to API error:', e)
    return []
  }
}

/**
 * Static curated courses from well-known free platforms
 * (freeCodeCamp, The Odin Project, MIT OCW, etc.)
 * These don't require API keys and are always available.
 */
const CURATED_COURSES = {
  html: [
    { id: 'fcc-html', title: 'Responsive Web Design', description: 'Learn HTML & CSS from scratch with freeCodeCamp. Build 5 projects to earn your certification.', provider: 'freeCodeCamp', providerLogo: '🏕️', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=600&q=80', duration: '300 hrs', level: 'Beginner', tags: ['html', 'css', 'free', 'certification'], type: 'course' },
    { id: 'odin-html', title: 'Foundations — HTML & CSS', description: 'The Odin Project: open-source full-stack curriculum starting from HTML basics.', provider: 'The Odin Project', providerLogo: '⚔️', url: 'https://www.theodinproject.com/paths/foundations', thumbnail: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['html', 'css', 'free'], type: 'course' },
    { id: 'mdn-html', title: 'HTML: HyperText Markup Language', description: 'Comprehensive HTML reference and learning guides from MDN Web Docs.', provider: 'MDN Web Docs', providerLogo: '🦊', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['html', 'reference', 'free'], type: 'docs' },
  ],
  css: [
    { id: 'fcc-css', title: 'CSS Flexbox & Grid Mastery', description: 'Master CSS layouts with freeCodeCamp exercises on Flexbox and CSS Grid.', provider: 'freeCodeCamp', providerLogo: '🏕️', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['css', 'flexbox', 'grid', 'free'], type: 'course' },
    { id: 'web-css', title: 'Learn CSS — web.dev', description: 'An evergreen CSS course from Google web.dev team — modules on selectors, layout, typography and more.', provider: 'web.dev (Google)', providerLogo: '🌐', url: 'https://web.dev/learn/css/', thumbnail: 'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=600&q=80', duration: 'Self-paced', level: 'Beginner–Intermediate', tags: ['css', 'free'], type: 'course' },
  ],
  python: [
    { id: 'fcc-python', title: 'Scientific Computing with Python', description: 'Build algorithms, debug code, and write professional Python — freeCodeCamp certification.', provider: 'freeCodeCamp', providerLogo: '🏕️', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80', duration: '40+ hrs', level: 'Beginner', tags: ['python', 'free', 'certification'], type: 'course' },
    { id: 'cs50p', title: 'CS50P — Python (Harvard)', description: 'Harvard University\'s free Python course. Functions, loops, OOP and testing.', provider: 'edX / Harvard', providerLogo: '🎓', url: 'https://cs50.harvard.edu/python/', thumbnail: 'https://images.unsplash.com/photo-1515879128292-c9abd8b14c56?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['python', 'free', 'harvard'], type: 'course' },
    { id: 'google-python', title: 'Google Python Class', description: 'Free Python class for people with a little programming experience by Google.', provider: 'Google', providerLogo: '🔵', url: 'https://developers.google.com/edu/python', thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&q=80', duration: '~8 hrs', level: 'Beginner–Intermediate', tags: ['python', 'free', 'google'], type: 'course' },
    { id: 'py-automate', title: 'Automate the Boring Stuff', description: 'Free online book & course on practical Python programming for total beginners.', provider: 'automate.org', providerLogo: '🐍', url: 'https://automatetheboringstuff.com/', thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['python', 'automation', 'free'], type: 'book' },
  ],
  sql: [
    { id: 'sqlzoo', title: 'SQLZoo Interactive Tutorial', description: 'Learn SQL with interactive exercises — SELECT, JOIN, SUM, GROUP BY and more.', provider: 'SQLZoo', providerLogo: '🐘', url: 'https://sqlzoo.net/', thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['sql', 'interactive', 'free'], type: 'interactive' },
    { id: 'fcc-db', title: 'Relational Database Certification', description: 'Learn SQL and relational databases by building a Mario database, a bike rental shop and more.', provider: 'freeCodeCamp', providerLogo: '🏕️', url: 'https://www.freecodecamp.org/learn/relational-database/', thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80', duration: '300 hrs', level: 'Beginner', tags: ['sql', 'postgresql', 'free', 'certification'], type: 'course' },
    { id: 'mode-sql', title: 'SQL Tutorial for Data Analysis', description: 'Mode Analytics free SQL school — perfect for data analysis.', provider: 'Mode Analytics', providerLogo: '📊', url: 'https://mode.com/sql-tutorial/', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80', duration: 'Self-paced', level: 'Beginner–Intermediate', tags: ['sql', 'data', 'free'], type: 'course' },
    { id: 'w3-sql', title: 'SQL Tutorial — W3Schools', description: 'Comprehensive SQL reference and tutorial with Try-It-Yourself editor.', provider: 'W3Schools', providerLogo: '🟢', url: 'https://www.w3schools.com/sql/', thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['sql', 'reference', 'free'], type: 'docs' },
  ],
  java: [
    { id: 'mooc-java', title: 'Java Programming (Mooc.fi)', description: 'University of Helsinki\'s free full Java course — 14 parts from basics to OOP.', provider: 'Mooc.fi / Helsinki', providerLogo: '🎓', url: 'https://java-programming.mooc.fi/', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80', duration: '150+ hrs', level: 'Beginner', tags: ['java', 'free', 'university'], type: 'course' },
    { id: 'jenkov-java', title: 'Java Tutorials — Jenkov', description: 'Comprehensive Java tutorials from basic syntax to advanced concurrency.', provider: 'Jenkov.com', providerLogo: '☕', url: 'https://jenkov.com/tutorials/java/index.html', thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&q=80', duration: 'Self-paced', level: 'All Levels', tags: ['java', 'free'], type: 'docs' },
    { id: 'fcc-java', title: 'Java Full Course for Beginners', description: 'freeCodeCamp\'s YouTube 12-hour Java full course covering all fundamentals.', provider: 'freeCodeCamp', providerLogo: '🏕️', url: 'https://www.youtube.com/watch?v=grEKMHGYyns', thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&q=80', duration: '12 hrs', level: 'Beginner', tags: ['java', 'video', 'free'], type: 'video' },
  ],
  javascript: [
    { id: 'fcc-js', title: 'JavaScript Algorithms & Data Structures', description: 'Comprehensive JS certification from freeCodeCamp — ES6, OOP, APIs and algorithm challenges.', provider: 'freeCodeCamp', providerLogo: '🏕️', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', thumbnail: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=600&q=80', duration: '300 hrs', level: 'Beginner', tags: ['javascript', 'free', 'certification'], type: 'course' },
    { id: 'js-info', title: 'The Modern JavaScript Tutorial', description: 'JavaScript.info: from basics to advanced topics with simple but detailed explanations.', provider: 'javascript.info', providerLogo: '📖', url: 'https://javascript.info/', thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&q=80', duration: 'Self-paced', level: 'All Levels', tags: ['javascript', 'free', 'reference'], type: 'docs' },
    { id: 'odin-js', title: 'JavaScript Path', description: 'The Odin Project full JavaScript curriculum with projects.', provider: 'The Odin Project', providerLogo: '⚔️', url: 'https://www.theodinproject.com/paths/full-stack-javascript', thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&q=80', duration: 'Self-paced', level: 'Beginner–Advanced', tags: ['javascript', 'free', 'project-based'], type: 'course' },
  ],
  web: [
    { id: 'cs50w', title: 'CS50W — Web Programming (Harvard)', description: 'Harvard\'s free web programming course: HTML, CSS, JS, Python, SQL, Django.', provider: 'edX / Harvard', providerLogo: '🎓', url: 'https://cs50.harvard.edu/web/', thumbnail: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&q=80', duration: 'Self-paced', level: 'Intermediate', tags: ['web', 'html', 'css', 'javascript', 'free'], type: 'course' },
    { id: 'fcc-web', title: 'Full-Stack Web Development', description: 'Complete path from HTML/CSS to APIs and databases with freeCodeCamp certifications.', provider: 'freeCodeCamp', providerLogo: '🏕️', url: 'https://www.freecodecamp.org/learn/', thumbnail: 'https://images.unsplash.com/photo-1603468620905-8de7d86b781e?w=600&q=80', duration: '1800+ hrs', level: 'Beginner–Advanced', tags: ['web', 'fullstack', 'free', 'certification'], type: 'course' },
    { id: 'odin-web', title: 'Foundations Path (Full Stack)', description: 'The Odin Project: open-source full-stack curriculum, project-based learning.', provider: 'The Odin Project', providerLogo: '⚔️', url: 'https://www.theodinproject.com/', thumbnail: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['web', 'html', 'css', 'javascript', 'free'], type: 'course' },
  ],
  dsa: [
    { id: 'cs50x', title: 'CS50x — Intro to CS (Harvard)', description: 'Harvard\'s legendary free intro-to-CS course covering algorithms, data structures and C.', provider: 'edX / Harvard', providerLogo: '🎓', url: 'https://cs50.harvard.edu/x/', thumbnail: 'https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7?w=600&q=80', duration: 'Self-paced', level: 'Beginner', tags: ['dsa', 'algorithms', 'c', 'free', 'harvard'], type: 'course' },
    { id: 'visualgo', title: 'VisuAlgo — Algorithm Visualizations', description: 'Visualise data structures & algorithms through animation. Ideal for learning and revision.', provider: 'VisuAlgo.net', providerLogo: '🔍', url: 'https://visualgo.net/', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80', duration: 'Self-paced', level: 'All Levels', tags: ['dsa', 'algorithms', 'visual', 'free'], type: 'interactive' },
  ],
}

/**
 * Main function: fetch courses for a given topic/query.
 * Returns curated + dev.to articles + YouTube (if key available).
 */
export async function fetchCourses(query = 'python') {
  const key = query.toLowerCase().replace(/[^a-z]/g, '')

  // 1. Curated static courses
  let curated = []
  for (const [topic, courses] of Object.entries(CURATED_COURSES)) {
    if (key.includes(topic) || topic.includes(key)) {
      curated = [...curated, ...courses]
    }
  }
  // Fallback: search all curated by title/tags
  if (curated.length === 0) {
    for (const courses of Object.values(CURATED_COURSES)) {
      curated = [
        ...curated,
        ...courses.filter(c =>
          c.title.toLowerCase().includes(key) ||
          c.tags.some(t => t.includes(key))
        ),
      ]
    }
  }

  // 2. Dev.to articles (free, no key, quick)
  const articles = await fetchDevToArticles(query)

  // 3. YouTube playlists (only if API key available)
  let ytCourses = []
  if (YT_KEY) {
    ytCourses = await fetchYouTubeCourses(query)
  }

  return [...curated, ...ytCourses, ...articles]
}

// ─── Per-course structured curriculum ───────────────────────────────────────
// Each key maps to a course id from CURATED_COURSES.
// Every lesson has: { id, title, type ('video'|'article'|'text'), videoId,
//   duration, description, free }
const COURSE_CURRICULUM = {
  'fcc-python': {
    overview: 'freeCodeCamp\'s Scientific Computing with Python certification. You\'ll build five projects to earn a verified certificate, covering everything from basic arithmetic to file manipulation and OOP.',
    instructor: 'freeCodeCamp Staff',
    modules: [
      {
        id: 'm1', title: 'Python Fundamentals',
        lessons: [
          { id: 'l1', title: 'Variables & Data Types', type: 'video', videoId: 'rfscVS0vtbw', duration: '4:26:52', free: true, description: 'Complete Python beginner crash course.' },
          { id: 'l2', title: 'Strings & String Methods', type: 'text', duration: '15 min', free: true, description: 'Working with Python strings, slicing, and built-in methods.' },
          { id: 'l3', title: 'Numbers, Arithmetic & Math', type: 'text', duration: '10 min', free: true, description: 'int, float, complex, operators and math module.' },
        ]
      },
      {
        id: 'm2', title: 'Control Flow',
        lessons: [
          { id: 'l4', title: 'If / Else Statements', type: 'video', videoId: 'DZwmZ8Usvnk', duration: '20 min', free: true, description: 'Conditional logic in Python.' },
          { id: 'l5', title: 'For Loops & While Loops', type: 'video', videoId: 'OnDr4J2UXSA', duration: '18 min', free: true, description: 'Iteration patterns and loop control.' },
          { id: 'l6', title: 'Functions & Scope', type: 'text', duration: '20 min', free: true, description: 'Defining functions, arguments, return values and variable scope.' },
        ]
      },
      {
        id: 'm3', title: 'Data Structures',
        lessons: [
          { id: 'l7', title: 'Lists', type: 'video', videoId: 'W8KRzm-HUcc', duration: '15 min', free: true, description: 'Creating, indexing, slicing and mutating Python lists.' },
          { id: 'l8', title: 'Dictionaries & Sets', type: 'text', duration: '15 min', free: true, description: 'Key-value storage, set operations and use cases.' },
          { id: 'l9', title: 'Tuples & Comprehensions', type: 'text', duration: '12 min', free: true, description: 'Immutable sequences and expressive comprehension syntax.' },
        ]
      },
      {
        id: 'm4', title: 'Object-Oriented Python',
        lessons: [
          { id: 'l10', title: 'Classes & Objects', type: 'video', videoId: 'ZDa-Z5JzLYM', duration: '40 min', free: true, description: 'OOP fundamentals: classes, instances, __init__ and methods.' },
          { id: 'l11', title: 'Inheritance & Polymorphism', type: 'text', duration: '20 min', free: true, description: 'Extending classes and overriding methods.' },
          { id: 'l12', title: 'File I/O & Exceptions', type: 'text', duration: '18 min', free: true, description: 'Reading/writing files, try/except error handling.' },
        ]
      },
    ]
  },
  'cs50p': {
    overview: 'Harvard\'s CS50P — Introduction to Programming with Python. Taught by David Malan, this is arguably the best free Python course online.',
    instructor: 'David J. Malan — Harvard University',
    modules: [
      {
        id: 'm1', title: 'Week 0 – Functions, Variables',
        lessons: [
          { id: 'l1', title: 'Lecture 0: Functions & Variables', type: 'video', videoId: 'JP7ITIXGpHk', duration: '2 hrs', free: true, description: 'First lecture of CS50P — expressions, functions, variables.' },
          { id: 'l2', title: 'Problem Set 0', type: 'text', duration: '30 min', free: true, description: 'Indoor voice, Playback speed and Making faces.' },
        ]
      },
      {
        id: 'm2', title: 'Week 1 – Conditionals',
        lessons: [
          { id: 'l3', title: 'Lecture 1: Conditionals', type: 'video', videoId: 'z3h7LkGJyB8', duration: '2 hrs', free: true, description: 'if / elif / else, match statements.' },
          { id: 'l4', title: 'Problem Set 1', type: 'text', duration: '45 min', free: true, description: 'Challenges: Deep Thought, Home Federal Savings Bank, File Extensions, Math Interpreter, Meal Time.' },
        ]
      },
      {
        id: 'm3', title: 'Week 4 – Libraries',
        lessons: [
          { id: 'l5', title: 'Lecture 4: Libraries', type: 'video', videoId: 'MztLZWibctI', duration: '2 hrs', free: true, description: 'import, packages, APIs and custom libraries.' },
        ]
      },
    ]
  },
  'fcc-html': {
    overview: 'Build a fully responsive portfolio, tribute page, survey form and more with pure HTML & CSS. freeCodeCamp\'s most popular certification.',
    instructor: 'freeCodeCamp Community',
    modules: [
      {
        id: 'm1', title: 'Introduction to HTML',
        lessons: [
          { id: 'l1', title: 'HTML Crash Course', type: 'video', videoId: 'pQN-pnXPaVg', duration: '1:11:33', free: true, description: 'Complete HTML crash course for beginners.' },
          { id: 'l2', title: 'HTML Document Structure', type: 'text', duration: '10 min', free: true, description: 'DOCTYPE, html, head and body elements explained.' },
          { id: 'l3', title: 'Headings, Paragraphs & Links', type: 'text', duration: '10 min', free: true, description: 'h1-h6, p, a and href fundamentals.' },
        ]
      },
      {
        id: 'm2', title: 'HTML Forms & Media',
        lessons: [
          { id: 'l4', title: 'HTML Forms Masterclass', type: 'video', videoId: 'fNcJuPIZ2WE', duration: '45 min', free: true, description: 'form, input types, labels, select, textarea and validation.' },
          { id: 'l5', title: 'Images, Audio & Video', type: 'text', duration: '12 min', free: true, description: 'img, figure, audio, video and accessibility attributes.' },
        ]
      },
      {
        id: 'm3', title: 'Semantic HTML',
        lessons: [
          { id: 'l6', title: 'Semantic HTML5 Elements', type: 'video', videoId: 'kGW8Al_cga4', duration: '20 min', free: true, description: 'header, nav, main, section, article, aside, footer.' },
          { id: 'l7', title: 'Accessibility Basics', type: 'text', duration: '15 min', free: true, description: 'ARIA roles, alt text, labels and screen reader tips.' },
        ]
      },
    ]
  },
  'fcc-css': {
    overview: 'Master CSS from the box model to advanced Flexbox & Grid layouts. Part of freeCodeCamp\'s Responsive Web Design certification.',
    instructor: 'freeCodeCamp Community',
    modules: [
      {
        id: 'm1', title: 'CSS Fundamentals',
        lessons: [
          { id: 'l1', title: 'CSS Full Course', type: 'video', videoId: 'OXGznpKZ_sA', duration: '11:00:00', free: true, description: 'Complete CSS course — selectors, colours, fonts, box model and more.' },
          { id: 'l2', title: 'Selectors & Specificity', type: 'text', duration: '12 min', free: true, description: 'Class, ID, attribute, pseudo-class and pseudo-element selectors.' },
        ]
      },
      {
        id: 'm2', title: 'Flexbox',
        lessons: [
          { id: 'l3', title: 'Flexbox in 20 Minutes', type: 'video', videoId: 'JJSoEo8JSnc', duration: '20 min', free: true, description: 'flex-direction, justify-content, align-items, flex-wrap and more.' },
          { id: 'l4', title: 'Flexbox Cheat Sheet', type: 'text', duration: '10 min', free: true, description: 'Quick reference guide for all Flexbox properties with examples.' },
        ]
      },
      {
        id: 'm3', title: 'CSS Grid',
        lessons: [
          { id: 'l5', title: 'CSS Grid in 45 Minutes', type: 'video', videoId: 'EFafSYg-PkI', duration: '45 min', free: true, description: 'grid-template, gap, grid areas, auto-fill and auto-fit.' },
          { id: 'l6', title: 'Responsive Design & Media Queries', type: 'video', videoId: 'srvUrASNj0s', duration: '38 min', free: true, description: 'Mobile-first design, breakpoints and responsive images.' },
        ]
      },
    ]
  },
  'fcc-js': {
    overview: 'The most comprehensive free JavaScript curriculum: ES6+, functional programming, OOP, and 30 algorithm challenges.',
    instructor: 'freeCodeCamp Community',
    modules: [
      {
        id: 'm1', title: 'JavaScript Basics',
        lessons: [
          { id: 'l1', title: 'JS Full Course for Beginners', type: 'video', videoId: 'PkZNo7MFNFg', duration: '3:26:42', free: true, description: 'Comprehensive beginner JavaScript course by freeCodeCamp.' },
          { id: 'l2', title: 'Variables (var/let/const)', type: 'text', duration: '10 min', free: true, description: 'Differences between var, let and const, hoisting.' },
          { id: 'l3', title: 'Arrays & Array Methods', type: 'text', duration: '15 min', free: true, description: 'map, filter, reduce, forEach and more.' },
        ]
      },
      {
        id: 'm2', title: 'ES6+ Modern JavaScript',
        lessons: [
          { id: 'l4', title: 'ES6 Full Tutorial', type: 'video', videoId: 'NCwa_xi0Uuc', duration: '1 hr', free: true, description: 'Arrow functions, destructuring, spread/rest, modules, Promises.' },
          { id: 'l5', title: 'Async/Await & Promises', type: 'text', duration: '20 min', free: true, description: 'Asynchronous JavaScript — fetch API, Promises, async/await.' },
        ]
      },
      {
        id: 'm3', title: 'DOM & Events',
        lessons: [
          { id: 'l6', title: 'DOM Manipulation Crash Course', type: 'video', videoId: '5fb2aPlgoys', duration: '1:45:00', free: true, description: 'querySelector, createElement, event listeners and dynamic UIs.' },
          { id: 'l7', title: 'Event Bubbling & Delegation', type: 'text', duration: '12 min', free: true, description: 'How events propagate and efficient listener patterns.' },
        ]
      },
    ]
  },
  'sqlzoo': {
    overview: 'Learn SQL interactively with real queries. SQLZoo covers SELECT, JOINs, GROUP BY, subqueries and advanced window functions.',
    instructor: 'SQLZoo Community',
    modules: [
      {
        id: 'm1', title: 'SELECT Basics',
        lessons: [
          { id: 'l1', title: 'SQL for Beginners', type: 'video', videoId: 'HXV3zeQKqGY', duration: '3:09:22', free: true, description: 'Complete SQL beginner course covering all core statements.' },
          { id: 'l2', title: 'SELECT & WHERE', type: 'text', duration: '10 min', free: true, description: 'Fetching rows with conditions, comparison and logical operators.' },
          { id: 'l3', title: 'ORDER BY & LIMIT', type: 'text', duration: '8 min', free: true, description: 'Sorting results, LIMIT and OFFSET pagination.' },
        ]
      },
      {
        id: 'm2', title: 'Aggregations & Groups',
        lessons: [
          { id: 'l4', title: 'GROUP BY & Aggregate Functions', type: 'video', videoId: 'qyTdxshQ52w', duration: '30 min', free: true, description: 'COUNT, SUM, AVG, MIN, MAX with GROUP BY and HAVING.' },
          { id: 'l5', title: 'HAVING vs WHERE', type: 'text', duration: '10 min', free: true, description: 'Filtering grouped results vs individual rows.' },
        ]
      },
      {
        id: 'm3', title: 'JOINs',
        lessons: [
          { id: 'l6', title: 'SQL JOINs Explained', type: 'video', videoId: '9yeOJ0ZMUYw', duration: '45 min', free: true, description: 'INNER, LEFT, RIGHT and FULL JOIN with practical examples.' },
          { id: 'l7', title: 'Subqueries & CTEs', type: 'text', duration: '18 min', free: true, description: 'Nested queries, WITH clauses and when to use each.' },
        ]
      },
    ]
  },
  'mooc-java': {
    overview: 'University of Helsinki\'s full Java course — 14 parts, from Hello World to full OOP and graphical UIs. Completely free, certificate included.',
    instructor: 'University of Helsinki',
    modules: [
      {
        id: 'm1', title: 'Part 1 – Getting Started',
        lessons: [
          { id: 'l1', title: 'Java Full Course for Beginners', type: 'video', videoId: 'grEKMHGYyns', duration: '12:00:00', free: true, description: 'freeCodeCamp 12-hour complete Java course covering all fundamentals.' },
          { id: 'l2', title: 'Hello World & Printing', type: 'text', duration: '10 min', free: true, description: 'Your first Java program, System.out.println and basic syntax.' },
          { id: 'l3', title: 'Variables & Types', type: 'text', duration: '15 min', free: true, description: 'int, double, String, boolean — declaring and assigning variables.' },
        ]
      },
      {
        id: 'm2', title: 'Part 2 – Repetition & Methods',
        lessons: [
          { id: 'l4', title: 'Methods in Java', type: 'video', videoId: 'Hl-zzrqQoSE', duration: '1 hr', free: true, description: 'Defining, calling and returning values from methods.' },
          { id: 'l5', title: 'Loops', type: 'text', duration: '15 min', free: true, description: 'while, for and do-while loops with practical exercises.' },
        ]
      },
      {
        id: 'm3', title: 'Part 4 – OOP Basics',
        lessons: [
          { id: 'l6', title: 'Classes & Objects', type: 'video', videoId: 'IUqKuGNasdM', duration: '1:30:00', free: true, description: 'Defining classes, constructors, instance methods and encapsulation.' },
          { id: 'l7', title: 'Lists & ArrayLists', type: 'text', duration: '20 min', free: true, description: 'Java ArrayList, generic types and common list operations.' },
        ]
      },
    ]
  },
  'cs50x': {
    overview: 'Harvard\'s legendary CS50x covers C, algorithms, data structures, Python, SQL, HTML, CSS and JavaScript — all in one free course.',
    instructor: 'David J. Malan — Harvard University',
    modules: [
      {
        id: 'm1', title: 'Week 0 – Scratch',
        lessons: [
          { id: 'l1', title: 'CS50x Lecture 0', type: 'video', videoId: 'ytpJdnlu9ug', duration: '2 hrs', free: true, description: 'Lecture 0 — binary, ASCII, algorithms visualised with Scratch.' },
        ]
      },
      {
        id: 'm2', title: 'Week 3 – Algorithms',
        lessons: [
          { id: 'l2', title: 'CS50x Lecture 3: Algorithms', type: 'video', videoId: 'fykrlqbV9wM', duration: '2 hrs', free: true, description: 'Big-O notation, linear search, binary search, bubble/merge sort.' },
          { id: 'l3', title: 'Algorithm Analysis Notes', type: 'text', duration: '20 min', free: true, description: 'Time & space complexity, best/worst/average cases.' },
        ]
      },
      {
        id: 'm3', title: 'Week 5 – Data Structures',
        lessons: [
          { id: 'l4', title: 'CS50x Lecture 5: Data Structures', type: 'video', videoId: '2T-A_GFuoTo', duration: '2 hrs', free: true, description: 'Linked lists, trees, hash tables, tries and queues/stacks.' },
          { id: 'l5', title: 'DSA Cheat Sheet', type: 'text', duration: '15 min', free: true, description: 'Complexity summary table for 15 common data structures.' },
        ]
      },
    ]
  },
}

/**
 * Get a single course by id
 */
export function getCourseById(id) {
  for (const courses of Object.values(CURATED_COURSES)) {
    const found = courses.find(c => c.id === id)
    if (found) return found
  }
  return null
}

/**
 * Get structured curriculum for a course (modules + lessons)
 * Falls back to a generic structure if no curriculum exists.
 */
export function getCourseCurriculum(courseId) {
  if (COURSE_CURRICULUM[courseId]) return COURSE_CURRICULUM[courseId]
  // Generic fallback
  const course = getCourseById(courseId)
  return {
    overview: course?.description || 'No overview available.',
    instructor: course?.provider || 'Community',
    modules: [
      {
        id: 'm1', title: 'Getting Started',
        lessons: [
          { id: 'l1', title: course?.title || 'Introduction', type: 'text', duration: course?.duration || 'Self-paced', free: true, description: course?.description || '' },
        ]
      }
    ]
  }
}

/**
 * Returns all available topics/categories
 */
export const COURSE_TOPICS = [
  { id: 'all',        label: 'All',         icon: '🌐' },
  { id: 'python',     label: 'Python',      icon: '🐍' },
  { id: 'sql',        label: 'SQL',         icon: '🗄️' },
  { id: 'html',       label: 'HTML',        icon: '🏗️' },
  { id: 'css',        label: 'CSS',         icon: '🎨' },
  { id: 'javascript', label: 'JavaScript',  icon: '⚡' },
  { id: 'java',       label: 'Java',        icon: '☕' },
  { id: 'web',        label: 'Web Dev',     icon: '🌍' },
  { id: 'dsa',        label: 'DSA',         icon: '🧩' },
]

export function getAllCuratedCourses() {
  const all = []
  for (const courses of Object.values(CURATED_COURSES)) all.push(...courses)
  return all
}

// ─── AI-Powered Lesson Content Generation ────────────────────────────────────
// Uses the Gemini API (free tier) to generate textual lesson content.
// Falls back to a well-structured static template if the API is unavailable.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

/**
 * Generate lesson content for a given topic and lesson title using Gemini AI.
 * Returns markdown-formatted text.
 *
 * @param {string} topic  - Course topic (e.g. "Python", "SQL")
 * @param {string} lessonTitle - The lesson name (e.g. "Functions & Scope")
 * @returns {Promise<string>} Markdown content
 */
export async function generateLessonContent(topic, lessonTitle) {
  const prompt = `You are an expert programming tutor. Write a clear, concise lesson about "${lessonTitle}" for a "${topic}" course.

Format your response in Markdown with:
1. A level-2 heading (## ${lessonTitle})
2. A short introduction paragraph (2-3 sentences)
3. Key concepts explained with bullet points
4. At least one practical code example in a fenced code block (\`\`\`${topic.toLowerCase()})
5. A "Key Takeaways" section at the end (3-4 bullet points)

Keep it beginner-friendly, under 500 words, and practical. No preamble or meta-commentary.`

  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      })
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch (e) {
      console.warn('Gemini API error:', e)
    }
  }

  // Fallback: rich static template
  return generateStaticLessonContent(topic, lessonTitle)
}

/**
 * Generate a well-structured static lesson as a fallback when AI is unavailable.
 */
function generateStaticLessonContent(topic, lessonTitle) {
  const topicLower = topic.toLowerCase()
  const codeExamples = {
    python: `# Example: ${lessonTitle}
x = 42
print(f"Value: {x}")
# More complex example
def example_function(param):
    return param * 2

result = example_function(x)
print(result)  # Output: 84`,
    java: `// Example: ${lessonTitle}
public class Example {
    public static void main(String[] args) {
        int x = 42;
        System.out.println("Value: " + x);
        System.out.println("Doubled: " + doubleIt(x));
    }
    
    static int doubleIt(int n) {
        return n * 2;
    }
}`,
    sql: `-- Example: ${lessonTitle}
SELECT column1, column2
FROM table_name
WHERE condition = 'value'
ORDER BY column1 ASC;

-- With aggregation
SELECT department, COUNT(*) as total, AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;`,
    javascript: `// Example: ${lessonTitle}
const value = 42;
const double = (n) => n * 2;

console.log(double(value)); // 84

// Modern arrow function with template literal
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("World"));`,
  }

  const codeBlock = codeExamples[topicLower] || `// ${lessonTitle} example in ${topic}
// Code example will appear here
// Practice writing code related to ${lessonTitle}`

  return `## ${lessonTitle}

This lesson covers the fundamentals of **${lessonTitle}** — a core concept in ${topic} programming.

### What You'll Learn
- The purpose and use cases of ${lessonTitle}
- Syntax and basic patterns
- Common pitfalls and best practices

### Core Concepts

**Definition:** ${lessonTitle} refers to the mechanism in ${topic} that allows you to structure and organize your code effectively.

**Why it matters:** Understanding ${lessonTitle} is essential for writing clean, maintainable ${topic} code. It is used in virtually every real-world ${topic} program.

### Code Example

\`\`\`${topicLower}
${codeBlock}
\`\`\`

### Common Patterns

- Always follow language conventions when using ${lessonTitle}
- Keep related logic grouped together for readability
- Test edge cases: empty input, null values, and boundary conditions
- Use meaningful names that communicate intent

### Key Takeaways
- **${lessonTitle}** is a foundational concept in ${topic}
- Practice by rewriting simple examples from scratch
- Experiment with the code above — change values and observe results
- Look up the official ${topic} documentation for deeper coverage

> 💡 **Tip:** The best way to learn ${lessonTitle} is to use it in a small project immediately after this lesson.`
}
