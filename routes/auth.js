const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// POST /signup - User Registration
router.post('/signup', async (req, res) => {
  const {
    username,
    email,
    password,
    role
  } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({
      email
    });
    if (user) {
      return res.status(400).json({
        msg: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user', // Default to 'user' if role is not provided
    });

    await user.save();

    // You might want to automatically log in the user after signup
    req.session.userId = user.id;
    req.session.userRole = user.role;


    res.status(201).json({
      msg: 'User registered successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// POST /login - User Login
router.post('/login', async (req, res) => {
  const {
    email,
    password
  } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({
      email
    });
    if (!user) {
      return res.status(400).json({
        msg: 'Invalid credentials'
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        msg: 'Invalid credentials'
      });
    }

    // Create session
    req.session.userId = user.id;
    req.session.userRole = user.role;


    res.json({
      msg: 'User logged in successfully',
      role: user.role
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// GET /check-session - Check if user has a valid session
router.get('/check-session', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      userId: req.session.userId,
      role: req.session.userRole,
      authenticated: true
    });
  } else {
    res.status(401).json({
      authenticated: false,
      message: 'No valid session found'
    });
  }
});

// POST /logout - User Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;