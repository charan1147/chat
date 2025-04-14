const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/connectDB');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const messageRoutes = require('./routes/message');
const initSocket = require('./socket');
const axios = require('axios');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

console.log('Loaded FRONTEND_URL:', process.env.FRONTEND_URL); // Debug CORS origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Fallback for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(cookieParser());
app.set('socketio', io);

connectDB();

app.get('/health', (req, res) => {
  console.log('Health check received at', new Date().toISOString());
  res.status(200).send('OK');
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`404: Route not found - ${req.method} ${req.url} from ${req.get('origin')}`);
  res.status(404).json({ message: 'Route not found' });
});

const HEALTH_CHECK_URL = 'https://chat-6-5ldi.onrender.com/health';
const PING_INTERVAL = 300000;

const pingServer = async () => {
  try {
    console.log(`Pinging ${HEALTH_CHECK_URL} at ${new Date().toISOString()}`);
    const response = await axios.get(HEALTH_CHECK_URL);
    console.log('Ping successful:', response.status);
  } catch (err) {
    console.error('Keep-alive ping failed:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
    }
  }
};

const PORT = process.env.PORT || 5007;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  pingServer(); // Initial ping
  setInterval(pingServer, PING_INTERVAL);
});