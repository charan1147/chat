const express = require('express');
const cookieParser = require('cookie-parser');
const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/connectDB');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const messageRoutes = require('./routes/message');
const initSocket = require('./socket');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5713']; // Add more as needed
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.set('socketio', io);

connectDB();

app.use('/auth', authRoutes);
app.use('/contacts', contactRoutes);
app.use('/messages', messageRoutes);

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));