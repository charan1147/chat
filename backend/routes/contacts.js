const express = require('express');
const { addContact, getContacts, removeContact } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/add', protect, addContact);
router.get('/', protect, getContacts);
router.delete('/:contactId', protect, removeContact);

module.exports = router;