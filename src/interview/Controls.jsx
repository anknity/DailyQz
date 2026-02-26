import { useState } from 'react';
import { useWebRTC } from '../context/WebRTCContext';

const EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🔥', '🎉', '😢', '😡', '💯', '✅', '🙌'];

const FILTERS = [
  { key: 'none',      label: 'Normal',    preview: 'bg-gray-600' },
  { key: 'blur',      label: 'Blur BG',   preview: 'bg-blue-800' },
  { key: 'grayscale', label: 'Grayscale', preview: 'bg-gray-500' },
  { key: 'sepia',     label: 'Sepia',     preview: 'bg-yellow-800' },
  { key: 'warm',      label: 'Warm',      preview: 'bg-orange-700' },
  { key: 'cool',      label: 'Cool',      preview: 'bg-sky-700' },
  { key: 'vivid',     label: 'Vivid',     preview: 'bg-purple-700' },
];

/**
 * ControlBar — Bottom bar with mic, camera, screen share, reactions, filters, and leave controls
 */
const ControlBar = ({
  onLeave,
  onToggleChat,
  onToggleParticipants,
  chatUnread = 0,
  onReaction,
  videoFilter = 'none',
  onFilterChange,
}) => {
  const { isMuted, isCameraOff, isScreenSharing, toggleMute, toggleCamera, startScreenShare, stopScreenShare } = useWebRTC();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const handleEmoji = (emoji) => {
    onReaction?.(emoji);
    setShowEmojiPicker(false);
  };

  const handleFilter = (filter) => {
    onFilterChange?.(filter);
    setShowFilterPicker(false);
  };

  return (
    <div className="relative flex-shrink-0">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#1a1a2e] border border-gray-600/50 rounded-2xl p-3 shadow-2xl z-50">
          <div className="grid grid-cols-6 gap-1.5">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => handleEmoji(e)}
                className="w-10 h-10 rounded-xl hover:bg-white/10 text-2xl flex items-center justify-center transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Picker */}
      {showFilterPicker && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#1a1a2e] border border-gray-600/50 rounded-2xl p-3 shadow-2xl z-50">
          <p className="text-xs text-gray-400 mb-2 font-medium text-center">Camera Filter</p>
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => handleFilter(f.key)}
                className={`flex flex-col items-center gap-1 group`}
              >
                <div className={`w-10 h-10 rounded-xl ${f.preview} transition-all ${videoFilter === f.key ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`} />
                <span className={`text-[9px] ${videoFilter === f.key ? 'text-white' : 'text-gray-500'}`}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-20 bg-[#1a1a2e] border-t border-gray-700/50 flex items-center justify-center px-4 gap-3">
        {/* Toggle Mic */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700/80 hover:bg-gray-600 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5m14 0v4a2 2 0 01-2 2H7m12 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2v-1m0-6V5a2 2 0 012-2h6" />
              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isCameraOff ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700/80 hover:bg-gray-600 text-white'
          }`}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M1 1l22 22M4.5 4.5h-.75a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 003.75 19.5h10.5a2.25 2.25 0 002.25-2.25v-.75" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          )}
        </button>

        {/* Screen Share */}
        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700/80 hover:bg-gray-600 text-white'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
          </svg>
        </button>

        {/* Emoji Reaction */}
        <button
          onClick={() => { setShowEmojiPicker(p => !p); setShowFilterPicker(false); }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            showEmojiPicker ? 'bg-yellow-500/30 text-yellow-300 ring-2 ring-yellow-500/50' : 'bg-gray-700/80 hover:bg-gray-600 text-white'
          }`}
          title="Reactions"
        >
          <span className="text-xl">😊</span>
        </button>

        {/* Background Filter */}
        <button
          onClick={() => { setShowFilterPicker(p => !p); setShowEmojiPicker(false); }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            videoFilter !== 'none' || showFilterPicker
              ? 'bg-purple-500/30 text-purple-300 ring-2 ring-purple-500/50'
              : 'bg-gray-700/80 hover:bg-gray-600 text-white'
          }`}
          title="Background filter"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        </button>

        <div className="w-px h-10 bg-gray-600 mx-2"></div>

        {/* Chat */}
        <button
          onClick={onToggleChat}
          className="relative w-12 h-12 rounded-full bg-gray-700/80 hover:bg-gray-600 text-white flex items-center justify-center transition-all"
          title="Chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {chatUnread > 9 ? '9+' : chatUnread}
            </span>
          )}
        </button>

        {/* Participants */}
        <button
          onClick={onToggleParticipants}
          className="w-12 h-12 rounded-full bg-gray-700/80 hover:bg-gray-600 text-white flex items-center justify-center transition-all"
          title="Participants"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </button>

        <div className="w-px h-10 bg-gray-600 mx-2"></div>

        {/* Leave */}
        <button
          onClick={onLeave}
          className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Leave
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
