const express = require('express');
const router = express.Router();
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not authenticated' });
  next();
};

router.get('/contacts/:userId', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('contacts');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error: error.message });
  }
});

router.post('/contacts/:userId', requireAuth, async (req, res) => {
  const { identifier } = req.body; // Accept email or username
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the contact by email or username
    const contact = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    if (contact._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as a contact' });
    }
    if (user.contacts.includes(contact._id)) {
      return res.status(400).json({ message: 'Contact already added' });
    }

    user.contacts.push(contact._id);
    await user.save();
    res.json(user.contacts);
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ message: 'Error adding contact', error: error.message });
  }
});

router.post('/call-history/:userId', requireAuth, async (req, res) => {
  const { participant, duration } = req.body;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.callHistory.push({ participant, duration });
    await user.save();
    res.json(user.callHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error adding call history', error: error.message });
  }
});

module.exports = router;