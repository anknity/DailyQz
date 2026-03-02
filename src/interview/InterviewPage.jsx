import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { WebRTCProvider, useWebRTC } from '../context/WebRTCContext';
import VideoGrid from './VideoGrid';
import ControlBar from './Controls';
import ChatPanel from './Chat';
import ParticipantList from './ParticipantList';

/**
 * InterviewRoom — Main interview/video call page with WebRTC
 * Supports: waiting room / admit flow, screen sharing layout, responsive design
 */
const InterviewRoomInner = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { socket, isConnected } = useSocket();
  const { initLocalStream, cleanup, createOffer } = useWebRTC();

  const [roomData, setRoomData] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [joinNotifications, setJoinNotifications] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | waiting | joined | error | ended | rejected
  const [videoFilter, setVideoFilter] = useState('none');
  const [reactions, setReactions] = useState({});
  const [linkCopied, setLinkCopied] = useState(false);
  const [wasJoined, setWasJoined] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState([]);
  const [waitingPosition, setWaitingPosition] = useState(0);

  const isHost = roomData?.hostId === currentUser?.uid;

  // Join room and init media
  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    const joinAndInit = async () => {
      // Init camera/microphone
      const stream = await initLocalStream();
      if (!stream) {
        console.warn('Could not get media, joining without camera');
      }

      // Join socket room
      socket.emit('join-room', { roomId }, (res) => {
        if (res?.error) {
          setStatus('error');
          console.error('Join room error:', res.error);
          return;
        }
        if (res?.waiting) {
          // User is in waiting room — show waiting screen
          setStatus('waiting');
          setWaitingPosition(res.position || 1);
          return;
        }
        // User was admitted directly (host or reconnection)
        setRoomData(res.room);
        setStatus('joined');
        setWasJoined(true);
      });
    };

    joinAndInit();

    // ─── Room event listeners ───

    const handleUserJoined = ({ participant, roomId: rid }) => {
      if (rid === roomId) {
        socket.emit('get-room', { roomId }, (res) => {
          if (res?.room) setRoomData(res.room);
        });
        setJoinNotifications(prev => [...prev, {
          id: Date.now(),
          message: `${participant.displayName} joined`,
          type: 'join',
        }]);
      }
    };

    const handleUserLeft = ({ participant, roomId: rid }) => {
      if (rid === roomId) {
        socket.emit('get-room', { roomId }, (res) => {
          if (res?.room) setRoomData(res.room);
        });
        setJoinNotifications(prev => [...prev, {
          id: Date.now(),
          message: `${participant?.displayName || 'Someone'} left`,
          type: 'leave',
        }]);
      }
    };

    const handleInterviewEnded = ({ roomId: rid }) => {
      if (rid === roomId) {
        setStatus('ended');
      }
    };

    // Admitted by host
    const handleAdmitted = ({ room, participant, roomId: rid }) => {
      if (rid === roomId) {
        setRoomData(room);
        setStatus('joined');
        setWasJoined(true);
      }
    };

    // Rejected by host
    const handleRejected = ({ roomId: rid }) => {
      if (rid === roomId) {
        setStatus('rejected');
      }
    };

    // Waiting room updated (host sees this)
    const handleWaitingRoomUpdated = ({ waitingRoom: wr, roomId: rid }) => {
      if (rid === roomId) {
        setWaitingRoom(wr || []);
      }
    };

    // Force disconnect (duplicate session)
    const handleForceDisconnect = ({ reason }) => {
      cleanup();
      setStatus('error');
      setJoinNotifications([{ id: Date.now(), message: reason, type: 'leave' }]);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('interview-ended', handleInterviewEnded);
    socket.on('admitted', handleAdmitted);
    socket.on('rejected', handleRejected);
    socket.on('waiting-room-updated', handleWaitingRoomUpdated);
    socket.on('force-disconnect', handleForceDisconnect);

    // Emoji reaction handler
    const handleReaction = ({ from, emoji }) => {
      const reactionId = Date.now();
      setReactions(prev => ({ ...prev, [from]: { emoji, id: reactionId } }));
      setTimeout(() => {
        setReactions(prev => {
          const next = { ...prev };
          if (next[from]?.id === reactionId) delete next[from];
          return next;
        });
      }, 2500);
    };
    socket.on('receive-reaction', handleReaction);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('interview-ended', handleInterviewEnded);
      socket.off('admitted', handleAdmitted);
      socket.off('rejected', handleRejected);
      socket.off('waiting-room-updated', handleWaitingRoomUpdated);
      socket.off('force-disconnect', handleForceDisconnect);
      socket.off('receive-reaction', handleReaction);
    };
  }, [socket, isConnected, roomId, currentUser?.uid]);

  // Chat unread counter
  useEffect(() => {
    if (!socket) return;
    const handleMessage = () => {
      if (!showChat) setChatUnread(prev => prev + 1);
    };
    socket.on('receive-message', handleMessage);
    return () => socket.off('receive-message', handleMessage);
  }, [socket, showChat]);

  // Clear unread when chat opens
  useEffect(() => {
    if (showChat) setChatUnread(0);
  }, [showChat]);

  // Auto-dismiss join notifications
  useEffect(() => {
    if (joinNotifications.length === 0) return;
    const timer = setTimeout(() => {
      setJoinNotifications(prev => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [joinNotifications]);

  // Send emoji reaction
  const handleReaction = useCallback((emoji) => {
    if (!socket || !roomId) return;
    socket.emit('send-reaction', { roomId, emoji });
    const reactionId = Date.now();
    setReactions(prev => ({ ...prev, local: { emoji, id: reactionId } }));
    setTimeout(() => {
      setReactions(prev => {
        const next = { ...prev };
        if (next.local?.id === reactionId) delete next.local;
        return next;
      });
    }, 2500);
  }, [socket, roomId]);

  // Copy invite link
  const handleCopyLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }, []);

  // Leave room handler
  const handleLeave = useCallback(() => {
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
    cleanup();
    navigate('/interview');
  }, [socket, roomId, cleanup, navigate]);

  // Admit user from waiting room (host action)
  const handleAdmitUser = useCallback((targetSocketId) => {
    if (!socket || !roomId) return;
    socket.emit('admit-user', { roomId, targetSocketId }, (res) => {
      if (res?.error) console.error('Admit error:', res.error);
    });
  }, [socket, roomId]);

  // Reject user from waiting room (host action)
  const handleRejectUser = useCallback((targetSocketId) => {
    if (!socket || !roomId) return;
    socket.emit('reject-user', { roomId, targetSocketId }, (res) => {
      if (res?.error) console.error('Reject error:', res.error);
    });
  }, [socket, roomId]);

  // Admit all waiting users
  const handleAdmitAll = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('admit-all', { roomId }, (res) => {
      if (res?.error) console.error('Admit all error:', res.error);
    });
  }, [socket, roomId]);

  // Toggle panels (close other when opening one)
  const toggleChat = () => {
    setShowChat(prev => !prev);
    if (!showChat) setShowParticipants(false);
  };
  const toggleParticipants = () => {
    setShowParticipants(prev => !prev);
    if (!showParticipants) setShowChat(false);
  };

  // ─── Waiting room screen ───
  if (status === 'waiting') {
    return (
      <div className="h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              {userProfile?.photoURL || currentUser?.photoURL ? (
                <img src={userProfile?.photoURL || currentUser?.photoURL} className="w-full h-full rounded-full object-cover" alt="You" />
              ) : (
                <span className="text-2xl text-white font-bold">
                  {(userProfile?.displayName || currentUser?.displayName || '?')[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl text-white font-bold mb-2">Waiting to be admitted</h2>
          <p className="text-gray-400 mb-2 text-sm sm:text-base">The host will let you in soon.</p>
          <p className="text-gray-500 text-xs mb-8">Position in queue: {waitingPosition}</p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <button
            onClick={handleLeave}
            className="px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
          >
            Cancel & Leave
          </button>
        </div>
      </div>
    );
  }

  // ─── Rejected screen ───
  if (status === 'rejected') {
    return (
      <div className="h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl sm:text-2xl text-white font-bold mb-2">Request Denied</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">The host did not admit you to this meeting.</p>
          <button onClick={() => navigate('/interview')} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl sm:text-2xl text-white font-bold mb-2">Could not join room</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">The room may have ended or the link is invalid.</p>
          <button onClick={() => navigate('/interview')} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-xl sm:text-2xl text-white font-bold mb-2">Interview Ended</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">The interview session has been ended by the host.</p>
          <button onClick={() => navigate('/interview')} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#0a0a1a] flex flex-col overflow-hidden">
      {/* Reconnection banner */}
      {wasJoined && !isConnected && (
        <div className="bg-yellow-600/90 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 flex-shrink-0 z-50">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Connection lost — reconnecting...
        </div>
      )}

      {/* Waiting room notification banner for host */}
      {isHost && waitingRoom.length > 0 && (
        <div className="bg-blue-600/90 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-3 flex-shrink-0 z-50">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            {waitingRoom.length} {waitingRoom.length === 1 ? 'person is' : 'people are'} waiting to join
          </span>
          <button
            onClick={handleAdmitAll}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-semibold transition-colors"
          >
            Admit All
          </button>
          <button
            onClick={toggleParticipants}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs transition-colors"
          >
            View
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="h-11 sm:h-14 bg-[#1a1a2e]/95 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-2 sm:px-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors p-1 sm:p-1.5 rounded hover:bg-gray-800 flex items-center gap-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium hidden sm:inline">Home</span>
          </button>
          <div className="h-5 w-px bg-gray-700 hidden sm:block"></div>
          <span className="text-white font-medium text-xs sm:text-sm truncate">{roomData?.title || 'Interview Room'}</span>
          {isHost && <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">HOST</span>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Invite / Copy link button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all ${
              linkCopied
                ? 'bg-green-600/30 text-green-400 ring-1 ring-green-500/50'
                : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title="Copy invite link"
          >
            {linkCopied ? (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg><span className="hidden xs:inline">Copied!</span></>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>Invite</>
            )}
          </button>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <VideoGrid videoFilter={videoFilter} reactions={reactions} />
        <ChatPanel roomId={roomId} isOpen={showChat} onClose={() => setShowChat(false)} />
        <ParticipantList
          roomData={roomData}
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
          isHost={isHost}
          waitingRoom={waitingRoom}
          onAdmitUser={handleAdmitUser}
          onRejectUser={handleRejectUser}
          onAdmitAll={handleAdmitAll}
        />
      </div>

      {/* Join/Leave notifications */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
        {joinNotifications.map(n => (
          <div
            key={n.id}
            className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fadeIn ${
              n.type === 'join' ? 'bg-green-600/90 text-white' : 'bg-gray-600/90 text-white'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      <ControlBar
        onLeave={handleLeave}
        onToggleChat={toggleChat}
        onToggleParticipants={toggleParticipants}
        chatUnread={chatUnread}
        onReaction={handleReaction}
        videoFilter={videoFilter}
        onFilterChange={setVideoFilter}
        waitingCount={isHost ? waitingRoom.length : 0}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #404050; border-radius: 3px; }
      `}</style>
    </div>
  );
};

/**
 * InterviewPage — Wrapper that provides WebRTC context
 */
const InterviewPage = () => {
  const { roomId } = useParams();

  return (
    <WebRTCProvider roomId={roomId}>
      <InterviewRoomInner />
    </WebRTCProvider>
  );
};

export default InterviewPage;
