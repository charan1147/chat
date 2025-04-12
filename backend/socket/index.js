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

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('sendMessage', async ({ to, content, type, from }) => {
        try {
          const recipient = await User.findById(to);
          const sender = await User.findById(from);
          if (!recipient || !sender) {
            socket.emit('error', { message: 'Recipient or sender not found' });
            return;
          }
          const message = await Message.create({ from, to, content, type });
          const enrichedMessage = {
            ...message.toObject(),
            from: { _id: sender._id, username: sender.username },
            to: { _id: recipient._id, username: recipient.username },
          };
          console.log('Emitted message:', enrichedMessage);
          io.to(to).emit('newMessage', enrichedMessage);
          io.to(from).emit('newMessage', enrichedMessage);
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
      socket.to(to).emit('typing', { from: socket.handshake.query.userId || socket.id });
    });

    socket.on('stopTyping', ({ to }) => {
      socket.to(to).emit('stopTyping', { from: socket.handshake.query.userId || socket.id });
    });

    socket.on('offer', ({ to, offer }) => {
      socket.to(to).emit('offer', { from: socket.handshake.query.userId || socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      socket.to(to).emit('answer', { from: socket.handshake.query.userId || socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', { from: socket.handshake.query.userId || socket.id, candidate });
    });

    socket.on('endCall', ({ to }) => {
      socket.to(to).emit('endCall', { from: socket.handshake.query.userId || socket.id });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = initSocket;