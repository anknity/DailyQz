import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Dynamically import socket.io-client
let io = null;
const getIO = async () => {
  if (!io) {
    const module = await import('socket.io-client');
    io = module.io || module.default;
  }
  return io;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [examNotifications, setExamNotifications] = useState([]);
  const socketRef = useRef(null);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;

    const connectSocket = async () => {
      const ioClient = await getIO();
      
      const newSocket = ioClient(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        if (!mounted) return;
        console.log('🔌 Socket connected');
        setIsConnected(true);

        // Authenticate after connection
        newSocket.emit('authenticate', {
          userId: currentUser.uid,
          displayName: userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0],
          photoUrl: userProfile?.photoURL || currentUser.photoURL,
        });

        // Subscribe to notifications
        newSocket.emit('subscribe-notifications', { userId: currentUser.uid });
      });

      newSocket.on('disconnect', () => {
        if (!mounted) return;
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('authenticated', () => {
        console.log('✅ Socket authenticated');
      });

      // Global notification handler
      newSocket.on('notification', (notification) => {
        setNotifications(prev => [{ ...notification, read: false, timestamp: notification.timestamp || Date.now() }, ...prev].slice(0, 50));
      });

      // Exam notification handler
      newSocket.on('exam-notification', (notification) => {
        setExamNotifications(prev => [notification, ...prev].slice(0, 20));
        setNotifications(prev => [{
          ...notification,
          type: 'exam',
          read: false,
          timestamp: Date.now(),
          title: notification.data?.title || 'Exam Update',
          message: getExamNotificationMessage(notification),
        }, ...prev].slice(0, 50));
      });

      // Exam reminder handler
      newSocket.on('exam-reminder', (reminder) => {
        setNotifications(prev => [{
          type: 'exam-reminder',
          read: false,
          timestamp: Date.now(),
          title: `Exam Reminder: ${reminder.title || 'Upcoming Exam'}`,
          message: `Your exam starts soon!`,
          ...reminder,
        }, ...prev].slice(0, 50));
      });

      newSocket.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
      });

      socketRef.current = newSocket;
      if (mounted) setSocket(newSocket);
    };

    connectSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser?.uid]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearExamNotifications = useCallback(() => {
    setExamNotifications([]);
  }, []);

  // Send exam notification (admin)
  const sendExamNotification = useCallback((type, data) => {
    if (socketRef.current) {
      socketRef.current.emit('exam-notification', { type, data });
    }
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    examNotifications,
    clearNotifications,
    clearExamNotifications,
    sendExamNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    // Return safe defaults when used outside provider
    return {
      socket: null,
      isConnected: false,
      notifications: [],
      examNotifications: [],
      clearNotifications: () => {},
      clearExamNotifications: () => {},
      sendExamNotification: () => {},
    };
  }
  return context;
};

function getExamNotificationMessage(notification) {
  switch (notification.type) {
    case 'exam-created': return `New exam: ${notification.data?.title || 'Check it out!'}`;
    case 'exam-starting-soon': return `Exam starting soon: ${notification.data?.title}`;
    case 'exam-started': return `Exam has started: ${notification.data?.title}`;
    case 'exam-ended': return `Exam has ended: ${notification.data?.title}`;
    case 'results-available': return `Results available: ${notification.data?.title}`;
    default: return notification.data?.message || 'Exam notification';
  }
}

export default SocketContext;
