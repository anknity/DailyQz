import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';

const WebRTCContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Free TURN relay — needed when mobile carrier NAT blocks STUN
    { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

export const WebRTCProvider = ({ roomId, children }) => {
  const { socket, isConnected } = useSocket();

  // Local media
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  // Remote streams: Map<socketId, { stream, displayName, isMuted, isCameraOff, isScreenSharing }>
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  // Refs
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // Map<socketId, RTCPeerConnection>
  const pendingCandidatesRef = useRef(new Map()); // Buffer ICE candidates before remote desc
  const facingModeRef = useRef('user');
  const wasConnectedRef = useRef(false); // Track if we were previously connected (for reconnection)
  const roomIdRef = useRef(roomId);
  const isDeafenedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { isDeafenedRef.current = isDeafened; }, [isDeafened]);

  // ─────────────── GET USER MEDIA ───────────────

  const initLocalStream = useCallback(async ({ video = true, audio = true } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: facingModeRef.current } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get user media (trying lower quality):', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { facingMode: facingModeRef.current } : false,
          audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (lowErr) {
        console.error('Failed with minimal constraints, trying audio only:', lowErr);
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
    }
  }, []);

  // ─────────────── PEER CONNECTION ───────────────

  const createPeerConnection = useCallback((targetSocketId, targetName) => {
    // Re-use existing PC if it's still healthy
    if (peerConnectionsRef.current.has(targetSocketId)) {
      const existing = peerConnectionsRef.current.get(targetSocketId);
      if (existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
        return existing;
      }
      existing.close();
      peerConnectionsRef.current.delete(targetSocketId);
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
          roomId: roomIdRef.current,
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const next = new Map(prev);
        const existing = next.get(targetSocketId) || {};

        let allTracks;
        if (event.streams && event.streams.length > 0) {
          allTracks = event.streams[0].getTracks();
        } else {
          const prevTracks = existing.stream ? existing.stream.getTracks() : [];
          allTracks = [...prevTracks.filter(t => t.id !== event.track.id), event.track];
        }

        const newStream = new MediaStream(allTracks);

        // If user is deafened, mute incoming audio tracks
        if (isDeafenedRef.current) {
          newStream.getAudioTracks().forEach(t => { t.enabled = false; });
        }

        next.set(targetSocketId, {
          ...existing,
          stream: newStream,
          displayName: targetName || existing.displayName || 'Participant',
        });
        return next;
      });
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state → ${pc.iceConnectionState} for ${targetSocketId}`);
      if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE failed — attempting ICE restart');
        pc.restartIce();
      }
      if (pc.iceConnectionState === 'disconnected') {
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            console.warn('[WebRTC] Still disconnected — restarting ICE');
            pc.restartIce();
          }
        }, 3000);
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

  const createOffer = useCallback(async (targetSocketId, targetName) => {
    const pc = createPeerConnection(targetSocketId, targetName);
    try {
      if (pc.signalingState !== 'stable') {
        console.warn(`[WebRTC] Skipping createOffer — state is "${pc.signalingState}"`);
        return;
      }
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);
      socket?.emit('offer', { roomId: roomIdRef.current, targetSocketId, offer });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection, socket, roomId]);

  const handleOffer = useCallback(async ({ offer, senderSocketId, senderName }) => {
    const pc = createPeerConnection(senderSocketId, senderName);
    try {
      if (pc.signalingState === 'have-local-offer') {
        console.warn('[WebRTC] Glare detected — rolling back local offer');
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const pending = pendingCandidatesRef.current.get(senderSocketId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(senderSocketId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('answer', { roomId: roomIdRef.current, targetSocketId: senderSocketId, answer });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, socket, roomId]);

  const handleAnswer = useCallback(async ({ answer, senderSocketId }) => {
    const pc = peerConnectionsRef.current.get(senderSocketId);
    if (!pc) return;

    if (pc.signalingState !== 'have-local-offer') {
      console.warn(`[WebRTC] Ignoring answer — state is "${pc.signalingState}" (expected "have-local-offer")`);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      const pending = pendingCandidatesRef.current.get(senderSocketId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(senderSocketId);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, []);

  const handleIceCandidate = useCallback(async ({ candidate, senderSocketId }) => {
    const pc = peerConnectionsRef.current.get(senderSocketId);
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    } else {
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
          roomId: roomIdRef.current,
          isMuted: !audioTrack.enabled,
        });
      }
    }
  }, [socket]);

  // ─── Camera toggle — re-acquire fresh track to fix blank screen bug ───
  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

    if (currentVideoTrack && currentVideoTrack.enabled) {
      // Turning camera OFF — stop the track entirely to release hardware
      currentVideoTrack.enabled = false;
      currentVideoTrack.stop();
      localStreamRef.current.removeTrack(currentVideoTrack);
      setIsCameraOff(true);
      socket?.emit('media-state-change', { roomId: roomIdRef.current, isCameraOff: true });
    } else {
      // Turning camera ON — get a fresh video track
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: facingModeRef.current },
          audio: false,
        });
        const newVideoTrack = newVideoStream.getVideoTracks()[0];

        // Add new track to local stream
        localStreamRef.current.addTrack(newVideoTrack);

        // Replace track on all peer connections so remotes get the new feed
        for (const [, pc] of peerConnectionsRef.current) {
          const sender = pc.getSenders().find(s => s.track === null || s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          } else {
            // If no video sender exists, add one
            pc.addTrack(newVideoTrack, localStreamRef.current);
          }
        }

        // Force React to see the new stream reference
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        localStreamRef.current = new MediaStream(localStreamRef.current.getTracks());

        setIsCameraOff(false);
        socket?.emit('media-state-change', { roomId: roomIdRef.current, isCameraOff: false });
      } catch (err) {
        console.error('Failed to re-acquire camera:', err);
      }
    }
  }, [socket]);

  // ─── Deafen: mute all incoming audio for yourself ───
  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => {
      const newVal = !prev;
      isDeafenedRef.current = newVal;
      // Toggle all remote audio tracks
      for (const [, remote] of remoteStreams) {
        if (remote.stream) {
          remote.stream.getAudioTracks().forEach(t => { t.enabled = !newVal; });
        }
      }
      return newVal;
    });
  }, [remoteStreams]);

  // ─── Flip camera (front/back) for mobile ───
  const flipCamera = useCallback(async () => {
    const newMode = facingModeRef.current === 'user' ? 'environment' : 'user';
    facingModeRef.current = newMode;
    setFacingMode(newMode);

    try {
      // Stop current video tracks
      const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
        localStreamRef.current.removeTrack(currentVideoTrack);
      }

      // Get new stream with flipped camera
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];

      // Add to local stream
      localStreamRef.current.addTrack(newVideoTrack);

      // Replace on all peer connections
      for (const [, pc] of peerConnectionsRef.current) {
        const sender = pc.getSenders().find(s => s.track === null || s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // Force React re-render
      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
      setIsCameraOff(false);
    } catch (err) {
      console.error('Failed to flip camera:', err);
      // Fallback without exact constraint
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newMode },
          audio: false,
        });
        const newVideoTrack = newVideoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newVideoTrack);
        for (const [, pc] of peerConnectionsRef.current) {
          const sender = pc.getSenders().find(s => s.track === null || s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(newVideoTrack);
        }
        const updatedStream = new MediaStream(localStreamRef.current.getTracks());
        localStreamRef.current = updatedStream;
        setLocalStream(updatedStream);
        setIsCameraOff(false);
      } catch (fallbackErr) {
        console.error('Camera flip fallback failed:', fallbackErr);
      }
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      const videoTrack = stream.getVideoTracks()[0];
      for (const [, pc] of peerConnectionsRef.current) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      socket?.emit('media-state-change', { roomId: roomIdRef.current, isScreenSharing: true });

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

      socket?.emit('media-state-change', { roomId: roomIdRef.current, isScreenSharing: false });
    }
  }, [socket, roomId]);

  // ─────────────── SOCKET RECONNECTION HANDLER ───────────────

  useEffect(() => {
    if (!socket) return;

    const handleReconnect = () => {
      console.log('[WebRTC] Socket reconnected — re-joining room');
      if (roomIdRef.current) {
        // Re-join the room via socket
        socket.emit('join-room', { roomId: roomIdRef.current }, (res) => {
          if (res?.error) {
            console.error('Re-join room error:', res.error);
            return;
          }
          console.log('[WebRTC] Re-joined room after reconnect');
          // Clean up stale peer connections and re-establish
          for (const [id] of peerConnectionsRef.current) {
            cleanupPeerConnection(id);
          }
        });
      }
    };

    // 'connect' fires on initial connect AND on reconnect
    // Track if we were previously connected to differentiate
    if (isConnected && wasConnectedRef.current) {
      handleReconnect();
    }
    wasConnectedRef.current = isConnected;

  }, [socket, isConnected, cleanupPeerConnection]);

  // ─────────────── SOCKET EVENT LISTENERS ───────────────

  useEffect(() => {
    if (!socket) return;

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    // When a new user joins, create offer to them
    socket.on('user-joined', ({ participant }) => {
      if (participant?.socketId && localStreamRef.current) {
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

  // ─────────────── BANDWIDTH / QUALITY OPTIMIZATION ───────────────

  useEffect(() => {
    // Apply bandwidth constraints after peer connections are established
    const applyBandwidthConstraints = () => {
      for (const [, pc] of peerConnectionsRef.current) {
        const senders = pc.getSenders();
        for (const sender of senders) {
          if (sender.track?.kind === 'video') {
            try {
              const params = sender.getParameters();
              if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
              }
              // Cap at 1.5 Mbps for video — good quality without overloading mobile
              params.encodings[0].maxBitrate = 1500000;
              params.encodings[0].scaleResolutionDownBy = 1;
              sender.setParameters(params).catch(() => {});
            } catch (e) { /* browser may not support */ }
          }
          if (sender.track?.kind === 'audio') {
            try {
              const params = sender.getParameters();
              if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
              }
              params.encodings[0].maxBitrate = 128000;
              sender.setParameters(params).catch(() => {});
            } catch (e) { /* browser may not support */ }
          }
        }
      }
    };

    // Apply after a short delay to let connections establish
    const timer = setTimeout(applyBandwidthConstraints, 3000);
    return () => clearTimeout(timer);
  }, [remoteStreams]); // Re-apply when new peers connect

  // ─────────────── CLEANUP ───────────────

  const cleanup = useCallback(() => {
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
    for (const [id] of peerConnectionsRef.current) {
      cleanupPeerConnection(id);
    }
    setRemoteStreams(new Map());
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setIsDeafened(false);
    isDeafenedRef.current = false;
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
    isDeafened,
    facingMode,

    // Actions
    initLocalStream,
    toggleMute,
    toggleCamera,
    toggleDeafen,
    flipCamera,
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
