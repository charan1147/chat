import io from 'socket.io-client';

const socket = io('http://localhost:5007', {
  withCredentials: true,
  autoConnect: false,
  query: { userId: '' }, // Will set dynamically
});

export default socket;