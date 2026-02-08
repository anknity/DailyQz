import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Timer from '../components/Timer';
import QuestionPalette from '../components/QuestionPalette';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ScheduledExamTest = () => {
  const { examId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('connecting'); // 'connecting', 'active', 'denied', 'error'
  const [cameraExpanded, setCameraExpanded] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    fetchExamData();
    setupProctoring();
    setupTabDetection();

    return () => {
      cleanupProctoring();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examId]);

  const fetchExamData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${API_URL}/exams/scheduled/${examId}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        const examData = data.data;
        setExam({
          id: examData.id,
          title: examData.title,
          durationMinutes: examData.duration_minutes || 60,
          isProctored: examData.is_proctored || false
        });
        setQuestions(examData.questions || []);
        setTimeLeft((examData.duration_minutes || 60) * 60);
      } else {
        setError(data.error || 'Failed to load exam');
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const setupProctoring = async () => {
    setCameraStatus('connecting');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: true
      });
      setStream(mediaStream);
      setCameraStatus('active');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Proctoring setup failed:', error);
      setCameraStatus('denied');
      addWarning('Camera/Microphone access denied');
      logViolation('camera_denied');
    }
  };

  const cleanupProctoring = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const logViolation = async (violationType, details = {}) => {
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      if (!token) return;

      const response = await fetch(`${API_URL}/exams/scheduled/${examId}/violation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          violationType,
          timestamp: new Date().toISOString(),
          details
        })
      });

      const data = await response.json();
      
      if (data.success && data.data.shouldDisqualify) {
        handleAutoSubmit('Maximum violations exceeded');
      }

      return data;
    } catch (error) {
      console.error('Error logging violation:', error);
    }
  };

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setTabSwitchCount(prev => {
        const newCount = prev + 1;
        addWarning(`Tab switch detected (${newCount}/3)`);
        logViolation('tab_switch', { count: newCount });
        if (newCount >= 3) {
          handleAutoSubmit('Too many tab switches');
        }
        return newCount;
      });
    }
  }, []);

  const setupTabDetection = () => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  const addWarning = (message) => {
    setWarnings(prev => [...prev, { message, time: new Date().toLocaleTimeString() }]);
  };

  const handleAnswerSelect = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleQuestionSelect = (index) => {
    setCurrentIndex(index);
    setShowPalette(false);
  };

  const handleTimeUp = () => {
    handleAutoSubmit('Time expired');
  };

  const handleAutoSubmit = async (reason) => {
    addWarning(`Auto-submit: ${reason}`);
    await submitExam();
  };

  const submitExam = async () => {
    setSubmitting(true);
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Convert answers from {index: optionIndex} to {questionId: optionIndex}
      const answersForAPI = {};
      questions.forEach((q, index) => {
        if (answers[index] !== undefined) {
          answersForAPI[q.id] = answers[index];
        }
      });

      const timeSpent = exam.durationMinutes * 60 - timeLeft;
      
      const response = await fetch(`${API_URL}/exams/scheduled/${examId}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          answers: answersForAPI,
          timeSpent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const result = {
          examId,
          score: data.data.correct,
          totalQuestions: data.data.total,
          percentage: data.data.score,
          timeTaken: timeSpent,
          correctAnswers: data.data.correct,
          wrongAnswers: data.data.total - data.data.correct - (questions.length - Object.keys(answers).length),
          unanswered: questions.length - Object.keys(answers).length,
          warnings: warnings.length
        };

        // Update streak on server
        try {
          await fetch(`${API_URL}/users/update-streak`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ activityType: 'scheduled-exam' })
          });
        } catch (e) { /* streak update is non-blocking */ }

        // Use questions from API response (with correct answers) if available, fallback to test questions
        const resultQuestions = data.data.questions || questions;

        // Navigate to result page with full question data
        navigate(`/exam/${examId}/result`, { 
          state: { result, questions: resultQuestions, answers }
        });
      } else {
        alert('Failed to submit exam: ' + (data.error || 'Unknown error'));
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Error submitting exam. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirm) return;
    }
    submitExam();
  };

  const getQuestionStatus = (index) => {
    if (markedForReview.has(index)) return 'review';
    if (answers[index] !== undefined) return 'answered';
    return 'unanswered';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to Load Exam</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchExamData}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/exams')}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Questions Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This exam doesn't have any questions yet. Please contact the administrator.
          </p>
          <button
            onClick={() => navigate('/exams')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-700 dark:text-white mt-4">Submitting your exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{exam?.title}</h1>
            {warnings.length > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 rounded text-xs">
                ⚠️ {warnings.length} warning(s)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-lg">
              <Timer 
                initialTime={timeLeft} 
                onTimeUp={handleTimeUp}
                onTick={setTimeLeft}
              />
            </div>

            {/* Camera Preview (small) with status indicator */}
            {exam?.isProctored && (
              <div className="relative">
                <button
                  onClick={() => setCameraExpanded(!cameraExpanded)}
                  className="relative w-16 h-12 bg-gray-200 dark:bg-gray-900 rounded overflow-hidden border-2 border-gray-300 dark:border-gray-700 hover:border-primary-500 transition-colors"
                  title={cameraExpanded ? 'Collapse camera' : 'Expand camera'}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Camera status dot */}
                  <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${
                    cameraStatus === 'active' ? 'bg-green-500 animate-pulse' :
                    cameraStatus === 'denied' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                  }`} />
                  {cameraStatus === 'denied' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="text-red-400 text-xs">OFF</span>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Camera denied warning for proctored exams */}
            {exam?.isProctored && cameraStatus === 'denied' && (
              <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                📷 Camera required
              </span>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </header>

      {/* Expanded Camera Overlay - Floating panel */}
      {exam?.isProctored && cameraExpanded && stream && (
        <div className="fixed top-20 right-4 z-50 bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-gray-600">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white text-xs font-medium">Live Camera</span>
            </div>
            <button
              onClick={() => setCameraExpanded(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <video
            autoPlay
            muted
            playsInline
            className="w-64 h-48 object-cover"
            ref={(el) => { if (el && stream) el.srcObject = stream; }}
          />
          <div className="px-3 py-1.5 bg-gray-800 text-center">
            <span className="text-gray-400 text-xs">
              {cameraStatus === 'active' ? '🟢 Recording' : '🔴 Inactive'} | ⚠️ {warnings.length} warnings
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Question Area */}
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {/* Question Number & Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-lg font-medium">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                {markedForReview.has(currentIndex) && (
                  <span className="bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded text-sm">
                    Marked for Review
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="lg:hidden px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded"
              >
                📋 Palette
              </button>
            </div>

            {/* Question Text */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 mb-6 shadow-sm">
              <p className="text-lg text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion?.text || currentQuestion?.question_text}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {(currentQuestion?.options || []).map((option, index) => {
                // Handle both string options and object options
                const optionText = typeof option === 'string' ? option : option?.text || option;
                return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                    answers[currentIndex] === index
                      ? 'bg-purple-100 dark:bg-purple-600/20 border-purple-500 text-gray-900 dark:text-white'
                      : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      answers[currentIndex] === index
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{optionText}</span>
                  </div>
                </button>
              );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>

              <button
                onClick={handleMarkForReview}
                className={`px-4 py-2 rounded-lg ${
                  markedForReview.has(currentIndex)
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {markedForReview.has(currentIndex) ? '★ Marked' : '☆ Mark for Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette - Desktop */}
        <div className={`hidden lg:block w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 shadow-sm`}>
          <h3 className="text-gray-900 dark:text-white font-medium mb-4">Question Palette</h3>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-600 rounded"></span>
              <span className="text-gray-500 dark:text-gray-400">Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded"></span>
              <span className="text-gray-500 dark:text-gray-400">Unanswered</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-yellow-500 rounded"></span>
              <span className="text-gray-500 dark:text-gray-400">Review</span>
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => {
              const status = getQuestionStatus(index);
              return (
                <button
                  key={index}
                  onClick={() => handleQuestionSelect(index)}
                  className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                    currentIndex === index
                      ? 'ring-2 ring-purple-500'
                      : ''
                  } ${
                    status === 'answered'
                      ? 'bg-green-600 text-white'
                      : status === 'review'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Answered</span>
              <span className="text-green-600 dark:text-green-400">{Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Unanswered</span>
              <span className="text-gray-700 dark:text-gray-300">{questions.length - Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Marked for Review</span>
              <span className="text-yellow-600 dark:text-yellow-400">{markedForReview.size}</span>
            </div>
          </div>
        </div>

        {/* Mobile Palette Overlay */}
        {showPalette && (
          <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
            <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-900 dark:text-white font-medium">Question Palette</h3>
                <button
                  onClick={() => setShowPalette(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuestionSelect(index)}
                      className={`w-10 h-10 rounded-lg font-medium text-sm ${
                        status === 'answered'
                          ? 'bg-green-600 text-white'
                          : status === 'review'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledExamTest;
