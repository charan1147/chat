const socketIo = require('socket.io');
const Message = require('../models/Message');
const User = require('../models/User');

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    const userId = socket.handshake.query.userId; // Expecting _id or email

    socket.on('join', (roomId) => {
      socket.join(roomId);
      console.log(`User ${roomId} joined their room`);
    });

    socket.on('sendMessage', async ({ to, content, type, from }) => {
      try {
        const recipient = await User.findById(to) || await User.findOne({ email: to }); // Support _id or email
        const sender = await User.findById(from) || await User.findOne({ email: from });
        if (!recipient || !sender) {
          socket.emit('error', { message: 'Recipient or sender not found' });
          return;
        }
        const message = await Message.create({ from: sender._id, to: recipient._id, content, type });
        const enrichedMessage = {
          ...message.toObject(),
          from: { _id: sender._id, username: sender.username, email: sender.email },
          to: { _id: recipient._id, username: recipient.username, email: recipient.email },
        };
        console.log('Emitted message:', enrichedMessage);
        io.to(recipient._id.toString()).emit('newMessage', enrichedMessage);
        io.to(sender._id.toString()).emit('newMessage', enrichedMessage);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('markAsRead', async ({ messageId, to }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        message.isRead = true;
        await message.save();
        io.to(to).emit('messageRead', { messageId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('typing', ({ to }) => {
      socket.to(to).emit('typing', { from: userId });
    });

    socket.on('stopTyping', ({ to }) => {
      socket.to(to).emit('stopTyping', { from: userId });
    });

    socket.on('callOffer', ({ to, signal, isVideo }) => {
      socket.to(to).emit('callOffer', { from: userId, signal, isVideo });
    });

    socket.on('callAnswer', ({ to, answer }) => {
      socket.to(to).emit('callAnswer', { from: userId, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', { from: userId, candidate });
    });

    socket.on('endCall', ({ to }) => {
      socket.to(to).emit('endCall', { from: userId });
    });

    socket.on('messageDeleted', ({ messageId, to }) => {
      io.to(to).emit('messageDeleted', { messageId });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = initSocket;