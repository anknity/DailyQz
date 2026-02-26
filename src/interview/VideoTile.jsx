import { useRef, useEffect, memo } from 'react';

const FILTER_CSS = {
  none: 'none',
  blur: 'blur(8px) brightness(0.85)',
  grayscale: 'grayscale(1)',
  sepia: 'sepia(0.9)',
  warm: 'sepia(0.35) saturate(1.6) brightness(1.1)',
  cool: 'saturate(0.7) hue-rotate(20deg) brightness(1.05)',
  vivid: 'saturate(2) contrast(1.1)',
};

/**
 * VideoTile — Renders a single participant's video feed
 * Supports: local mirror, CSS filters, emoji reaction overlay
 */
const VideoTile = memo(({
  stream,
  displayName = 'Participant',
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  isScreenSharing = false,
  photoUrl,
  compact = false,
  reaction = null,
  videoFilter = 'none',
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = displayName
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div className={`relative bg-[#1a1a2e] rounded-xl overflow-hidden group ${compact ? 'aspect-video' : 'aspect-video'}`}>
      {/* Video */}
      {stream && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            filter: isLocal ? (FILTER_CSS[videoFilter] || 'none') : 'none',
            transform: isLocal && !isScreenSharing ? 'scaleX(-1)' : 'none',
          }}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Camera-off avatar */
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-600" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-gray-600">
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium truncate">
            {isLocal ? `${displayName} (You)` : displayName}
          </span>
          {isMuted && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600/90 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1.5 4.5l21 15M10.5 5.5V3a1.5 1.5 0 113 0v7.5c0 .166-.027.326-.076.477m-1.924 1.523A1.5 1.5 0 019 10.5V8m-3 2.5a6 6 0 0011.25 3m.75-12l-21 15" stroke="currentColor" fill="none" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            </span>
          )}
          {isScreenSharing && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-green-600/90 text-[10px] text-white font-medium">
              Screen
            </span>
          )}
        </div>
      </div>

      {/* Speaking indicator */}
      {!isMuted && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/0 group-hover:ring-blue-500/20 transition-all pointer-events-none" />
      )}

      {/* Floating emoji reaction */}
      {reaction && (
        <div
          key={reaction.id}
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
        >
          <span
            className="text-5xl drop-shadow-lg"
            style={{ animation: 'reactionFloat 2.2s ease-out forwards' }}
          >
            {reaction.emoji}
          </span>
        </div>
      )}

      <style>{`
        @keyframes reactionFloat {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          50%  { opacity: 1; transform: translateY(-60px) scale(1.5); }
          100% { opacity: 0; transform: translateY(-120px) scale(0.8); }
        }
      `}</style>
    </div>
  );
});

VideoTile.displayName = 'VideoTile';
export default VideoTile;
