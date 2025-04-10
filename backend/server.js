const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/connectDB');
const Message = require('./models/Message');
const User = require('./models/User');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://chat-4-hb4p.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

connectDB();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://chat-4-hb4p.onrender.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to false for localhost
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use('/api/users', require('./routes/auth'));
app.use('/api/messages', require('./routes/chat'));
app.use('/api/users', require('./routes/contacts'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    io.emit('user-online', userId);
  });

  socket.on('send-message', async ({ toIdentifier, content, from }) => {
    try {
      const toUser = await User.findOne({ $or: [{ email: toIdentifier }, { username: toIdentifier }] });
      if (!toUser) {
        socket.emit('message-error', { message: 'Recipient not found' });
        return;
      }

      const message = new Message({ from, to: toUser._id.toString(), content });
      await message.save();

      const receiver = await User.findById(toUser._id);
      if (receiver && !receiver.contacts.includes(from)) {
        receiver.contacts.push(from);
        await receiver.save();
      }

      io.to(toUser._id.toString()).emit('receive-message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { message: 'Error sending message' });
    }
  });

  socket.on('call-user', ({ to, offer, callType }) => {
    io.to(to).emit('incoming-call', { from: socket.id, offer, callType });
  });

  socket.on('answer-call', ({ to, answer }) => {
    io.to(to).emit('call-answered', { answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { candidate });
  });

  socket.on('end-call', ({ to }) => {
    io.to(to).emit('call-ended');
  });

  socket.on('disconnect', () => {
    io.emit('user-offline', socket.id);
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
