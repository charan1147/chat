import { useState, useContext, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ContactContext } from '../context/ContactContext';
import { CallContext } from '../context/CallContext';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

function Chat() {
  const { contacts } = useContext(ContactContext);
  const { callActive, caller, startCall, handleOffer, handleAnswer, handleCandidate, endCall, remoteStream } = useContext(CallContext);
  const { messages, fetchMessages, sendMessage, deleteMessage, error, isLoading: chatLoading } = useContext(ChatContext);
  const { user, isLoading: authLoading, error: authError } = useContext(AuthContext);
  const { userId } = useParams();
  console.log('Chat render - user:', user, 'authLoading:', authLoading, 'userId from params:', userId);
  const [newMessage, setNewMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(''); // Store email for backend
  const videoRef = useRef(null);
  const [prevRecipientEmail, setPrevRecipientEmail] = useState('');

  useEffect(() => {
    if (remoteStream.current && videoRef.current) {
      videoRef.current.srcObject = remoteStream.current;
      videoRef.current.play().catch((err) => console.error('Video play failed:', err));
    }
  }, [remoteStream]);

  const handleSelectContact = (email) => {
    setRecipientEmail(email);
    if (email && email !== prevRecipientEmail) {
      fetchMessages(email);
      setPrevRecipientEmail(email);
    }
  };

  const handleSendMessage = () => {
    if (recipientEmail && newMessage) {
      sendMessage(recipientEmail, newMessage);
      setNewMessage('');
    }
  };

  const initiateCall = async (email, isVideo) => {
    if (email && !authLoading) await startCall(email, isVideo);
  };

  if (authLoading) return <p>Loading authentication...</p>;

  return (
    <ErrorBoundary>
      <div>
        <h2>Chat</h2>
        {(authError || error) && <p style={{ color: 'red' }}>{authError || error}</p>}
        {chatLoading && <p>Loading...</p>}
        {callActive && <p>Call with {caller || 'someone'} active. <button onClick={endCall}>End Call</button></p>}
        <h3>Contact List</h3>
        <ul>
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <li key={contact._id} onClick={() => handleSelectContact(contact.email)} style={{ cursor: 'pointer' }}>
                {contact.username} ({contact.email})
              </li>
            ))
          ) : (
            <li>No contacts available</li>
          )}
        </ul>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message"
          disabled={!recipientEmail || chatLoading || callActive || authLoading}
        />
        <button onClick={handleSendMessage} disabled={!recipientEmail || chatLoading || callActive || authLoading}>
          Send
        </button>
        <ul>
          {user ? (
            messages.map((msg) => (
              <li key={msg._id}>
                {msg.from.email}: {msg.content} {msg.from._id.toString() === user._id ? '(You)' : ''}
                {msg.from._id.toString() === user._id && (
                  <button onClick={() => deleteMessage(msg._id)} disabled={chatLoading || callActive || authLoading}>
                    Delete
                  </button>
                )}
              </li>
            ))
          ) : (
            <li>No user data available</li>
          )}
        </ul>
        <button
          onClick={() => initiateCall(recipientEmail, true)}
          disabled={!recipientEmail || chatLoading || callActive || authLoading}
        >
          Video Call
        </button>
        <button
          onClick={() => initiateCall(recipientEmail, false)}
          disabled={!recipientEmail || chatLoading || callActive || authLoading}
        >
          Audio Call
        </button>
        {callActive && <video ref={videoRef} autoPlay style={{ width: '300px' }} />}
      </div>
    </ErrorBoundary>
  );
}

export default Chat;