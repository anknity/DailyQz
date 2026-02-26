import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { useAuth } from '../context/AuthContext';

/**
 * ParticipantList — Side panel showing connected participants
 */
const ParticipantList = ({ roomData, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { remoteStreams } = useWebRTC();

  if (!isOpen) return null;

  const participants = roomData?.participants || [];

  return (
    <div className="w-80 bg-[#1a1a2e] border-l border-gray-700/50 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0">
        <h3 className="text-white font-semibold">
          People ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {participants.map((p) => {
          const isMe = p.userId === currentUser?.uid;
          const initials = p.displayName
            ?.split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || '?';

          return (
            <div
              key={p.id || p.socketId}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              {/* Avatar */}
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
              )}

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {p.displayName} {isMe && <span className="text-gray-400">(You)</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {p.userId === roomData?.hostId ? '🎤 Host' : 'Participant'}
                </p>
              </div>

              {/* Media indicators */}
              <div className="flex items-center gap-1.5">
                {p.isMuted && (
                  <span className="w-5 h-5 rounded-full bg-red-600/20 flex items-center justify-center" title="Muted">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                {p.isCameraOff && (
                  <span className="w-5 h-5 rounded-full bg-red-600/20 flex items-center justify-center" title="Camera off">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M1 1l22 22M17 17H3V7h2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                {!p.isConnected && (
                  <span className="text-[10px] text-yellow-400">reconnecting</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantList;
