import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/**
 * ChatPanel — Side panel for room-based real-time messaging
 */
const ChatPanel = ({ roomId, isOpen, onClose }) => {
  const { socket } = useSocket();
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Listen for messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleTyping = ({ displayName, userId }) => {
      if (userId !== currentUser?.uid) {
        setTypingUsers(prev => {
          if (prev.find(u => u.userId === userId)) return prev;
          return [...prev, { userId, displayName }];
        });
        // Remove typing indicator after 3s
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        }, 3000);
      }
    };

    socket.on('receive-message', handleMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('receive-message', handleMessage);
      socket.off('typing', handleTyping);
    };
  }, [socket, currentUser?.uid]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send typing indicator
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socket && roomId) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', { roomId });
      typingTimeoutRef.current = setTimeout(() => {}, 2000);
    }
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim() || !socket || !roomId) return;

    socket.emit('send-message', { roomId, text: input.trim() }, (res) => {
      if (res?.error) console.error('Send message error:', res.error);
    });
    setInput('');
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-[#1a1a2e] border-l border-gray-700/50 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0">
        <h3 className="text-white font-semibold">In-call messages</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>No messages yet.</p>
            <p className="mt-1">Messages are only visible to people in the call.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-xs text-gray-400 mb-1">{msg.senderName}</span>
              )}
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                isMe
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-gray-700/80 text-gray-200 rounded-bl-md'
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{formatTime(msg.timestamp)}</span>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <div className="text-xs text-gray-400 italic">
            {typingUsers.map(u => u.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Send a message..."
            className="flex-1 bg-gray-800/80 text-white text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
