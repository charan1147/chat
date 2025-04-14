import { io } from 'socket.io-client';

const URL = 'http://localhost:5007'; // Changed to local backend

const socket = io(URL, {
  withCredentials: true,
  autoConnect: false,
  query: { userId: localStorage.getItem('userId') || '' },
});

socket.on('connect', () => {
  console.log('Connected to server with socket ID:', socket.id);
});

socket.on('newMessage', (message) => {
  // Dispatch to context or state management (e.g., ChatContext)
  console.log('New message received:', message);
});

socket.on('messageRead', ({ messageId }) => {
  console.log('Message marked as read:', messageId);
});

socket.on('typing', ({ from }) => {
  console.log(`${from} is typing...`);
});

socket.on('stopTyping', ({ from }) => {
  console.log(`${from} stopped typing...`);
});

socket.on('offer', ({ from, offer }) => {
  console.log('Received offer from:', from, offer);
  // Handle offer in CallContext
});

socket.on('answer', ({ from, answer }) => {
  console.log('Received answer from:', from, answer);
  // Handle answer in CallContext
});

socket.on('ice-candidate', ({ from, candidate }) => {
  console.log('Received ICE candidate from:', from, candidate);
  // Handle ICE candidate in CallContext
});

socket.on('endCall', ({ from }) => {
  console.log('Call ended by:', from);
  // Handle call end in CallContext
});

socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

export const connectSocket = (userId) => {
  if (socket.disconnected && userId) {
    socket.io.opts.query.userId = userId;
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;