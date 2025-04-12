import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:5007/auth/me', {
          withCredentials: true,
        });
        setUser(res.data.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Requesting: http://localhost:5007/auth/login');
      const res = await axios.post(
        'http://localhost:5007/auth/login',
        { email, password },
        { withCredentials: true }
      );
      setUser(res.data.data);
      return true;
    } catch (err) {
      console.log('Login error full:', err);
      console.log('Error code:', err.code);
      console.log('Response:', err.response);
      console.log('Response data:', err.response?.data);
      console.log('Thrown message:', err.response?.data?.message || 'Login failed');
      throw err.response?.data?.message || 'Login failed';
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(
        'http://localhost:5007/auth/register',
        { username, email, password },
        { withCredentials: true }
      );
      setUser(res.data.data);
      return true;
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5007/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};






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




import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import socket from '../socket';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user || !user._id) {
      console.log('No user or user._id available, skipping ChatProvider setup');
      return;
    }

    socket.io.opts.query.userId = user._id;
    socket.connect();
    socket.emit('join', user._id);
    console.log('Socket connected:', socket.connected, 'User ID:', user._id);

    const loadAllMessages = async () => {
      try {
        const res = await axios.get('http://localhost:5007/messages/all', {
          withCredentials: true,
        });
        if (!res.data.data) {
          console.log('No messages data received');
          return;
        }
        const allMessages = res.data.data.reduce((acc, msg) => {
          const fromId = msg.from && msg.from._id ? msg.from._id.toString() : null;
          const toId = msg.to && msg.to._id ? msg.to._id.toString() : null;
          if (!fromId || !toId) {
            console.error('Invalid message structure, skipping:', msg);
            return acc;
          }
          const key = fromId === user._id.toString() ? toId : fromId;
          acc[key] = [...(acc[key] || []), {
            ...msg,
            username: fromId === user._id.toString() ? 'You' : (msg.from && msg.from.username ? msg.from.username : 'Unknown'),
          }];
          return acc;
        }, {});
        setMessages(allMessages);
        console.log('Loaded all messages:', allMessages);
      } catch (err) {
        console.error('Load all messages error:', err.message, err.response?.data);
      }
    };
    loadAllMessages();

    socket.on('newMessage', (message) => {
      console.log('Received message:', message);
      const fromId = message.from && message.from._id ? message.from._id.toString() : null;
      const toId = message.to && message.to._id ? message.to._id.toString() : null;
      if (!fromId || !toId) {
        console.error('Invalid message from socket:', message);
        return;
      }
      setMessages((prev) => {
        const key = fromId === user._id.toString() ? toId : fromId;
        const updated = {
          ...prev,
          [key]: [...(prev[key] || []), {
            ...message,
            username: fromId === user._id.toString() ? 'You' : (message.from && message.from.username ? message.from.username : 'Unknown'),
          }],
        };
        console.log('Updated messages:', updated);
        return updated;
      });
    });

    socket.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        for (const key in updated) {
          updated[key] = updated[key].filter((msg) => msg._id !== messageId);
        }
        return updated;
      });
    });

    socket.on('error', (err) => console.error('Socket error:', err.message));

    return () => {
      socket.off('newMessage');
      socket.off('messageDeleted');
      socket.off('error');
      socket.disconnect();
    };
  }, [user]);

  const fetchMessages = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5007/messages/${userId}`, {
        withCredentials: true,
      });
      console.log('Fetch messages response:', res.data.data); // Debug log
      setMessages((prev) => ({
        ...prev,
        [userId]: res.data.data.map(msg => {
          const fromId = msg.from && msg.from._id ? msg.from._id.toString() : null;
          if (!fromId) {
            console.error('Invalid from in message:', msg);
            return { ...msg, username: 'Unknown' };
          }
          return {
            ...msg,
            username: fromId === user._id.toString() ? 'You' : (msg.from && msg.from.username ? msg.from.username : 'Unknown'),
          };
        }),
      }));
    } catch (err) {
      console.error('Fetch messages error:', err.message, err.response?.data);
    }
  };

  const sendMessage = (to, content) => {
    if (!user || !user._id || !to) {
      console.error('Invalid sendMessage parameters:', { user, to });
      return;
    }
    const message = { from: user._id, to, content, type: 'text' };
    console.log('Sending message:', message);
    socket.emit('sendMessage', message);
    setMessages((prev) => ({
      ...prev,
      [to]: [...(prev[to] || []), { ...message, username: 'You', isRead: false }],
    }));
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`http://localhost:5007/messages/${messageId}`, {
        withCredentials: true,
      });
      setMessages((prev) => {
        const updated = { ...prev };
        for (const userId in updated) {
          updated[userId] = updated[userId].filter((msg) => msg._id !== messageId);
        }
        return updated;
      });
    } catch (err) {
      console.error('Delete message error:', err.message);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, selectedUser, setSelectedUser, fetchMessages, sendMessage, deleteMessage }}>
      {children}
    </ChatContext.Provider>
  );
};




import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get('http://localhost:5007/contacts', {
        withCredentials: true,
      });
      setContacts(res.data.data);
    } catch (err) {
      console.error('Fetch contacts error:', err);
    }
  };

  const addContact = async (email) => {
    try {
      const res = await axios.post(
        'http://localhost:5007/contacts/add',
        { email },
        { withCredentials: true }
      );
      setContacts((prev) => [...prev, res.data.data]); // Expects { _id, username, email }
    } catch (err) {
      console.error('Add contact error:', err);
      throw err.response?.data?.message || 'Failed to add contact';
    }
  };

  const removeContact = async (contactId) => {
    try {
      await axios.delete(`http://localhost:5007/contacts/${contactId}`, {
        withCredentials: true,
      });
      setContacts((prev) => prev.filter((contact) => contact._id !== contactId));
    } catch (err) {
      console.error('Remove contact error:', err);
    }
  };

  return (
    <ContactContext.Provider value={{ contacts, fetchContacts, addContact, removeContact }}>
      {children}
    </ContactContext.Provider>
  );
};




import io from 'socket.io-client';

const socket = io('http://localhost:5007', {
  withCredentials: true,
  autoConnect: false,
  query: { userId: '' }, // Will set dynamically
});

export default socket;