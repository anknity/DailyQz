import { useState, useMemo } from 'react';
import VideoTile from './VideoTile';
import { useWebRTC } from '../context/WebRTCContext';
import { useAuth } from '../context/AuthContext';

/**
 * VideoGrid — Google Meet/Teams–style responsive grid
 * - Normal mode: responsive grid that adapts to participant count
 * - Screen-share / pinned mode: main spotlight + right sidebar strip of camera tiles
 * - Reference layout: Presenter's screen = large area, their cam + others = small tiles on right
 */
const VideoGrid = ({ videoFilter = 'none', reactions = {} }) => {
  const { localStream, remoteStreams, isMuted, isCameraOff, isScreenSharing } = useWebRTC();
  const { currentUser, userProfile } = useAuth();
  const [pinnedKey, setPinnedKey] = useState(null);

  const participants = useMemo(() => {
    const list = [];
    // Local user first
    list.push({
      key: 'local',
      stream: localStream,
      displayName: userProfile?.displayName || currentUser?.displayName || 'You',
      photoUrl: userProfile?.photoURL || currentUser?.photoURL,
      isLocal: true,
      isMuted,
      isCameraOff,
      isScreenSharing,
    });
    // Remote participants
    for (const [socketId, remote] of remoteStreams) {
      list.push({
        key: socketId,
        stream: remote.stream,
        displayName: remote.displayName || 'Participant',
        photoUrl: remote.photoUrl,
        isLocal: false,
        isMuted: remote.isMuted || false,
        isCameraOff: remote.isCameraOff || false,
        isScreenSharing: remote.isScreenSharing || false,
      });
    }
    return list;
  }, [localStream, remoteStreams, isMuted, isCameraOff, isScreenSharing, userProfile, currentUser]);

  // Auto-pin screen sharing participant  
  const screenSharer = participants.find(p => p.isScreenSharing);
  const effectivePinned = pinnedKey || (screenSharer ? screenSharer.key : null);

  const pinnedParticipant = effectivePinned ? participants.find(p => p.key === effectivePinned) : null;
  const otherParticipants = pinnedParticipant
    ? participants.filter(p => p.key !== effectivePinned)
    : participants;

  const handlePin = (key) => {
    setPinnedKey(prev => prev === key ? null : key);
  };

  // ─── Pinned/Spotlight layout (screen share or manually pinned) ───
  if (pinnedParticipant) {
    return (
      <div className="flex-1 p-1.5 sm:p-2 lg:p-3 overflow-hidden min-h-0 flex flex-col lg:flex-row gap-1.5 sm:gap-2 transition-all duration-300">
        {/* Main spotlight area */}
        <div className="flex-1 min-h-0 min-w-0 rounded-xl overflow-hidden">
          <VideoTile
            stream={pinnedParticipant.stream}
            displayName={pinnedParticipant.displayName}
            isLocal={pinnedParticipant.isLocal}
            isMuted={pinnedParticipant.isMuted}
            isCameraOff={pinnedParticipant.isCameraOff}
            isScreenSharing={pinnedParticipant.isScreenSharing}
            photoUrl={pinnedParticipant.photoUrl}
            videoFilter={pinnedParticipant.isLocal ? videoFilter : 'none'}
            reaction={reactions[pinnedParticipant.key] || null}
            isPinned={true}
            onPin={() => handlePin(pinnedParticipant.key)}
          />
        </div>
        {/* Sidebar strip — horizontal on mobile, vertical on desktop */}
        {otherParticipants.length > 0 && (
          <div className="flex lg:flex-col gap-1.5 sm:gap-2 lg:w-44 xl:w-56 flex-shrink-0 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden h-20 sm:h-24 lg:h-full custom-scrollbar">
            {otherParticipants.map(p => (
              <div
                key={p.key}
                className="min-w-[100px] sm:min-w-[120px] lg:min-w-0 w-full flex-shrink-0 rounded-xl overflow-hidden"
                style={{ aspectRatio: '16/9' }}
              >
                <VideoTile
                  stream={p.stream}
                  displayName={p.displayName}
                  isLocal={p.isLocal}
                  isMuted={p.isMuted}
                  isCameraOff={p.isCameraOff}
                  isScreenSharing={p.isScreenSharing}
                  photoUrl={p.photoUrl}
                  videoFilter={p.isLocal ? videoFilter : 'none'}
                  reaction={reactions[p.key] || null}
                  compact={true}
                  onPin={() => handlePin(p.key)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Normal grid layout ───
  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="flex-1 p-1.5 sm:p-2 lg:p-3 overflow-hidden min-h-0 transition-all duration-300">
      <div
        className={`grid ${getGridClass(participants.length)} gap-1.5 sm:gap-2 lg:gap-3 h-full`}
        style={{ gridAutoRows: '1fr' }}
      >
        {participants.map(p => (
          <div key={p.key} className="rounded-xl overflow-hidden min-h-0">
            <VideoTile
              stream={p.stream}
              displayName={p.displayName}
              isLocal={p.isLocal}
              isMuted={p.isMuted}
              isCameraOff={p.isCameraOff}
              isScreenSharing={p.isScreenSharing}
              photoUrl={p.photoUrl}
              videoFilter={p.isLocal ? videoFilter : 'none'}
              reaction={reactions[p.key] || null}
              onPin={() => handlePin(p.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
