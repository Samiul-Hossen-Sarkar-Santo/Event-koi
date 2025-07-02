const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Simple middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

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
  try {
    console.log('Login attempt received:', { email: req.body.email, hasPassword: !!req.body.password });
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', { userId: user._id, role: user.role, accountStatus: user.accountStatus });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // Check account status
    if (user.accountStatus === 'banned') {
      return res.status(403).json({
        message: 'Account banned. Contact administrator.'
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        message: 'Account suspended. Contact administrator.'
      });
    }

    // Create session
    req.session.userId = user._id;
    req.session.userRole = user.role;

    // Update last login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    res.json({
      message: 'User logged in successfully',
      role: user.role,
      userId: user._id,
      username: user.username
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
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

// POST /admin-register - Admin Registration (invitation-only)
router.post('/admin-register', async (req, res) => {
  try {
    const { username, email, password, name, adminInviteCode } = req.body;

    // Check if the admin invite code is valid
    const validAdminCode = process.env.ADMIN_INVITE_CODE || 'ADMIN_2025_SECRET_KEY';
    if (adminInviteCode !== validAdminCode) {
      return res.status(403).json({ 
        message: 'Invalid admin invitation code. Admin registration is by invitation only.' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const newAdmin = new User({
      username,
      email,
      password: hashedPassword,
      name,
      role: 'admin' // Force admin role
    });

    await newAdmin.save();

    // Don't create session automatically for admin registration
    res.status(201).json({ 
      message: 'Admin account created successfully. Please login through the admin portal.',
      adminId: newAdmin._id 
    });

  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// POST /admin-login - Secure Admin Login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password, adminSecurityCode } = req.body;

    // Additional security layer for admin login
    const validSecurityCode = process.env.ADMIN_SECURITY_CODE || 'SECURE_ADMIN_ACCESS_2025';
    if (adminSecurityCode !== validSecurityCode) {
      return res.status(403).json({ 
        message: 'Invalid security code. Access denied.' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Verify user is actually an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Create admin session with enhanced security
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.isAdmin = true;
    req.session.adminLoginTime = new Date();

    res.json({ 
      message: 'Admin login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// GET /admin-check - Verify admin session
router.get('/admin-check', (req, res) => {
  if (req.session && req.session.userId && req.session.userRole === 'admin' && req.session.isAdmin) {
    res.json({
      userId: req.session.userId,
      role: req.session.userRole,
      isAdmin: true,
      authenticated: true,
      loginTime: req.session.adminLoginTime
    });
  } else {
    res.status(401).json({
      authenticated: false,
      isAdmin: false,
      message: 'Admin session not found or expired'
    });
  }
});

module.exports = router;