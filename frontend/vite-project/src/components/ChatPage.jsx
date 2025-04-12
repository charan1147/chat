import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { ContactContext } from '../context/ContactContext';
import Peer from 'simple-peer';

const ChatPage = () => {
  const { messages, fetchMessages, sendMessage, markAsRead, socket, typing, call, startCall, answerCall, endCall } =
    useContext(ChatContext);
  const { contacts } = useContext(ContactContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState('');
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      if (socket) {
        socket.emit('typing', { to: selectedUser._id });
      }
    }
    return () => {
      if (socket && selectedUser) {
        socket.emit('stopTyping', { to: selectedUser._id });
      }
    };
  }, [selectedUser, socket]);

  useEffect(() => {
    if (call && call.isIncoming && !call.accepted) {
      // Auto-answer for simplicity (customize as needed)
      answerCall();
    }
    if (call && call.accepted && socket) {
      navigator.mediaDevices
        .getUserMedia({ video: call.type === 'video', audio: true })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
          }
          const newPeer = new Peer({ initiator: false, trickle: false, stream: mediaStream });
          newPeer.signal(call.offer);
          newPeer.on('signal', (data) => {
            socket.emit('answer', { to: call.from, answer: data });
          });
          newPeer.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
          newPeer.on('error', (err) => console.error(err));
          setPeer(newPeer);
        })
        .catch((err) => console.error(err));
    }
    if (call && call.answer && peer) {
      peer.signal(call.answer);
    }
    if (call && call.candidates && peer) {
      call.candidates.forEach((candidate) => peer.signal(candidate));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [call, peer, socket]);

  const handleSend = () => {
    if (!content.trim() || !selectedUser) return;
    sendMessage(selectedUser._id, content);
    setContent('');
  };

  const handleMarkAsRead = (messageId) => {
    markAsRead(messageId, selectedUser._id);
  };

  const handleStartCall = (type) => {
    navigator.mediaDevices
      .getUserMedia({ video: type === 'video', audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        const newPeer = new Peer({ initiator: true, trickle: false, stream: mediaStream });
        newPeer.on('signal', (data) => {
          socket.emit('offer', { to: selectedUser._id, offer: data });
        });
        newPeer.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
        newPeer.on('error', (err) => console.error(err));
        setPeer(newPeer);
        startCall(selectedUser._id, type);
      })
      .catch((err) => console.error(err));
  };

  const handleEndCall = () => {
    endCall();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (peer) {
      peer.destroy();
    }
    setStream(null);
    setPeer(null);
  };

  return (
    <div style={{ display: 'flex', margin: '20px' }}>
      <div style={{ width: '200px', borderRight: '1px solid #ccc' }}>
        <h3>Contacts</h3>
        <ul>
          {contacts.map((contact) => (
            <li
              key={contact._id}
              onClick={() => setSelectedUser(contact)}
              style={{ cursor: 'pointer', padding: '5px' }}
            >
              {contact.username} {typing[contact._id] ? '(Typing...)' : ''}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        {selectedUser ? (
          <>
            <h3>Chat with {selectedUser.username}</h3>
            {call && (
              <div>
                <video ref={localVideoRef} autoPlay muted style={{ width: '200px' }} />
                <video ref={remoteVideoRef} autoPlay style={{ width: '200px' }} />
                <button onClick={handleEndCall}>End Call</button>
              </div>
            )}
            <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
              {messages[selectedUser._id]?.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => !msg.isRead && msg.from === selectedUser._id && handleMarkAsRead(msg._id)}
                  style={{ marginBottom: '10px' }}
                >
                  <p>
                    <strong>{msg.from === selectedUser._id ? selectedUser.username : 'You'}</strong>: {msg.content}{' '}
                    {msg.isRead ? '(Read)' : ''}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px' }}>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message"
                style={{ width: '80%', padding: '8px' }}
              />
              <button onClick={handleSend} style={{ padding: '8px' }}>Send</button>
              <button onClick={() => handleStartCall('video')} style={{ padding: '8px', marginLeft: '10px' }}>
                Video Call
              </button>
              <button onClick={() => handleStartCall('audio')} style={{ padding: '8px', marginLeft: '10px' }}>
                Audio Call
              </button>
            </div>
          </>
        ) : (
          <p>Select a contact to start chatting</p>
        )}
      </div>
    </div>
  );
};

export default ChatPage;