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
    res.status(500).send('Server Error');
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
    res.status(500).send('Server Error');
  }
});

module.exports = router;