import VideoTile from './VideoTile';
import { useWebRTC } from '../context/WebRTCContext';
import { useAuth } from '../context/AuthContext';

/**
 * VideoGrid — Google Meet–style responsive grid of video tiles
 */
const VideoGrid = ({ videoFilter = 'none', reactions = {} }) => {
  const { localStream, remoteStreams, isMuted, isCameraOff, isScreenSharing } = useWebRTC();
  const { currentUser, userProfile } = useAuth();

  const participants = [];

  // Local user first
  participants.push({
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
    participants.push({
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

  // Dynamic grid layout based on participant count
  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3'; // 5 participants
  };

  return (
    <div className="flex-1 p-3 overflow-hidden">
      <div className={`grid ${getGridClass(participants.length)} gap-3 h-full auto-rows-fr`}>
        {participants.map(p => (
          <VideoTile
            key={p.key}
            stream={p.stream}
            displayName={p.displayName}
            isLocal={p.isLocal}
            isMuted={p.isMuted}
            isCameraOff={p.isCameraOff}
            isScreenSharing={p.isScreenSharing}
            photoUrl={p.photoUrl}
            videoFilter={p.isLocal ? videoFilter : 'none'}
            reaction={reactions[p.key] || null}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
