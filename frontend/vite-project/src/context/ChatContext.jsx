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