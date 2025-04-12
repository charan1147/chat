const express = require('express');
const { getMessages, deleteMessage ,getAllMessages} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:userId', protect, getMessages);
router.get('/all', protect, getAllMessages);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;