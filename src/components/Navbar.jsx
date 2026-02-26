import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { getInitials, getAvatarColor } from '../utils/helpers'
import { useState, useRef, useEffect } from 'react'

// Admin email
const ADMIN_EMAIL = 'nityanand666.nk@gmail.com'

const NAV_LINKS = [
  { path: '/dashboard',   label: 'Dashboard',   icon: 'grid_view' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'emoji_events' },
  { path: '/courses',     label: 'Courses',     icon: 'menu_book' },
  { path: '/interview',   label: 'Interview',   icon: 'videocam' },
  { path: '/suggestions', label: 'Suggestions', icon: 'lightbulb' },
  { path: '/profile',     label: 'Profile',     icon: 'person' },
]

/**
 * Navbar Component — Glassmorphism floating sidebar
 * upcomingExams prop: array of upcoming exam objects (from Dashboard)
 */
const Navbar = ({ upcomingExams = [] }) => {
  const { currentUser, userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const { notifications, clearNotifications } = useSocket()
  const unreadCount = notifications.filter(n => !n.read).length

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const isAdmin = currentUser?.email === ADMIN_EMAIL
  const links = isAdmin
    ? [...NAV_LINKS, { path: '/admin', label: 'Admin', icon: 'admin_panel_settings' }]
    : NAV_LINKS

  const handleLogout = async () => {
    try { await logout(); navigate('/login') } catch (e) { console.error(e) }
  }

  const isActive = (path) => location.pathname === path

  // Countdown widget for next upcoming exam
  const nextExam = upcomingExams[0]
  let days = 0, hours = 0, mins = 0
  if (nextExam) {
    const diff = Math.max(0, new Date(nextExam.startTime) - new Date())
    days = Math.floor(diff / (1000 * 60 * 60 * 24))
    hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  }

  const sidebarContent = (
    <>
      {/* Logo + Bell */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
            <span className="material-symbols-outlined text-white text-2xl">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-xl font-bold tracking-tight">DailyQ</h1>
            <p className="text-slate-400 text-[10px] font-medium tracking-widest uppercase">Learning Platform</p>
          </div>
        </Link>
        {/* Notification bell (desktop sidebar) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-[#1e1e3a] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-white font-semibold text-sm">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="text-xs text-slate-400 hover:text-white transition-colors">Clear all</button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">No notifications yet</div>
                ) : (
                  notifications.slice().reverse().map((n, i) => (
                    <div key={i} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                      <p className="text-slate-200 text-xs leading-relaxed">{n.message || JSON.stringify(n)}</p>
                      <p className="text-slate-500 text-[10px] mt-1">{n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : ''}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-1 px-3 flex flex-col gap-0.5 dq-scrollbar">
        {links.map((link) => (
          <Link
            key={link.path + link.label}
            to={link.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive(link.path)
                ? 'bg-gradient-to-r from-purple-500/20 to-transparent text-white border-l-[3px] border-purple-500 pl-3 pr-4 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent pl-3 pr-4'
              }`}
          >
            <span className={`material-symbols-outlined text-[20px] flex-shrink-0 transition-colors
              ${isActive(link.path) ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
              {link.icon}
            </span>
            <span>{link.label}</span>
          </Link>
        ))}

        {/* Upcoming Exam Countdown Widget */}
        {nextExam && (
          <div className="mt-4 mx-1 p-4 rounded-xl bg-gradient-to-b from-purple-600/80 to-purple-900 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-white font-bold text-xs mb-3 relative z-10">Exam Starts In</h3>
            <div className="bg-white/10 rounded-lg p-2 flex justify-center gap-1 mb-3 backdrop-blur-sm relative z-10">
              {[{ v: String(days).padStart(2,'0'), l: 'Days' }, { v: String(hours).padStart(2,'0'), l: 'Hours' }, { v: String(mins).padStart(2,'0'), l: 'Mins' }].map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-white font-bold text-sm mb-3">:</span>}
                  <div className="flex flex-col items-center">
                    <div className="bg-purple-900/50 rounded p-1 w-8 h-8 flex items-center justify-center border border-white/10">
                      <span className="text-white font-bold text-sm">{item.v}</span>
                    </div>
                    <span className="text-[9px] text-purple-200 mt-1">{item.l}</span>
                  </div>
                </div>
              ))}
            </div>
            <span className="relative z-10 text-3xl">📚</span>
          </div>
        )}
      </nav>

      {/* User profile footer */}
      <div className="p-3 mx-1 mb-2 flex-shrink-0">
        <div className="dq-glass-card rounded-2xl p-3 flex items-center justify-between group hover:bg-white/5 transition-colors">
          <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setMobileOpen(false)}>
            <div className="relative flex-shrink-0">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/10 ${getAvatarColor(userProfile?.name)}`}>
                  {getInitials(userProfile?.name)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1e293b] rounded-full" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-bold text-white truncate">{userProfile?.name?.split(' ')[0] || 'User'}</span>
              <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">
                {userProfile?.role === 'admin' ? 'Admin' : 'Pro'}
              </span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop Floating Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-[280px] dq-glass-panel fixed left-4 top-4 bottom-4 z-50 rounded-3xl overflow-hidden">
        {sidebarContent}
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 dq-glass-panel">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="material-symbols-outlined text-white text-lg">school</span>
          </div>
          <span className="text-white font-bold text-base tracking-tight">DailyQ</span>
        </Link>
        <div className="flex items-center gap-2">
          {userProfile?.streak > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold">
              🔥 {userProfile.streak}
            </span>
          )}
          {/* Notification bell (mobile) */}
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-10 h-10 rounded-xl dq-glass-card flex items-center justify-center text-slate-300"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-10 h-10 rounded-xl dq-glass-card flex items-center justify-center text-slate-300"
          >
            <span className="material-symbols-outlined text-[22px]">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile notification dropdown */}
      {notifOpen && (
        <div ref={notifRef} className="lg:hidden fixed top-16 right-4 z-[200] w-80 bg-[#1e1e3a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clearNotifications} className="text-xs text-slate-400 hover:text-white transition-colors">Clear all</button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No notifications yet</div>
            ) : (
              notifications.slice().reverse().map((n, i) => (
                <div key={i} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <p className="text-slate-200 text-xs leading-relaxed">{n.message || JSON.stringify(n)}</p>
                  <p className="text-slate-500 text-[10px] mt-1">{n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : ''}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Backdrop ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] dq-glass-panel flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export default Navbar
