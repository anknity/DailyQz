import { useRef, useEffect, useCallback, memo } from 'react';

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
 * Supports: local mirror, CSS filters, emoji reaction overlay, fullscreen, pin
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
  isPinned = false,
  onPin,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Assign srcObject whenever stream reference changes and explicitly start playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => { /* autoplay policy */ });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Also re-trigger play when stream tracks change (fixes blank screen after camera toggle)
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const handleTrackChange = () => {
      const video = videoRef.current;
      if (video && stream) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
    };
    stream.addEventListener('addtrack', handleTrackChange);
    stream.addEventListener('removetrack', handleTrackChange);
    return () => {
      stream.removeEventListener('addtrack', handleTrackChange);
      stream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [stream]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {
        // Fallback for webkit
        el.webkitRequestFullscreen?.();
      });
    }
  }, []);

  const initials = displayName
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#1a1a2e] rounded-2xl overflow-hidden group w-full h-full min-h-0 transition-all duration-300 ${
        isPinned ? 'ring-2 ring-blue-500/40' : ''
      }`}
      onClick={onPin}
      style={{ cursor: onPin ? 'pointer' : 'default' }}
    >
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
          className="w-full h-full object-cover transition-opacity duration-200"
        />
      ) : (
        /* Camera-off avatar */
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              className={`rounded-full object-cover ring-2 ring-gray-600 transition-all duration-200 ${compact ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-16 h-16 sm:w-20 sm:h-20'}`}
            />
          ) : (
            <div className={`rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-gray-600 transition-all duration-200 ${
              compact ? 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg' : 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl'
            }`}>
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Name label */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent ${compact ? 'p-1 sm:p-1.5' : 'p-2 sm:p-3'}`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`text-white font-medium truncate ${compact ? 'text-[9px] sm:text-[10px]' : 'text-xs sm:text-sm'}`}>
            {isLocal ? `${displayName} (You)` : displayName}
          </span>
          {isMuted && (
            <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-600/90 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1.5 4.5l21 15M10.5 5.5V3a1.5 1.5 0 113 0v7.5c0 .166-.027.326-.076.477m-1.924 1.523A1.5 1.5 0 019 10.5V8m-3 2.5a6 6 0 0011.25 3m.75-12l-21 15" stroke="currentColor" fill="none" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            </span>
          )}
          {isScreenSharing && (
            <span className="flex-shrink-0 px-1 sm:px-1.5 py-0.5 rounded bg-green-600/90 text-[8px] sm:text-[10px] text-white font-medium">
              Screen
            </span>
          )}
        </div>
      </div>

      {/* Hover controls — fullscreen + pin */}
      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 sm:gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        {/* Fullscreen */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          title="Toggle fullscreen"
        >
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
          </svg>
        </button>
        {/* Pin */}
        {onPin && (
          <button
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm ${
              isPinned
                ? 'bg-blue-600/80 hover:bg-blue-700 text-white'
                : 'bg-black/60 hover:bg-black/80 text-white'
            }`}
            title={isPinned ? 'Unpin' : 'Pin to spotlight'}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
            </svg>
          </button>
        )}
      </div>

      {/* Speaking indicator */}
      {!isMuted && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/0 group-hover:ring-blue-500/20 transition-all duration-200 pointer-events-none" />
      )}

      {/* Floating emoji reaction */}
      {reaction && (
        <div
          key={reaction.id}
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
        >
          <span
            className="text-4xl sm:text-5xl drop-shadow-lg"
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
