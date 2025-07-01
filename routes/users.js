const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming your User model is in ../models/User.js

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).send('You must be logged in to access this resource.');
}

// Middleware to check if the user is the profile owner or an admin
async function isOwnerOrAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).send('You must be logged in to access this resource.');
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('Authenticated user not found.');
    }

    // Check if the requested profile ID matches the authenticated user's ID
    if (req.params.id === req.session.userId) {
      return next();
    }

    // Check if the authenticated user is an admin
    if (user.role === 'admin') {
      return next();
    }

    // If neither, deny access
    res.status(403).send('You are not authorized to view this profile.');

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
}


// GET /users/:id - View a user profile (owner or admin only)
router.get('/:id', isAuthenticated, isOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).send('User not found.');
    }
    // Placeholder: In a real application, you would render a user profile page
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

module.exports = router;