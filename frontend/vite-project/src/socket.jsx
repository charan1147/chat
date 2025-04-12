import { io } from 'socket.io-client';

const socket = io('https://chat-5-ylv7.onrender.com', {
  withCredentials: true,
  transports: ['websocket'], // Force WebSocket for HTTPS
  path: '/socket.io', // Default path, adjust if customized
});

export default socket;




