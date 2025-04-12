const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../config/jwtToken');

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ username, email, password });
    generateToken(res, user._id);
    res.status(201).json({
      success: true,
      data: { _id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
  
      generateToken(res, user._id);
      res.json({
        success: true,
        data: { _id: user._id, username: user.username, email: user.email },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

const logoutUser = (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 });
  res.json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { _id: req.user._id, username: req.user.username, email: req.user.email },
  });
};

module.exports = { registerUser, loginUser, logoutUser, getMe };