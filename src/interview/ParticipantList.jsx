import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { useAuth } from '../context/AuthContext';

/**
 * ParticipantList — Side panel showing connected participants + waiting room management for host
 */
const ParticipantList = ({ roomData, isOpen, onClose, isHost = false, waitingRoom = [], onAdmitUser, onRejectUser, onAdmitAll }) => {
  const { currentUser } = useAuth();
  const { remoteStreams } = useWebRTC();

  if (!isOpen) return null;

  const participants = roomData?.participants || [];

  return (
    <div className="fixed inset-0 sm:static sm:inset-auto w-full h-full sm:w-80 bg-[#1a1a2e] sm:border-l border-gray-700/50 flex flex-col sm:h-full flex-shrink-0 z-40 sm:z-auto transition-all duration-300">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0">
        <h3 className="text-white font-semibold">
          People ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Waiting Room Section (Host only) */}
      {isHost && waitingRoom.length > 0 && (
        <div className="border-b border-gray-700/50 p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              Waiting ({waitingRoom.length})
            </h4>
            {waitingRoom.length > 1 && (
              <button
                onClick={onAdmitAll}
                className="text-xs px-2.5 py-1 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 font-medium transition-colors"
              >
                Admit All
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {waitingRoom.map((w) => {
              const initials = w.displayName
                ?.split(' ')
                .map(word => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || '?';

              return (
                <div
                  key={w.socketId}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 animate-fadeIn"
                >
                  {/* Avatar */}
                  {w.photoUrl ? (
                    <img src={w.photoUrl} alt={w.displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm text-white truncate flex-1 min-w-0">{w.displayName}</span>
                  {/* Admit / Reject */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onAdmitUser?.(w.socketId)}
                      className="w-7 h-7 rounded-full bg-green-600/20 hover:bg-green-600/40 text-green-400 flex items-center justify-center transition-colors"
                      title="Admit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRejectUser?.(w.socketId)}
                      className="w-7 h-7 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 flex items-center justify-center transition-colors"
                      title="Reject"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {participants.map((p) => {
          const isMe = p.userId === currentUser?.uid;
          const isParticipantHost = p.userId === roomData?.hostId;
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
                  {isParticipantHost ? '🎤 Host' : 'Participant'}
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
                {p.isScreenSharing && (
                  <span className="w-5 h-5 rounded-full bg-green-600/20 flex items-center justify-center" title="Sharing screen">
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25" strokeLinecap="round" strokeLinejoin="round" />
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default ParticipantList;
