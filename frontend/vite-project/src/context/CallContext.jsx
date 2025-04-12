import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import socket from '../socket';
import { AuthContext } from './AuthContext';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [call, setCall] = useState(null);
  const [stream, setStream] = useState(null);
  const peerRef = useRef(null);

  useEffect(() => {
    if (user) {
      socket.on('offer', async ({ from, offer }) => {
        setCall({ from, offer, isIncoming: true });
      });

      socket.on('answer', ({ answer }) => {
        if (peerRef.current) {
          peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on('ice-candidate', ({ candidate }) => {
        if (peerRef.current) {
          peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('endCall', () => {
        endCall();
      });

      return () => {
        socket.off('offer');
        socket.off('answer');
        socket.off('ice-candidate');
        socket.off('endCall');
      };
    }
  }, [user]);

  const startCall = async (to, video = true) => {
    try {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerRef.current = peer;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
      setStream(stream);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to, candidate: event.candidate });
        }
      };

      peer.ontrack = (event) => {
        setCall((prev) => ({ ...prev, remoteStream: event.streams[0] }));
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('offer', { to, offer });
      setCall({ to, peer, video });
    } catch (err) {
      console.error('Start call error:', err);
    }
  };

  const answerCall = async () => {
    try {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerRef.current = peer;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.video });
      setStream(stream);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: call.from, candidate: event.candidate });
        }
      };

      peer.ontrack = (event) => {
        setCall((prev) => ({ ...prev, remoteStream: event.streams[0] }));
      };

      await peer.setRemoteDescription(new RTCSessionDescription(call.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('answer', { to: call.from, answer });
      setCall((prev) => ({ ...prev, peer, isIncoming: false }));
    } catch (err) {
      console.error('Answer call error:', err);
    }
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    socket.emit('endCall', { to: call?.to || call?.from });
    setCall(null);
    setStream(null);
    peerRef.current = null;
  };

  return (
    <CallContext.Provider value={{ call, stream, startCall, answerCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
};