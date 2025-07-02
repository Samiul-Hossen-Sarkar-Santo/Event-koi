const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming your User model is in ../models/User.js
const Event = require('../models/Event');
const Registration = require('../models/Registration');

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

// GET /users/profile - Get user profile data
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// PUT /users/profile - Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const { name, username, email, bio, university, yearOfStudy, skills, interests } = req.body;
    
    const updateData = {
      name,
      username,
      email,
      bio,
      university,
      yearOfStudy,
      skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
      interests: interests ? interests.split(',').map(interest => interest.trim()) : []
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

// GET /users/my-registrations - Get user's event registrations
router.get('/my-registrations', isAuthenticated, async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      $or: [
        { user: req.session.userId },
        { email: req.session.userEmail } // For cases where user registered before login
      ]
    }).populate('event', 'title date time location category coverImage approvalStatus').sort({ registrationDate: -1 });

    // Group registrations by status
    const groupedRegistrations = {
      upcoming: registrations.filter(reg => 
        reg.event && 
        reg.event.approvalStatus === 'approved' && 
        new Date(reg.event.date) >= new Date() &&
        reg.status === 'confirmed'
      ),
      past: registrations.filter(reg => 
        reg.event && 
        new Date(reg.event.date) < new Date() &&
        reg.status === 'confirmed'
      ),
      cancelled: registrations.filter(reg => reg.status === 'cancelled'),
      waitlist: registrations.filter(reg => reg.status === 'waitlist')
    };

    res.json(groupedRegistrations);
  } catch (err) {
    console.error('Error fetching user registrations:', err);
    res.status(500).json({ message: 'Error fetching registrations', error: err.message });
  }
});

// POST /users/favorite/:eventId - Add event to favorites
router.post('/favorite/:eventId', isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const user = await User.findById(req.session.userId);
    
    if (!user.favoriteEvents) {
      user.favoriteEvents = [];
    }

    if (!user.favoriteEvents.includes(eventId)) {
      user.favoriteEvents.push(eventId);
      await user.save();
      res.json({ message: 'Event added to favorites' });
    } else {
      res.json({ message: 'Event already in favorites' });
    }
  } catch (err) {
    console.error('Error adding to favorites:', err);
    res.status(500).json({ message: 'Error adding to favorites', error: err.message });
  }
});

// DELETE /users/favorite/:eventId - Remove event from favorites
router.delete('/favorite/:eventId', isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const user = await User.findById(req.session.userId);
    
    if (user.favoriteEvents) {
      user.favoriteEvents = user.favoriteEvents.filter(id => id.toString() !== eventId);
      await user.save();
    }

    res.json({ message: 'Event removed from favorites' });
  } catch (err) {
    console.error('Error removing from favorites:', err);
    res.status(500).json({ message: 'Error removing from favorites', error: err.message });
  }
});

// GET /users/favorites - Get user's favorite events
router.get('/favorites', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate({
      path: 'favoriteEvents',
      match: { approvalStatus: 'approved' },
      select: 'title date time location category coverImage description'
    });

    res.json(user.favoriteEvents || []);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ message: 'Error fetching favorites', error: err.message });
  }
});

// ADMIN ROUTES

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Admin access required.' });
}

