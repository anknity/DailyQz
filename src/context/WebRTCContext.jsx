import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';

const WebRTCContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const WebRTCProvider = ({ roomId, children }) => {
  const { socket } = useSocket();

  // Local media
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Remote streams: Map<socketId, { stream, displayName, isMuted, isCameraOff, isScreenSharing }>
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  // Refs
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // Map<socketId, RTCPeerConnection>
  const pendingCandidatesRef = useRef(new Map()); // Buffer ICE candidates before remote desc

  // ─────────────── GET USER MEDIA ───────────────

  const initLocalStream = useCallback(async ({ video = true, audio = true } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1920, min: 640 }, height: { ideal: 1080, min: 480 }, frameRate: { ideal: 30, min: 15 }, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      // Try audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOff(true);
        return stream;
      } catch (audioErr) {
        console.error('Failed to get any media:', audioErr);
        return null;
      }
    }
  }, []);

  // ─────────────── PEER CONNECTION ───────────────

  const createPeerConnection = useCallback((targetSocketId, targetName) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          roomId,
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          const existing = next.get(targetSocketId) || {};
          next.set(targetSocketId, {
            ...existing,
            stream: remoteStream,
            displayName: targetName || existing.displayName || 'Participant',
          });
          return next;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn(`ICE connection ${pc.iceConnectionState} for ${targetSocketId}`);
      }
      if (pc.iceConnectionState === 'closed') {
        cleanupPeerConnection(targetSocketId);
      }
    };

    peerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  }, [socket, roomId]);

  const cleanupPeerConnection = useCallback((targetSocketId) => {
    const pc = peerConnectionsRef.current.get(targetSocketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(targetSocketId);
    }
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.delete(targetSocketId);
      return next;
    });
    pendingCandidatesRef.current.delete(targetSocketId);
  }, []);

  // ─────────────── SIGNALING ───────────────

  // Create offer and send to target
  const createOffer = useCallback(async (targetSocketId, targetName) => {
    const pc = createPeerConnection(targetSocketId, targetName);
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socket?.emit('offer', { roomId, targetSocketId, offer });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection, socket, roomId]);

  // Handle incoming offer
  const handleOffer = useCallback(async ({ offer, senderSocketId, senderName }) => {
    const pc = createPeerConnection(senderSocketId, senderName);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush pending ICE candidates
      const pending = pendingCandidatesRef.current.get(senderSocketId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(senderSocketId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('answer', { roomId, targetSocketId: senderSocketId, answer });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, socket, roomId]);

  // Handle incoming answer
  const handleAnswer = useCallback(async ({ answer, senderSocketId }) => {
    const pc = peerConnectionsRef.current.get(senderSocketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush pending ICE candidates
        const pending = pendingCandidatesRef.current.get(senderSocketId) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current.delete(senderSocketId);
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async ({ candidate, senderSocketId }) => {
    const pc = peerConnectionsRef.current.get(senderSocketId);
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    } else {
      // Buffer until remote description is set
      if (!pendingCandidatesRef.current.has(senderSocketId)) {
        pendingCandidatesRef.current.set(senderSocketId, []);
      }
      pendingCandidatesRef.current.get(senderSocketId).push(candidate);
    }
  }, []);

  // ─────────────── MEDIA CONTROLS ───────────────

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socket?.emit('media-state-change', {
          roomId,
          isMuted: !audioTrack.enabled,
        });
      }
    }
  }, [socket, roomId]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        socket?.emit('media-state-change', {
          roomId,
          isCameraOff: !videoTrack.enabled,
        });
      }
    }
  }, [socket, roomId]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      for (const [, pc] of peerConnectionsRef.current) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      socket?.emit('media-state-change', { roomId, isScreenSharing: true });

      // Handle user stopping screen share via browser UI
      videoTrack.onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (err) {
      console.error('Screen share error:', err);
      return null;
    }
  }, [socket, roomId]);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);

      // Restore camera track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          for (const [, pc] of peerConnectionsRef.current) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(videoTrack);
            }
          }
        }
      }

      socket?.emit('media-state-change', { roomId, isScreenSharing: false });
    }
  }, [socket, roomId]);

  // ─────────────── SOCKET EVENT LISTENERS ───────────────

  useEffect(() => {
    if (!socket) return;

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    // When a new user joins, create offer to them
    socket.on('user-joined', ({ participant }) => {
      if (participant?.socketId && localStreamRef.current) {
        // Small delay to allow the new peer to set up
        setTimeout(() => {
          createOffer(participant.socketId, participant.displayName);
        }, 500);
      }
    });

    // When a user leaves, cleanup their connection
    socket.on('user-left', ({ socketId }) => {
      cleanupPeerConnection(socketId);
    });

    // Update remote peer media state
    socket.on('participant-media-changed', ({ socketId, isMuted, isCameraOff, isScreenSharing }) => {
      setRemoteStreams(prev => {
        const next = new Map(prev);
        const existing = next.get(socketId);
        if (existing) {
          next.set(socketId, { ...existing, isMuted, isCameraOff, isScreenSharing });
        }
        return next;
      });
    });

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('participant-media-changed');
    };
  }, [socket, handleOffer, handleAnswer, handleIceCandidate, createOffer, cleanupPeerConnection]);

  // ─────────────── CLEANUP ───────────────

  const cleanup = useCallback(() => {
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    // Close all peer connections
    for (const [id] of peerConnectionsRef.current) {
      cleanupPeerConnection(id);
    }
    setRemoteStreams(new Map());
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, [cleanupPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

  const value = {
    // Stream state
    localStream,
    screenStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    isScreenSharing,

    // Actions
    initLocalStream,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    createOffer,
    cleanup,
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

export default WebRTCContext;
