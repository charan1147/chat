const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

const getMessages = async (req, res) => {
  const { email } = req.params;
  const { limit = 20, skip = 0 } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: user._id },
        { from: user._id, to: req.user._id }
      ]
    })
      .populate('from', 'username email')
      .populate('to', 'username email')
      .sort({ timestamp: 1 })
      .limit(Number(limit))
      .skip(Number(skip));
    console.log('Fetched messages:', messages);
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
      .populate('from', 'username email')
      .populate('to', 'username email')
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    console.log('Messages with population:', messages.map(m => ({ from: m.from, to: m.to, content: m.content })));
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

const sendMessage = async (req, res) => {
  const { email } = req.params;
  const { text } = req.body;
  const io = req.app.get('socketio');

  try {
    const recipient = await User.findOne({ email });
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const message = await Message.create({
      from: req.user._id,
      to: recipient._id,
      content: text,
      timestamp: new Date(),
    });

    await message.populate([{ path: 'from', select: 'username email' }, { path: 'to', select: 'username email' }]);
    const enrichedMessage = message.toObject();

    io.to(recipient._id.toString()).emit('newMessage', enrichedMessage);
    io.to(req.user._id.toString()).emit('newMessage', enrichedMessage);

    res.json({ success: true, data: enrichedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
};
module.exports = { getMessages, getAllMessages, deleteMessage, sendMessage };