// GET /users/admin/all - Get all users (admin only)
router.get('/admin/all', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    
    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const registrationCount = await Registration.countDocuments({ user: user._id });
      const eventCount = await Event.countDocuments({ organizer: user._id });
      
      return {
        ...user.toObject(),
        stats: {
          registrations: registrationCount,
          eventsCreated: eventCount,
          lastActive: user.lastLogin || user.createdAt
        }
      };
    }));

    res.json({
      users: usersWithStats,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: users.length,
        totalUsers: total
      }
    });
  } catch (err) {
    console.error('Error fetching users for admin:', err);
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// PUT /users/admin/:userId/status - Update user status (admin only)
router.put('/admin/:userId/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body; // status: 'active', 'suspended', 'banned'
    
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active, suspended, or banned.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admins from changing other admin statuses
    if (user.role === 'admin' && req.session.userId !== userId) {
      return res.status(403).json({ message: 'Cannot modify other admin accounts' });
    }

    user.accountStatus = status;
    if (reason) {
      user.statusReason = reason;
    }
    user.statusChangedAt = new Date();
    user.statusChangedBy = req.session.userId;

    await user.save();

    res.json({ 
      message: `User ${status} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.accountStatus
      }
    });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ message: 'Error updating user status', error: err.message });
  }
});

// GET /users/admin/stats - Get user statistics (admin only)
router.get('/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ accountStatus: { $ne: 'banned' } });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const organizerUsers = await User.countDocuments({ role: 'organizer' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    res.json({
      total: totalUsers,
      active: activeUsers,
      recent: recentUsers,
      byRole: {
        admin: adminUsers,
        organizer: organizerUsers,
        user: regularUsers
      }
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ message: 'Error fetching user statistics', error: err.message });
  }
});

// ==================== USER NOTICES & NOTIFICATIONS ====================

// GET /users/notices - Get user's notices/notifications
router.get('/notices', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // For now, we'll create a simple notices system
    // In a full implementation, you'd have a Notice model
    const mockNotices = [
      {
        _id: 'notice1',
        title: 'Event Status Update',
        message: 'Your event "Tech Workshop 2025" has been approved by admin.',
        type: 'event_status',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        actionUrl: '/event_page.html?id=someEventId'
      },
      {
        _id: 'notice2',
        title: 'Registration Reminder',
        message: 'Registration for "Web Development Workshop" closes in 3 days. Don\'t miss out!',
        type: 'system',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        actionUrl: '/event_page.html?id=anotherEventId'
      },
      {
        _id: 'notice3',
        title: 'Account Warning',
        message: 'Please review our community guidelines to ensure your events comply with our policies.',
        type: 'admin_action',
        isRead: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        actionUrl: null
      },
      {
        _id: 'notice4',
        title: 'New Features Available',
        message: 'We\'ve added new filtering options to help you find events more easily. Check them out!',
        type: 'system',
        isRead: true,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        actionUrl: null
      }
    ];
    
    const unreadCount = mockNotices.filter(notice => !notice.isRead).length;
    
    res.json({
      success: true,
      notices: mockNotices,
      unreadCount
    });
    
  } catch (err) {
    console.error('Error fetching user notices:', err);
    res.status(500).json({ message: 'Error fetching notices', error: err.message });
  }
});

// PUT /users/notices/:noticeId/read - Mark a notice as read
router.put('/notices/:noticeId/read', isAuthenticated, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const userId = req.session.userId;
    
    // In a real implementation, you'd update the notice in the database
    // For now, we'll just return success
    console.log(`Marking notice ${noticeId} as read for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Notice marked as read'
    });
    
  } catch (err) {
    console.error('Error marking notice as read:', err);
    res.status(500).json({ message: 'Error marking notice as read', error: err.message });
  }
});

// PUT /users/notices/read-all - Mark all notices as read
router.put('/notices/read-all', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // In a real implementation, you'd update all notices for the user
    console.log(`Marking all notices as read for user ${userId}`);
    
    res.json({
      success: true,
      message: 'All notices marked as read'
    });
    
  } catch (err) {
    console.error('Error marking all notices as read:', err);
    res.status(500).json({ message: 'Error marking all notices as read', error: err.message });
  }
});

// GET /users/recent-activity - Get user's recent activity
router.get('/recent-activity', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get recent registrations
    const recentRegistrations = await Registration.find({ user: userId })
      .populate('event', 'title')
      .sort({ registrationDate: -1 })
      .limit(5);
    
    // Get user for profile updates (simplified)
    const user = await User.findById(userId);
    
    // Create activity timeline
    const activities = [];
    
    // Add registration activities
    recentRegistrations.forEach(registration => {
      if (registration.event) {
        activities.push({
          type: 'registered',
          description: `Registered for "${registration.event.title}"`,
          date: registration.registrationDate,
          relatedId: registration.event._id
        });
      }
    });
    
    // Add profile update activity if recently updated
    if (user.updatedAt) {
      const daysSinceUpdate = (new Date() - user.updatedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate <= 7) {
        activities.push({
          type: 'profile_updated',
          description: 'Updated your profile information',
          date: user.updatedAt
        });
      }
    }
    
    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(activities.slice(0, 10)); // Return last 10 activities
    
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    res.status(500).json({ message: 'Error fetching recent activity', error: err.message });
  }
});

module.exports = router;