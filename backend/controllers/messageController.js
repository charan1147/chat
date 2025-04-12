const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

const getMessages = async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;
  
    try {
      const messages = await Message.find({
        $or: [
          { from: req.user._id, to: userId },
          { from: userId, to: req.user._id }
        ]
      })
        .populate('from', 'username')
        .populate('to', 'username')
        .sort({ timestamp: 1 })
        .limit(Number(limit))
        .skip(Number(skip));
      console.log('Fetched messages:', messages); // Debug log
      res.json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
const getAllMessages = async (req, res) => {
  const { limit = 50, skip = 0 } = req.query;

  try {
    const messages = await Message.find({
      $or: [{ from: req.user._id }, { to: req.user._id }],
      deleted: false,
    })
      .populate('from', 'username')
      .populate('to', 'username')
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    console.log('Messages with population:', messages.map(m => ({ from: m.from, to: m.to, content: m.content }))); // Log populated data
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const io = req.app.get('socketio');

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.from.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    message.deleted = true;
    await message.save();

    io.to(message.to.toString()).emit('messageDeleted', { messageId });

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, getAllMessages, deleteMessage };