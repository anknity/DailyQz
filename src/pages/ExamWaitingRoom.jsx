import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ExamWaitingRoom = () => {
  const { examId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [stream, setStream] = useState(null);

  const defaultRules = [
    'Ensure stable internet connection throughout the exam',
    'Camera and microphone must remain on during proctored exams',
    'Do not switch tabs or windows during the exam',
    'Do not use any external resources or help',
    'Submit before the timer ends - auto-submission is enabled',
    'Any suspicious activity will result in disqualification'
  ];

  useEffect(() => {
    fetchExamDetails();
    return () => {
      // Cleanup camera/mic stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [examId]);

  useEffect(() => {
    if (exam) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(exam.startTime);
        const diff = start - now;

        if (diff <= 0) {
          // Exam has started
          clearInterval(interval);
          if (isReady) {
            navigate(`/exam/${examId}/start`);
          }
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown({ hours, minutes, seconds, total: diff });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [exam, isReady, examId, navigate]);

  const fetchExamDetails = async () => {
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
          category: examData.category,
          categoryName: examData.category,
          subject: examData.subject || 'General',
          description: examData.description,
          questionCount: examData.question_count || examData.questionCount || 0,
          durationMinutes: examData.duration_minutes || examData.durationMinutes || 60,
          startTime: examData.start_time || examData.startTime,
          endTime: examData.end_time || examData.endTime,
          isProctored: examData.is_proctored || examData.isProctored || false,
          passingScore: examData.passing_score || 40,
          instructions: examData.instructions,
          rules: defaultRules
        });
        // TODO: Fetch real participants from API when available
        setParticipants([]);
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

  const requestCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      setCameraPermission(true);
      setMicPermission(true);
      
      // Attach to video element
      const videoElement = document.getElementById('preview-video');
      if (videoElement) {
        videoElement.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      alert('Please allow camera and microphone access for proctored exams');
    }
  };

  const handleReadyClick = () => {
    if (exam?.isProctored && (!cameraPermission || !micPermission)) {
      requestCameraPermission();
      return;
    }
    setIsReady(true);
  };

  const handleLeaveRoom = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/exams');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exam not found</h2>
          <button
            onClick={() => navigate('/exams')}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            ← Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">{exam.categoryName}</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{exam.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{exam.subject}</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Countdown & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown Timer */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-8 border border-gray-200 dark:border-gray-700/50 text-center shadow-sm">
              <div className="text-gray-600 dark:text-gray-400 mb-4">Exam starts in</div>
              {countdown && (
                <div className="flex justify-center gap-4 mb-6">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-w-[80px]">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {String(countdown.hours).padStart(2, '0')}
                    </div>
                    <div className="text-gray-500 text-sm">Hours</div>
                  </div>
                  <div className="text-4xl text-gray-400 dark:text-gray-600 self-center">:</div>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-w-[80px]">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {String(countdown.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-gray-500 text-sm">Minutes</div>
                  </div>
                  <div className="text-4xl text-gray-400 dark:text-gray-600 self-center">:</div>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-w-[80px]">
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                      {String(countdown.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-gray-500 text-sm">Seconds</div>
                  </div>
                </div>
              )}
              
              {isReady ? (
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  You're ready! Waiting for exam to start...
                </div>
              ) : (
                <button
                  onClick={handleReadyClick}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  {exam.isProctored && !cameraPermission ? 'Enable Camera & Mic' : 'I\'m Ready'}
                </button>
              )}
            </div>

            {/* Exam Details */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exam Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">📝</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{exam.questionCount}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Questions</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{exam.durationMinutes}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Minutes</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{participants.length}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Participants</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">{exam.isProctored ? '👁️' : '📋'}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {exam.isProctored ? 'Proctored' : 'Standard'}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Mode</div>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Exam Rules</h3>
              <ul className="space-y-3">
                {exam.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                    <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Camera Preview & Participants */}
          <div className="space-y-6">
            {/* Camera Preview (for proctored exams) */}
            {exam.isProctored && (
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📹 Camera Preview</h3>
                <div className="aspect-video bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden relative">
                  {cameraPermission ? (
                    <video
                      id="preview-video"
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm text-center px-4">
                        Camera access required for proctored exams
                      </p>
                      <button
                        onClick={requestCameraPermission}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className={`flex items-center gap-1 ${cameraPermission ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {cameraPermission ? '✓' : '○'} Camera
                  </span>
                  <span className={`flex items-center gap-1 ${micPermission ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {micPermission ? '✓' : '○'} Microphone
                  </span>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                👥 Participants ({participants.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Current User */}
                <div className="flex items-center justify-between p-2 bg-purple-100 dark:bg-purple-600/20 rounded-lg border border-purple-300 dark:border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    <span className="text-gray-900 dark:text-white font-medium">You</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    isReady 
                      ? 'bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400' 
                      : 'bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {isReady ? 'Ready' : 'Waiting'}
                  </span>
                </div>

                {/* Other Participants */}
                {participants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{participant.avatar}</span>
                      <span className="text-gray-700 dark:text-gray-300">{participant.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      participant.status === 'ready' 
                        ? 'bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400' 
                        : 'bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {participant.status === 'ready' ? 'Ready' : 'Waiting'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Button */}
            <button
              onClick={handleLeaveRoom}
              className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
            >
              Leave Waiting Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamWaitingRoom;
