import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { SCHEDULED_EXAM_CONFIG, EXAM_STATUS } from '../config/categories';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiCalendar, FiClock, FiFileText, FiUsers, FiArrowRight, FiChevronLeft, FiChevronRight, FiCheckCircle, FiTrendingUp, FiZap, FiHome } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ScheduledExams = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const response = await fetch(`${API_URL}/exams/scheduled`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const data = await response.json();
      
      if (data.success) {
        const now = new Date();
        const updatedExams = (data.data || []).map(exam => {
          const startTime = new Date(exam.startTime);
          const endTime = new Date(exam.endTime);
          
          let status = exam.status;
          if (now < startTime) {
            status = EXAM_STATUS.UPCOMING;
          } else if (now >= startTime && now <= endTime) {
            status = EXAM_STATUS.LIVE;
          } else {
            status = EXAM_STATUS.COMPLETED;
          }
          
          return { ...exam, status };
        });
        
        setExams(updatedExams);
      } else {
        setError(data.error || 'Failed to load exams');
        setExams([]);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to connect to server. Please try again.');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => {
    if (activeTab !== 'all' && exam.status !== activeTab) return false;
    if (selectedCategory !== 'all' && exam.category !== selectedCategory) return false;
    return true;
  });

  const liveExams = exams.filter(e => e.status === EXAM_STATUS.LIVE);
  const upcomingExams = exams.filter(e => e.status === EXAM_STATUS.UPCOMING);
  const completedExams = exams.filter(e => e.status === EXAM_STATUS.COMPLETED);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTimeUntilExam = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return { hours: String(hours).padStart(2, '0'), minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0') };
  };

  const handleExamClick = (exam) => {
    if (exam.status === EXAM_STATUS.LIVE) {
      navigate(`/exam/${exam.id}/waiting-room`);
    } else if (exam.status === EXAM_STATUS.COMPLETED) {
      navigate(`/exam/${exam.id}/leaderboard`);
    } else {
      navigate(`/exam/${exam.id}/waiting-room`);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getMonthName = (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));

  const examDates = exams.map(e => {
    const d = new Date(e.startTime);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  });

  const today = new Date();
  const isToday = (day) => today.getDate() === day && today.getMonth() === calendarMonth.getMonth() && today.getFullYear() === calendarMonth.getFullYear();
  const hasExam = (day) => examDates.includes(`${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}-${day}`);

  if (loading) return <LoadingSpinner />;

  const tabCounts = {
    all: exams.length,
    [EXAM_STATUS.LIVE]: liveExams.length,
    [EXAM_STATUS.UPCOMING]: upcomingExams.length,
    [EXAM_STATUS.COMPLETED]: completedExams.length
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white">My Exam Schedule</h1>
              <p className="text-gray-400 mt-1">Manage your upcoming exams and view your results.</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2.5 bg-[#111d2e] border border-gray-700/50 text-gray-300 rounded-xl hover:bg-[#162435] transition-colors text-sm font-medium">
              <FiHome className="w-4 h-4" /> Dashboard
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-[#111d2e] p-1.5 rounded-xl border border-gray-700/30">
              {[
                { id: 'all', label: 'All' },
                { id: EXAM_STATUS.LIVE, label: 'Live' },
                { id: EXAM_STATUS.UPCOMING, label: 'Upcoming' },
                { id: EXAM_STATUS.COMPLETED, label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label} {tabCounts[tab.id] > 0 && <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700'}`}>{tabCounts[tab.id]}</span>}
                </button>
              ))}
            </motion.div>

            {/* Live Exam Hero Card */}
            {liveExams.length > 0 && (activeTab === 'all' || activeTab === EXAM_STATUS.LIVE) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                {liveExams.map(exam => {
                  const timeObj = getTimeUntilExam(exam.endTime);
                  return (
                    <div key={exam.id} className="relative bg-gradient-to-br from-[#0f2b1e] to-[#111d2e] rounded-2xl p-6 border border-green-500/30 overflow-hidden cursor-pointer group" onClick={() => handleExamClick(exam)}>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold animate-pulse">
                            <span className="w-2 h-2 bg-green-400 rounded-full" /> LIVE NOW
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{exam.title}</h2>
                        <div className="flex items-center gap-3 text-gray-400 text-sm mb-5">
                          <span className="flex items-center gap-1"><FiFileText className="w-3.5 h-3.5" /> {exam.subject || exam.categoryName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" /> {exam.durationMinutes} mins</span>
                        </div>

                        {/* Countdown */}
                        <div className="mb-5">
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Closes In</p>
                          <div className="flex gap-2">
                            {typeof timeObj === 'object' && timeObj ? (
                              <>
                                {[{ v: timeObj.hours, l: 'HRS' }, { v: timeObj.minutes, l: 'MIN' }, { v: timeObj.seconds, l: 'SEC' }].map((t, idx) => (
                                  <div key={idx} className="bg-[#0a1628] border border-gray-700/50 rounded-xl px-4 py-2.5 text-center min-w-[60px]">
                                    <div className="text-xl font-bold text-white font-mono">{t.v}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t.l}</div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <span className="text-white font-semibold">{timeObj || 'Ending soon'}</span>
                            )}
                          </div>
                        </div>

                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 group-hover:shadow-green-600/30">
                          Join Exam <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Upcoming / All Exams */}
            <div className="space-y-3">
              {(activeTab === 'all' || activeTab === EXAM_STATUS.UPCOMING) && upcomingExams.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Next Up</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {upcomingExams.map((exam, idx) => {
                      const timeStr = getTimeUntilExam(exam.startTime);
                      return (
                        <motion.div
                          key={exam.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + idx * 0.05 }}
                          onClick={() => handleExamClick(exam)}
                          className="bg-[#111d2e] rounded-xl p-5 border border-gray-700/30 hover:border-blue-500/40 cursor-pointer transition-all group hover:bg-[#131f32]"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                              <FiFileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <button className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-500 transition-colors">
                              <FiCalendar className="w-4 h-4" />
                            </button>
                          </div>
                          <h4 className="text-white font-semibold mb-1 group-hover:text-blue-300 transition-colors">{exam.title}</h4>
                          <p className="text-gray-500 text-sm mb-3">Starts {formatDate(exam.startTime)}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> {exam.durationMinutes}m</span>
                              <span className="flex items-center gap-1"><FiFileText className="w-3 h-3" /> {exam.questionCount}Q</span>
                            </div>
                            <span className="text-xs text-blue-400 font-medium">Details &rsaquo;</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Completed Exams */}
              {(activeTab === 'all' || activeTab === EXAM_STATUS.COMPLETED) && completedExams.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-4">Completed</h3>
                  <div className="space-y-2">
                    {completedExams.map((exam, idx) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.03 }}
                        onClick={() => handleExamClick(exam)}
                        className="bg-[#111d2e] rounded-xl p-4 border border-gray-700/30 hover:border-gray-600/50 cursor-pointer transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gray-700/30 flex items-center justify-center flex-shrink-0">
                            <FiCheckCircle className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-white font-medium truncate">{exam.title}</h4>
                            <p className="text-gray-500 text-xs">{formatDate(exam.startTime)} • {exam.durationMinutes}m • {exam.questionCount}Q</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap">View Leaderboard &rsaquo;</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Empty State */}
            {filteredExams.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 bg-[#111d2e] rounded-2xl border border-gray-700/30">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-700/30 flex items-center justify-center">
                  <FiCalendar className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No exams found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Check back later for scheduled exams or try changing your filters.</p>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Calendar Widget */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">{getMonthName(calendarMonth)}</h3>
                <div className="flex gap-1">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 transition-colors"><FiChevronLeft className="w-4 h-4" /></button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 transition-colors"><FiChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-xs text-gray-500 font-medium py-1">{d}</div>
                ))}
                {Array.from({ length: getFirstDayOfMonth(calendarMonth) }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(calendarMonth) }).map((_, i) => {
                  const day = i + 1;
                  return (
                    <div key={day} className={`
                      relative w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-default mx-auto
                      ${isToday(day) ? 'bg-blue-600 text-white font-bold' : hasExam(day) ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:bg-gray-700/30'}
                    `}>
                      {day}
                      {hasExam(day) && !isToday(day) && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Monthly Summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
              <h3 className="text-white font-bold text-sm mb-4">Monthly Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <FiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Completed</p>
                    <p className="text-white font-bold text-lg">{completedExams.length} Exams</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <FiTrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Average Score</p>
                    <p className="text-white font-bold text-lg">--</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Practice CTA */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 rounded-2xl p-5 border border-blue-500/20">
              <h3 className="text-white font-bold mb-1">Need extra practice?</h3>
              <p className="text-gray-400 text-sm mb-4">Take a quick practice test to warm up before your exams.</p>
              <button onClick={() => navigate('/daily-practice')} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 transition-colors">
                Start Practice
              </button>
            </motion.div>

            {/* Category Filters */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
              <h3 className="text-white font-bold text-sm mb-3">Filter by Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                >
                  All
                </button>
                {SCHEDULED_EXAM_CONFIG.categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                    }`}
                  >
                    <span>{cat.icon}</span> {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <FiZap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">About Scheduled Exams</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Scheduled exams are competitive tests with live rankings. Most exams are proctored with camera 
                and microphone monitoring. Make sure to join exactly at the scheduled time — late joiners may 
                not be allowed to participate.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ScheduledExams;
