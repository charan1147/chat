const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/history/:userId', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.query.currentUser, to: req.params.userId },
        { from: req.params.userId, to: req.query.currentUser }
      ]
    }).sort('timestamp');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching message history', error: error.message });
  }
});

module.exports = router;