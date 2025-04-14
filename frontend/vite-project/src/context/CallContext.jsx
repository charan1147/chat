import { createContext, useState, useRef, useContext, useEffect } from 'react';
import { ChatContext } from './ChatContext';
import { io } from 'socket.io-client';

export const CallContext = createContext();

export function CallProvider({ children }) {
  const { user } = useContext(ChatContext);
  const [callActive, setCallActive] = useState(false);
  const [caller, setCaller] = useState(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const socketRef = useRef(null); // Changed to ref for better control

  useEffect(() => {
    if (!user || !user._id) return;

    socketRef.current = io('https://chat-7-jbot.onrender.com', {
      withCredentials: true,
      query: { userId: user._id },
      reconnection: true, // Enable automatic reconnection
      reconnectionAttempts: 5, // Limit reconnection attempts
      reconnectionDelay: 1000, // Delay between attempts (1 second)
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('callOffer', ({ from, signal, isVideo }) => {
      setCaller(from);
      handleOffer(signal, isVideo);
    });

    socketRef.current.on('callAnswer', (signal) => handleAnswer(signal));
    socketRef.current.on('ice-candidate', (candidate) => handleCandidate(candidate));
    socketRef.current.on('endCall', () => endCall());

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('reconnect', () => {
      console.log('Socket reconnected');
      if (user._id) socketRef.current.emit('join', user._id);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const startCall = async (email, isVideo) => {
    setCallActive(true);
    const pc = new RTCPeerConnection();
    peerConnection.current = pc;

    try {
      // Map email to _id
      const response = await fetch(`https://chat-7-jbot.onrender.com/api/auth/me?email=${encodeURIComponent(email)}`, {
        credentials: 'include',
      });
      const data = await response.json();
      const toId = data.data?._id;
      if (!toId) throw new Error('Recipient not found');

      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      localStream.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        remoteStream.current = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', { to: toId, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('callOffer', { to: toId, signal: offer, isVideo });

      return pc;
    } catch (error) {
      console.error('Call setup failed:', error);
      endCall();
    }
  };

  const handleOffer = async (signal, isVideo) => {
    setCallActive(true);
    const pc = peerConnection.current || new RTCPeerConnection();
    peerConnection.current = pc;

    try {
      if (!localStream.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
        localStream.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.ontrack = (event) => {
        remoteStream.current = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', { to: caller, candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('callAnswer', { to: caller, answer });
    } catch (error) {
      console.error('Offer handling failed:', error);
      endCall();
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Answer handling failed:', error);
    }
  };

  const handleCandidate = async (candidate) => {
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Candidate handling failed:', error);
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    remoteStream.current = null;
    setCallActive(false);
    setCaller(null);
    if (socketRef.current) socketRef.current.emit('endCall', { to: caller || user._id });
  };

  return (
    <CallContext.Provider value={{ callActive, caller, startCall, handleOffer, handleAnswer, handleCandidate, endCall, remoteStream }}>
      {children}
    </CallContext.Provider>
  );
}