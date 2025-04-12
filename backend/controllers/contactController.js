const User = require('../models/User');

const addContact = async (req, res) => {
  const { email } = req.body; // Changed from contactId to email

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Contact email is required' });
    }

    const contact = await User.findOne({ email }); // Find user by email
    if (!contact) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.contacts.includes(contact._id)) { // Use contact._id
      return res.status(400).json({ success: false, message: 'Contact already added' });
    }

    if (contact._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as a contact' });
    }

    user.contacts.push(contact._id); // Add contact’s _id
    await user.save();

    // Return the added contact’s details for frontend consistency
    res.json({
      success: true,
      message: 'Contact added successfully',
      data: {
        _id: contact._id,
        username: contact.username,
        email: contact.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContacts = async (req, res) => {
  const { limit = 20, skip = 0 } = req.query;

  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', 'username email')
      .limit(Number(limit))
      .skip(Number(skip));
    res.json({ success: true, data: user.contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeContact = async (req, res) => {
  const { contactId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    user.contacts = user.contacts.filter(id => id.toString() !== contactId);
    await user.save();

    res.json({ success: true, message: 'Contact removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addContact, getContacts, removeContact };