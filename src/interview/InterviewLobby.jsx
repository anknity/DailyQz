import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/Layout';

/**
 * InterviewLobby — Create or join interview rooms
 * Shows active rooms and allows creating new ones
 */
const InterviewLobby = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { socket, isConnected } = useSocket();

  const [activeRooms, setActiveRooms] = useState([]);
  const [roomTitle, setRoomTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null); // { id, title }
  const [linkCopied, setLinkCopied] = useState(false);

  // Fetch active rooms
  const fetchRooms = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit('get-active-rooms', (res) => {
      if (res?.rooms) setActiveRooms(res.rooms);
    });
  }, [socket, isConnected]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Listen for new rooms
  useEffect(() => {
    if (!socket) return;
    const handleCreated = () => fetchRooms();
    socket.on('interview-created', handleCreated);
    return () => socket.off('interview-created', handleCreated);
  }, [socket, fetchRooms]);

  // Create room
  const handleCreate = () => {
    if (!socket || !isConnected) return setError('Not connected to server');
    setCreating(true);
    setError('');

    socket.emit('create-room', {
      title: roomTitle.trim() || 'Interview Room',
    }, (res) => {
      setCreating(false);
      if (res?.error) return setError(res.error);
      if (res?.room?.id) {
        setCreatedRoom(res.room);
        setRoomTitle('');
        fetchRooms();
      }
    });
  };

  // Copy invite link
  const handleCopyLink = (roomId) => {
    const url = `${window.location.origin}/interview/${roomId}`;
    navigator.clipboard.writeText(url).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // Join room via code
  const handleJoin = (e) => {
    e?.preventDefault();
    let code = joinCode.trim();
    // Support pasting full URLs like https://host/interview/abc123
    const urlMatch = code.match(/\/interview\/([^/?#]+)/);
    if (urlMatch) code = urlMatch[1];
    if (!code) return setError('Enter a room ID or paste a link');
    navigate(`/interview/${code}`);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Interview Room</h1>
              <p className="text-gray-400 text-sm">Create or join a live mock interview session</p>
            </div>
          </div>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            Connecting to server...
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Create / Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Create */}
          <div className="bg-[#12122a] border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Interview
            </h2>

            {createdRoom ? (
              /* Room Created — share panel */
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                  <p className="text-green-400 text-sm font-semibold mb-1">Room Created!</p>
                  <p className="text-white font-bold text-base truncate">{createdRoom.title}</p>
                </div>
                <div className="flex items-center gap-2 bg-[#0a0a1a] border border-gray-700/50 rounded-xl px-3 py-2">
                  <span className="text-gray-400 text-xs font-mono flex-1 truncate">
                    {window.location.origin}/interview/{createdRoom.id}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyLink(createdRoom.id)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    linkCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  {linkCopied ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Link Copied!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>Copy Invite Link</>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/interview/${createdRoom.id}`)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Enter Room
                </button>
                <button
                  onClick={() => setCreatedRoom(null)}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Create another room
                </button>
              </div>
            ) : (
              /* Create form */
              <>
                <input
                  type="text"
                  value={roomTitle}
                  onChange={e => setRoomTitle(e.target.value)}
                  placeholder="Room title (optional)"
                  className="w-full bg-[#0a0a1a] border border-gray-700/50 text-white rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-500"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !isConnected}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Start New Interview
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Join */}
          <div className="bg-[#12122a] border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Join Interview
            </h2>
            <form onSubmit={handleJoin}>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="Paste room ID or link"
                className="w-full bg-[#0a0a1a] border border-gray-700/50 text-white rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500 font-mono"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Join Room
              </button>
            </form>
          </div>
        </div>

        {/* Active Rooms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Active Rooms ({activeRooms.length})
            </h2>
            <button onClick={fetchRooms} className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Refresh
            </button>
          </div>

          {activeRooms.length === 0 ? (
            <div className="bg-[#12122a] border border-gray-700/50 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">📹</div>
              <p className="text-gray-400">No active rooms right now</p>
              <p className="text-gray-500 text-sm mt-1">Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map(room => (
                <div key={room.id} className="bg-[#12122a] border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-medium text-sm truncate flex-1">{room.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      room.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {room.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {room.hostName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-xs text-gray-400">{room.hostName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      {room.participants?.length || 0}/{room.maxParticipants || 5}
                    </span>
                    <button
                      onClick={() => navigate(`/interview/${room.id}`)}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InterviewLobby;
