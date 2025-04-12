import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { ContactContext } from '../context/ContactContext';
import { CallContext } from '../context/CallContext';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { messages, selectedUser, setSelectedUser, fetchMessages, sendMessage } = useContext(ChatContext);
  const { contacts } = useContext(ContactContext);
  const { call, stream, startCall, answerCall, endCall } = useContext(CallContext);
  const [messageContent, setMessageContent] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    if (call?.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
  }, [stream, call?.remoteStream]);

  const handleSend = () => {
    if (messageContent.trim() && selectedUser) {
      sendMessage(selectedUser._id, messageContent);
      setMessageContent('');
    }
  };

  const allSenders = [
    ...contacts,
    ...Object.keys(messages)
      .filter(id => !contacts.some(c => c._id === id) && id !== user._id.toString())
      .map(id => ({
        _id: id,
        username: messages[id][0]?.username || 'Unknown',
      })),
  ];
  console.log('All senders:', allSenders);

  if (!user) {
    return <div>Please login to access chat.</div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '10px' }}>
        <h3>Conversations</h3>
        {allSenders.length > 0 ? (
          allSenders.map((sender) => (
            <div
              key={sender._id}
              onClick={() => setSelectedUser(sender)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                background: selectedUser?._id === sender._id ? '#e0e0e0' : 'transparent',
              }}
            >
              {sender.username}
            </div>
          ))
        ) : (
          <p>No conversations yet.</p>
        )}
      </div>
      <div style={{ width: '70%', padding: '10px' }}>
        {selectedUser ? (
          <>
            <h3>Chat with {selectedUser.username}</h3>
            <div style={{ marginBottom: '10px' }}>
              <button onClick={() => startCall(selectedUser._id, false)}>Audio Call</button>
              <button onClick={() => startCall(selectedUser._id, true)} style={{ marginLeft: '10px' }}>Video Call</button>
              {call?.isIncoming && (
                <button onClick={answerCall} style={{ marginLeft: '10px' }}>Answer Call</button>
              )}
              {call && (
                <button onClick={endCall} style={{ marginLeft: '10px' }}>End Call</button>
              )}
            </div>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              <video ref={localVideoRef} autoPlay muted style={{ width: '50%', border: '1px solid #ccc' }} />
              <video ref={remoteVideoRef} autoPlay style={{ width: '50%', border: '1px solid #ccc' }} />
            </div>
            <div style={{ height: '50%', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
              {(messages[selectedUser._id] || []).map((msg) => (
                <div key={msg._id} style={{ marginBottom: '10px' }}>
                  <strong>{msg.username || 'Unknown'}:</strong> {msg.content}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type a message"
                style={{ width: '80%', padding: '8px' }}
              />
              <button onClick={handleSend} style={{ padding: '8px', marginLeft: '10px' }}>Send</button>
            </div>
          </>
        ) : (
          <p>Select a conversation to start chatting.</p>
        )}
      </div>
    </div>
  );
};

export default Chat;