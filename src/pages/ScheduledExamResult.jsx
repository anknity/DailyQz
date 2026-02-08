import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FiCheck, FiX, FiClock, FiTarget, FiTrendingUp, FiBarChart2,
  FiHome, FiAward, FiEye, FiChevronDown, FiChevronUp, FiShare2, FiRefreshCw
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ScheduledExamResult = () => {
  const { examId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showSolutions, setShowSolutions] = useState(false);
  const [avgScore, setAvgScore] = useState(0);
  const [topperScore, setTopperScore] = useState(0);

  useEffect(() => {
    if (location.state?.result) {
      const stateResult = location.state.result;
      setResult(stateResult);
      if (location.state.questions?.length > 0) setQuestions(location.state.questions);
      if (location.state.answers) setAnswers(location.state.answers);
      setLoading(false);
      fetchResultFromAPI(false);
    } else {
      fetchResultFromAPI(true);
    }
  }, [examId]);

  const fetchResultFromAPI = async (showLoading) => {
    if (showLoading) setLoading(true);
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${API_URL}/exams/scheduled/${examId}/result`, { headers });
      const data = await response.json();
      if (data.success) {
        setResult(prev => ({ ...prev, ...data.data, score: data.data.score || data.data.correctAnswers, totalQuestions: data.data.totalQuestions, percentage: data.data.percentage, rank: data.data.rank, totalParticipants: data.data.totalParticipants, timeTaken: data.data.timeTaken, correctAnswers: data.data.correctAnswers, wrongAnswers: data.data.wrongAnswers, unanswered: data.data.unanswered || 0 }));
        setAvgScore(data.data.avgScore || 0);
        setTopperScore(data.data.topperScore || 0);
        if (data.data.questions?.length > 0) setQuestions(data.data.questions);
        if (data.data.userAnswers) setAnswers(prev => ({ ...prev, ...data.data.userAnswers }));
      } else if (showLoading) navigate('/exams');
    } catch (error) {
      console.error('Error fetching result:', error);
      if (showLoading) navigate('/exams');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const formatTime = (seconds) => { if (!seconds) return '0m 0s'; return `${Math.floor(seconds / 60)}m ${seconds % 60}s` };
  const getUserAnswer = (question, questionIndex) => answers[question.id] !== undefined ? answers[question.id] : answers[questionIndex] !== undefined ? answers[questionIndex] : undefined;

  if (loading) return <LoadingSpinner />;
  if (!result) return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-white mb-2">Result not found</h2>
        <button onClick={() => navigate('/exams')} className="text-blue-400 hover:text-blue-300">← Back to Exams</button></div>
    </div>
  );

  const getScoreColor = (s) => { if (s >= 80) return '#22c55e'; if (s >= 60) return '#3b82f6'; if (s >= 40) return '#f59e0b'; return '#ef4444' };
  const getScoreMessage = (s) => { if (s >= 90) return 'Outstanding Performance!'; if (s >= 80) return 'Excellent Work!'; if (s >= 70) return 'Great Job!'; if (s >= 60) return 'Good Effort!'; if (s >= 50) return 'Keep Practicing!'; return 'More Practice Needed' };

  const pct = result.percentage || 0;
  const scoreColor = getScoreColor(pct);
  const radius = 70, circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const accuracy = (result.correctAnswers + result.wrongAnswers) > 0 ? Math.round((result.correctAnswers / (result.correctAnswers + result.wrongAnswers)) * 100) : 0;
  const avgTimePerQ = result.totalQuestions > 0 ? Math.round((result.timeTaken || 0) / result.totalQuestions) : 0;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${pct >= 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{pct >= 50 ? 'PASSED' : 'FAILED'}</span>
              {result.rank && <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400">Rank #{result.rank}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{result.examTitle || 'Scheduled Exam'}</h1>
            <p className="text-gray-400 text-sm mt-1">{formatTime(result.timeTaken)} Duration &bull; {result.totalParticipants || 1} Participants</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowSolutions(!showSolutions)} className="flex items-center gap-2 px-4 py-2.5 bg-[#111d2e] border border-gray-700/50 text-gray-300 rounded-xl hover:bg-[#162435] transition-colors text-sm font-medium"><FiEye className="w-4 h-4" /> AI Solutions</button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors text-sm font-medium"><FiShare2 className="w-4 h-4" /> Share Result</button>
          </div>
        </motion.div>

        {/* Score + Rank */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative flex-shrink-0">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
                  <motion.circle cx="80" cy="80" r={radius} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-4xl font-extrabold text-white">{pct}%</motion.span>
                  <span className="text-gray-500 text-sm">{result.correctAnswers}/{result.totalQuestions}</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">{getScoreMessage(pct)}</h2>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">{pct >= 70 ? 'Excellent performance! You demonstrated strong command.' : 'Keep practicing to improve your competitive standing.'}</p>
                <div className="grid grid-cols-3 gap-6">
                  <div><span className="text-gray-500 text-xs block mb-1">Correct</span><span className="text-xl font-bold text-green-400">{result.correctAnswers}</span></div>
                  <div><span className="text-gray-500 text-xs block mb-1">Wrong</span><span className="text-xl font-bold text-red-400">{result.wrongAnswers}</span></div>
                  <div><span className="text-gray-500 text-xs block mb-1">Skipped</span><span className="text-xl font-bold text-gray-400">{result.unanswered || 0}</span></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111d2e] rounded-2xl p-6 border border-gray-700/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🏆</span><h3 className="text-lg font-bold text-white">Ranking</h3></div>
              <p className="text-gray-500 text-sm">out of {result.totalParticipants || 1} participants</p>
            </div>
            <div className="py-4 text-center">
              <span className="text-5xl font-extrabold text-purple-400">#{result.rank || '-'}</span>
            </div>
            <div>
              <div className="text-center py-1 px-3 rounded-lg" style={{ background: `${scoreColor}20` }}>
                <span className="text-sm font-bold" style={{ color: scoreColor }}>
                  {pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D'} Grade
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Accuracy / Pacing / Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><FiTarget className="w-4 h-4 text-blue-400" /></div><span className="text-white font-semibold">Accuracy</span></div>
              <span className={`text-xs font-semibold ${accuracy >= 70 ? 'text-green-400' : 'text-red-400'}`}>{accuracy}%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-extrabold text-white">{accuracy}%</span></div>
            <div className="w-full h-2 bg-gray-800 rounded-full mt-3 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${accuracy}%` }} transition={{ delay: 0.6, duration: 1 }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" /></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><FiClock className="w-4 h-4 text-amber-400" /></div><span className="text-white font-semibold">Pacing</span></div>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-extrabold text-white">{avgTimePerQ}s</span><span className="text-gray-500 text-sm">per question</span></div>
            <div className="mt-4"><div className="flex items-center justify-between text-xs text-gray-500 mb-1.5"><span>Your Avg</span><span>Total: {formatTime(result.timeTaken)}</span></div>
              <div className="flex gap-1.5 h-2.5"><div className="bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (avgTimePerQ / 120) * 100)}%` }} /><div className="flex-1 bg-amber-900/40 rounded-full" /></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#111d2e] rounded-2xl p-5 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><FiBarChart2 className="w-4 h-4 text-purple-400" /></div><span className="text-white font-semibold">Comparison</span></div>
            <div className="space-y-3">
              {[{ name: 'You', pct: pct, color: 'bg-blue-500' },
                { name: 'Average', pct: avgScore, color: 'bg-gray-500' },
                { name: 'Topper', pct: topperScore, color: 'bg-green-500' }
              ].map((t, i) => (
                <div key={i}><div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-400">{t.name}</span><span className="text-white font-semibold">{t.pct}%</span></div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }} transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }} className={`h-full ${t.color} rounded-full`} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Solutions Toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <button onClick={() => setShowSolutions(!showSolutions)} className="w-full bg-[#111d2e] border border-gray-700/30 rounded-2xl p-4 flex items-center justify-between hover:bg-[#162435] transition-colors">
            <div className="flex items-center gap-3"><FiEye className="w-5 h-5 text-blue-400" /><span className="font-semibold text-white">🤖 AI-Powered Solutions</span><span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{questions.length || result.totalQuestions} questions</span></div>
            {showSolutions ? <FiChevronUp className="w-5 h-5 text-gray-500" /> : <FiChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          <AnimatePresence>
            {showSolutions && questions.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-3">
                  {questions.map((question, index) => {
                    const userAnswer = getUserAnswer(question, index);
                    const isCorrect = userAnswer === question.correctAnswer;
                    const isUnanswered = userAnswer === undefined || userAnswer === null;
                    return (
                      <motion.div key={question.id || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                        className={`bg-[#111d2e] border rounded-xl p-4 border-l-4 ${isCorrect ? 'border-green-500/50 border-l-green-500' : isUnanswered ? 'border-gray-700/50 border-l-gray-600' : 'border-red-500/50 border-l-red-500'}`}>
                        <div className="flex items-start gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-green-500/20 text-green-400' : isUnanswered ? 'bg-gray-700 text-gray-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isCorrect ? <FiCheck /> : isUnanswered ? '-' : <FiX />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-gray-500 text-xs font-medium">Q{index + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCorrect ? 'bg-green-500/20 text-green-400' : isUnanswered ? 'bg-gray-700 text-gray-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isCorrect ? 'Correct' : isUnanswered ? 'Skipped' : 'Wrong'}
                              </span>
                              {question.difficulty && <span className={`text-xs px-2 py-0.5 rounded-full ${question.difficulty === 'easy' ? 'bg-green-900/30 text-green-400' : question.difficulty === 'hard' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{question.difficulty}</span>}
                            </div>
                            <p className="text-white font-medium mb-3">{question.text}</p>
                            <div className="space-y-2">
                              {(question.options || []).map((option, optIndex) => {
                                const isCorrectOpt = optIndex === question.correctAnswer;
                                const isUserChoice = optIndex === userAnswer;
                                const isWrongChoice = isUserChoice && !isCorrect;
                                return (
                                  <div key={optIndex} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${isCorrectOpt ? 'bg-green-500/10 border border-green-500/30 text-green-300' : isWrongChoice ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-gray-800/50 text-gray-400'}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isCorrectOpt ? 'bg-green-500 text-white' : isWrongChoice ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>{String.fromCharCode(65 + optIndex)}</span>
                                    <span className="flex-1">{option}</span>
                                    {isCorrectOpt && <span className="text-green-400 text-xs font-medium">✓ Correct</span>}
                                    {isWrongChoice && <span className="text-red-400 text-xs font-medium">✗ Your Answer</span>}
                                    {isUserChoice && isCorrect && <span className="text-green-400 text-xs font-medium">✓ Your Answer</span>}
                                  </div>
                                );
                              })}
                            </div>
                            {question.explanation && (<div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"><div className="flex items-start gap-2"><span className="text-blue-400">🤖</span><div><h4 className="text-blue-400 font-medium text-xs mb-1">AI Explanation</h4><p className="text-sm text-blue-300 leading-relaxed">{question.explanation}</p></div></div></div>)}
                            {!question.explanation && (<div className="mt-3 p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg"><p className="text-gray-400 text-sm">💡 Correct answer: <strong className="text-green-400">{String.fromCharCode(65 + question.correctAnswer)}) {question.options?.[question.correctAnswer]}</strong></p></div>)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {showSolutions && questions.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-[#111d2e] rounded-xl p-8 border border-gray-700/30 text-center">
                <span className="text-4xl mb-4 block">📝</span>
                <h3 className="text-lg font-semibold text-white mb-2">Solutions not available</h3>
                <p className="text-gray-400 mb-4">Question details could not be loaded. Try refreshing.</p>
                <button onClick={() => fetchResultFromAPI(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-medium"><FiRefreshCw className="w-4 h-4 inline mr-2" />Retry</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/exam/${examId}/leaderboard`)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-colors">
            <FiAward className="w-5 h-5" /> View Leaderboard
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/exams')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#111d2e] border border-gray-700/30 text-gray-300 rounded-xl font-semibold hover:bg-[#162435] transition-colors">
            <FiTarget className="w-5 h-5" /> More Exams
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#111d2e] border border-gray-700/30 text-gray-300 rounded-xl font-semibold hover:bg-[#162435] transition-colors">
            <FiHome className="w-5 h-5" /> Dashboard
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ScheduledExamResult;
