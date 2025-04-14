import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !user._id) return;

    socketRef.current = io('https://chat-6-5ldi.onrender.com', {
      withCredentials: true,
      query: { userId: user._id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setError(null);
      socketRef.current.emit('join', user._id);
    });

    socketRef.current.on('newMessage', (message) => {
      console.log('Received new message:', message);
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    socketRef.current.on('error', (err) => {
      setError(err.message || 'Socket connection error');
      console.error('Socket error:', err);
    });

    socketRef.current.on('disconnect', () => {
      setError('Disconnected from server');
      console.log('Socket disconnected');
    });

    socketRef.current.on('reconnect', () => {
      console.log('Socket reconnected');
      socketRef.current.emit('join', user._id);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const fetchMessages = async (email) => {
    if (!email) return;
    setIsLoading(true);
    try {
      console.log('Fetching messages for email:', email);
      const response = await fetch(`https://chat-6-5ldi.onrender.com/api/messages/${encodeURIComponent(email)}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      const data = await response.json();
      console.log('Fetch messages response:', data);
      if (data.success) setMessages(data.data);
      else throw new Error(data.message || 'Failed to fetch messages');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (email, text) => {
    if (!email || !text) return;
    setIsLoading(true);
    try {
      console.log('Sending message to email:', email, 'with text:', text);
      const response = await fetch(`https://chat-6-5ldi.onrender.com/api/messages/${encodeURIComponent(email)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type: 'text' }),
      });
      const responseText = await response.text(); // Get raw response
      console.log('Raw response:', responseText);
      const data = responseText ? JSON.parse(responseText) : {};
      console.log('Parsed send message response:', data);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data]);
        if (socketRef.current) socketRef.current.emit('newMessage', data.data);
      } else throw new Error(data.message || 'Invalid response');
    } catch (err) {
      setError(err.message);
      console.error('Send message error:', err, 'Response status:', response?.status);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!messageId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`https://chat-6-5ldi.onrender.com/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        if (socketRef.current) socketRef.current.emit('messageDeleted', { messageId, to: user._id });
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, setMessages, fetchMessages, sendMessage, deleteMessage, error, isLoading }}>
      {children}
    </ChatContext.Provider>
  );
}