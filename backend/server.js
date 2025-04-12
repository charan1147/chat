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

// CORS configuration
const allowedOrigins = ['http://localhost:5173', 'https://your-frontend-domain.com', 'http://localhost'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());
app.use(cookieParser());
app.set('socketio', io);

connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check received at', new Date().toISOString());
  res.status(200).send('OK'); // Explicit status and response
});

// Routes
app.use('/auth', authRoutes);
app.use('/contacts', contactRoutes);
app.use('/messages', messageRoutes);

// Keep-alive logic
const HEALTH_CHECK_URL = 'https://chat-5-ylv7.onrender.com/health';
const PING_INTERVAL = 300000; // 5 minutes in milliseconds

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

// Initial ping and start interval
pingServer(); // Ping immediately on startup
setInterval(pingServer, PING_INTERVAL);

const PORT = process.env.PORT || 5007;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));