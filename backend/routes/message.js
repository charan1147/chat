const express = require('express');
const { getMessages, deleteMessage, getAllMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/:email', protect, sendMessage); // Send message to email
router.get('/:email', protect, getMessages);  // Get messages by email
router.get('/all', protect, getAllMessages); // Get all messages
router.delete('/:messageId', protect, deleteMessage); // Delete message

module.exports = router;