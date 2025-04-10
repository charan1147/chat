import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://chat-4-hb4p.onrender.com', { withCredentials: true });

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [callStatus, setCallStatus] = useState(null);
  const [newContactIdentifier, setNewContactIdentifier] = useState('');
  const [messageToIdentifier, setMessageToIdentifier] = useState(''); // New state for message recipient
  const [error, setError] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => console.log('Socket.IO connected:', socket.id));
    socket.on('connect_error', (err) => console.error('Socket.IO error:', err));
    socket.on('message-error', (data) => setError(data.message)); // Handle message errors

    if (user) {
      socket.emit('join', user.id);

      axios
        .get(`https://chat-4-hb4p.onrender.com/api/users/contacts/${user.id}`, { withCredentials: true })
        .then((res) => setContacts(res.data))
        .catch((err) => console.error('Error fetching contacts:', err));

      socket.on('receive-message', (message) => {
        setMessages((prev) => [...prev, message]);
        // Auto-update contacts if new sender
        if (!contacts.some((c) => c._id === message.from)) {
          axios
            .get(`https://chat-4-hb4p.onrender.com/api/users/contacts/${user.id}`, { withCredentials: true })
            .then((res) => setContacts(res.data))
            .catch((err) => console.error('Error updating contacts:', err));
        }
      });

      socket.on('incoming-call', async ({ from, offer, callType }) => {
        setCallStatus(`Incoming ${callType} call from ${from}`);
        peerConnectionRef.current = new RTCPeerConnection();
        peerConnectionRef.current.ontrack = (event) => {
          remoteVideoRef.current.srcObject = event.streams[0];
        };
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) socket.emit('ice-candidate', { to: from, candidate: event.candidate });
        };
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer-call', { to: from, answer });
      });

      socket.on('call-answered', async ({ answer }) => {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        if (candidate) await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on('call-ended', () => {
        setCallStatus(null);
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      });

      return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('receive-message');
        socket.off('incoming-call');
        socket.off('call-answered');
        socket.off('ice-candidate');
        socket.off('call-ended');
        socket.off('message-error');
      };
    }
  }, [user]);

  const fetchMessages = async (contactId) => {
    try {
      const { data } = await axios.get(
        `https://chat-4-hb4p.onrender.com/api/messages/history/${contactId}`,
        { params: { currentUser: user.id }, withCredentials: true }
      );
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage && selectedContact) {
      const message = { from: user.id, to: selectedContact, content: newMessage };
      socket.emit('send-message', message);
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } else if (newMessage && messageToIdentifier) {
      socket.emit('send-message', { toIdentifier: messageToIdentifier, content: newMessage, from: user.id });
      setMessages((prev) => [...prev, { from: user.id, to: null, content: newMessage }]); // Temporary local update
      setNewMessage('');
      setMessageToIdentifier(''); // Clear after sending
    }
  };

  const startCall = async (callType) => {
    if (!selectedContact) return;
    peerConnectionRef.current = new RTCPeerConnection();
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice-candidate', { to: selectedContact, candidate: event.candidate });
    };
    peerConnectionRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const stream = await navigator.mediaDevices.getUserMedia(
      callType === 'video' ? { video: true, audio: true } : { audio: true }
    );
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit('call-user', { to: selectedContact, offer, callType });
    setCallStatus(`Calling ${selectedContact} (${callType})`);
  };

  const endCall = () => {
    socket.emit('end-call', { to: selectedContact });
    setCallStatus(null);
    peerConnectionRef.current.close();
    peerConnectionRef.current = null;
    localVideoRef.current.srcObject = null;
    remoteVideoRef.current.srcObject = null;
  };

  const addContact = async () => {
    if (!newContactIdentifier) {
      setError('Please enter an email or username');
      return;
    }
    try {
      const { data } = await axios.post(
        `https://chat-4-hb4p.onrender.com/api/users/contacts/${user.id}`,
        { identifier: newContactIdentifier },
        { withCredentials: true }
      );
      setContacts(data);
      setNewContactIdentifier('');
      setError(null);
    } catch (error) {
      console.error('Error adding contact:', error);
      setError(error.response?.data?.message || 'Failed to add contact');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '30%' }}>
          <h3>Contacts</h3>
          <div>
            <input
              type="text"
              value={newContactIdentifier}
              onChange={(e) => setNewContactIdentifier(e.target.value)}
              placeholder="Enter email or username"
              style={{ display: 'block', margin: '10px 0', width: '80%' }}
            />
            <button onClick={addContact} style={{ margin: '10px 0' }}>
              Add Contact
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
          <ul>
            {contacts.map((contact) => (
              <li
                key={contact._id}
                onClick={() => {
                  setSelectedContact(contact._id);
                  fetchMessages(contact._id);
                }}
                style={{ cursor: 'pointer', padding: '5px' }}
              >
                {contact.username}
              </li>
            ))}
          </ul>
          {contacts.length === 0 && <p>Select a contact to start chatting</p>}
        </div>
        <div style={{ width: '70%', paddingLeft: '20px' }}>
          {selectedContact ? (
            <>
              <h3>Chat</h3>
              <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
                {messages.map((msg, idx) => (
                  <p key={idx}>
                    <strong>{msg.from === user.id ? 'You' : 'Them'}:</strong> {msg.content}
                  </p>
                ))}
              </div>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                style={{ width: '50%', margin: '10px 0' }}
              />
              <button onClick={sendMessage} style={{ marginLeft: '10px' }}>
                Send
              </button>
            </>
          ) : (
            <>
              <h3>Send Message to Non-Contact</h3>
              <input
                type="text"
                value={messageToIdentifier}
                onChange={(e) => setMessageToIdentifier(e.target.value)}
                placeholder="Enter recipient's email or username"
                style={{ width: '50%', margin: '10px 0' }}
              />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                style={{ width: '50%', margin: '10px 0' }}
              />
              <button onClick={sendMessage} style={{ marginLeft: '10px' }}>
                Send to Non-Contact
              </button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </>
          )}
          {selectedContact && (
            <div>
              <button onClick={() => startCall('video')} style={{ margin: '10px' }}>
                Video Call
              </button>
              <button onClick={() => startCall('audio')} style={{ margin: '10px' }}>
                Audio Call
              </button>
              {callStatus && <button onClick={endCall}>End Call</button>}
              {callStatus && <p>{callStatus}</p>}
              <video ref={localVideoRef} autoPlay muted style={{ width: '200px' }} />
              <video ref={remoteVideoRef} autoPlay style={{ width: '200px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;