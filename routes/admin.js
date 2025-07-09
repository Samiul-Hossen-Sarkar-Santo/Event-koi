const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Report = require('../models/Report');
const Category = require('../models/Category');
const AdminLog = require('../models/AdminLog');
const Warning = require('../models/Warning');

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Admin access required.' });
}

// Helper function to log admin actions
async function logAdminAction(adminId, action, targetType, targetId, details, req) {
  try {
    const log = new AdminLog({
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent')
    });
    await log.save();
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// ==================== EVENT MODERATION ====================

// GET /admin/events/approval-queue - Get all events pending approval with enhanced filtering
router.get('/events/approval-queue', isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending', 
      category, 
      dateRange, 
      createdRange, 
      search 
    } = req.query;
    
    // Build query object - include events pending approval or deletion requests
    const query = {
      $or: [
        status === 'all' ? { approvalStatus: { $ne: null } } : { approvalStatus: status },
        { deletionStatus: 'requested' }
      ]
    };
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }
    
    // Date range filter (for event date)
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate, endDate;
      
      switch (dateRange) {
        case 'upcoming':
          query.date = { $gte: now };
          break;
        case 'this_week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          query.date = { $gte: startDate, $lte: endDate };
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          query.date = { $gte: startDate, $lte: endDate };
          break;
        case 'next_month':
          startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          query.date = { $gte: startDate, $lte: endDate };
          break;
        case 'past':
          query.date = { $lt: now };
          break;
      }
    }
    
    // Created range filter (for when event was created)
    if (createdRange && createdRange !== 'all') {
      const now = new Date();
      let startDate, endDate;
      
      switch (createdRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
          query.createdAt = { $gte: startDate, $lt: endDate };
          break;
        case 'yesterday':
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 1);
          query.createdAt = { $gte: startDate, $lt: endDate };
          break;
        case 'this_week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          query.createdAt = { $gte: startDate, $lt: endDate };
          break;
        case 'last_week':
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 7);
          query.createdAt = { $gte: startDate, $lt: endDate };
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          query.createdAt = { $gte: startDate, $lt: endDate };
          break;
      }
    }
    
    const events = await Event.find(query)
      .populate('organizer', 'name username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: events.length,
        totalEvents: total
      }
    });
  } catch (err) {
    console.error('Error fetching approval queue:', err);
    res.status(500).json({ message: 'Error fetching approval queue', error: err.message });
  }
});

// PUT /admin/events/:eventId/moderate - Approve/Reject/Request Changes for an event
router.put('/events/:eventId/moderate', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { action, reason, requestedChanges } = req.body;
    
    if (!['approve', 'reject', 'request_changes', 'approve_deletion'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const event = await Event.findById(eventId).populate('organizer', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const adminId = req.session.userId;
    let newStatus, logAction;

    // Handle deletion requests
    if (action === 'approve_deletion') {
      // Permanently delete the event
      await Event.findByIdAndDelete(eventId);
      
      // Log admin action
      await logAdminAction(adminId, 'event_deletion_approved', 'Event', eventId, {
        reason: event.deletionReason || 'Admin approved deletion',
        eventTitle: event.title,
        organizerEmail: event.organizer?.email
      }, req);

      return res.json({ 
        message: 'Event deletion approved and completed',
        deleted: true
      });
    }

    switch (action) {
      case 'approve':
        // Handle edit approval
        if (event.isEdit && event.originalEventId) {
          // Update the original event with new data
          const originalEvent = await Event.findById(event.originalEventId);
          if (originalEvent) {
            // Copy all fields from edit to original, but only if they exist and are not empty
            const fieldsToUpdate = [
              'title', 'description', 'category', 'date', 'time', 'location',
              'registrationMethod', 'registrationDeadline', 'prizeInfo', 'rules',
              'externalRegistrationUrl', 'contactInfo', 'speakers', 'faqs', 
              'sponsors', 'schedule'
            ];
            
            fieldsToUpdate.forEach(field => {
              if (event[field] !== undefined && event[field] !== null && event[field] !== '') {
                originalEvent[field] = event[field];
              }
            });
            
            // Handle cover image separately - only update if a new one was uploaded
            if (event.coverImage && event.coverImage !== originalEvent.coverImage) {
              originalEvent.coverImage = event.coverImage;
            }
            
            originalEvent.approvedBy = adminId;
            originalEvent.approvedAt = new Date();
            await originalEvent.save();
            
            // Delete the edit version
            await Event.findByIdAndDelete(eventId);
            
            logAction = 'event_approved';
            return res.json({ 
              message: 'Event edit approved and applied to original event',
              originalEventId: event.originalEventId
            });
          }
        } else {
          // Regular event approval
          newStatus = 'approved';
          logAction = 'event_approved';
          event.approvedBy = adminId;
          event.approvedAt = new Date();
          event.canResubmit = true;
          event.rejectionReason = '';
          event.requestedChanges = [];
        }
        break;
      case 'reject':
        newStatus = 'rejected';
        logAction = event.isEdit ? 'event_changes_rejected' : 'event_rejected';
        event.rejectionReason = reason;
        event.canResubmit = !reason?.toLowerCase().includes('spam') && 
                           !reason?.toLowerCase().includes('violation') &&
                           event.resubmissionCount < 3;
        break;
      case 'request_changes':
        newStatus = 'changes_requested';
        logAction = 'event_changes_requested';
        event.requestedChanges = requestedChanges || [];
        event.canResubmit = true;
        break;
    }

    // Update event status
    const previousStatus = event.approvalStatus;
    event.approvalStatus = newStatus;
    event.adminRemarks = reason || '';

    // Add to review history
    let historyAction;
    switch (action) {
      case 'approve':
        historyAction = 'approved';
        break;
      case 'reject':
        historyAction = 'rejected';
        break;
      case 'request_changes':
        historyAction = 'changes_requested';
        break;
    }

    event.reviewHistory.push({
      reviewedBy: adminId,
      action: historyAction,
      reason: reason || '',
      timestamp: new Date()
    });

    await event.save();

    // Log admin action
    await logAdminAction(adminId, logAction, 'Event', eventId, {
      reason: reason || '',
      previousStatus,
      newStatus,
      isEdit: event.isEdit || false
    }, req);

    res.json({ 
      message: `Event ${action.replace('_', ' ')} successfully`,
      event: {
        id: event._id,
        title: event.title,
        status: event.approvalStatus,
        organizer: event.organizer,
        isEdit: event.isEdit
      }
    });
  } catch (err) {
    console.error('Error moderating event:', err);
    res.status(500).json({ message: 'Error moderating event', error: err.message });
  }
});

// ==================== USER MODERATION ====================

// GET /admin/users/management - Get all users with moderation info
router.get('/users/management', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', role = 'all' } = req.query;
    
    let query = {};
    if (status !== 'all') query.accountStatus = status;
    if (role !== 'all') query.role = role;

    const users = await User.find(query)
      .select('-password')
      .populate('statusChangedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [eventCount, warningCount, reportCount] = await Promise.all([
        Event.countDocuments({ organizer: user._id }),
        Warning.countDocuments({ userId: user._id, status: 'active' }),
        Report.countDocuments({ reportedBy: user._id })
      ]);
      
      return {
        ...user.toObject(),
        stats: {
          eventsCreated: eventCount,
          activeWarnings: warningCount,
          reportsSubmitted: reportCount
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
    console.error('Error fetching user management data:', err);
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// POST /admin/users/:userId/warn - Issue a warning to a user
router.post('/users/:userId/warn', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, description, severity, category, relatedReport } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const adminId = req.session.userId;

    // Create warning
    const warning = new Warning({
      userId,
      issuedBy: adminId,
      reason,
      description,
      severity,
      category,
      relatedReport,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await warning.save();

    // Update user warning count
    user.warningCount = (user.warningCount || 0) + 1;
    user.lastWarningAt = new Date();
    await user.save();

    // Log admin action
    await logAdminAction(adminId, 'user_warned', 'User', userId, {
      reason,
      severity,
      warningCount: user.warningCount
    }, req);

    res.json({ 
      message: 'Warning issued successfully',
      warning: {
        id: warning._id,
        severity,
        reason
      }
    });
  } catch (err) {
    console.error('Error issuing warning:', err);
    res.status(500).json({ message: 'Error issuing warning', error: err.message });
  }
});

// PUT /admin/users/:userId/status - Update user account status
router.put('/users/:userId/status', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason, duration, restrictions } = req.body;
    
    if (!['active', 'suspended', 'banned', 'restricted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admins from changing other admin statuses (except themselves)
    if (user.role === 'admin' && req.session.userId !== userId) {
      return res.status(403).json({ message: 'Cannot modify other admin accounts' });
    }

    const adminId = req.session.userId;
    const previousStatus = user.accountStatus;

    // Update user status
    user.accountStatus = status;
    user.statusReason = reason;
    user.statusChangedAt = new Date();
    user.statusChangedBy = adminId;

    // Handle restrictions
    if (status === 'restricted' && restrictions) {
      user.restrictions = { ...user.restrictions, ...restrictions };
      if (duration) {
        user.restrictionsExpireAt = new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000);
      }
    }

    await user.save();

    // Log admin action
    const logAction = status === 'active' ? 'user_account_restored' : 
                     status === 'suspended' ? 'user_suspended' : 
                     status === 'banned' ? 'user_banned' : 'user_restricted';

    await logAdminAction(adminId, logAction, 'User', userId, {
      reason,
      previousStatus,
      newStatus: status,
      duration
    }, req);

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

// ==================== REPORTS MANAGEMENT ====================

// GET /admin/reports - Get all reports with filtering
router.get('/reports', isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all', 
      type = 'all',
      priority = 'all'
    } = req.query;
    
    let query = {};
    if (status !== 'all') query.status = status;
    if (type !== 'all') query.reportType = type;
    if (priority !== 'all') query.priority = priority;

    // Get reports with populated reportedBy field
    const reports = await Report.find(query)
      .populate('reportedBy', 'name username email')
      .populate('resolvedBy', 'name username')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate the reportedEntity field based on reportedEntityModel
    const populatedReports = await Promise.all(reports.map(async (report) => {
      if (report.reportedEntityModel === 'User') {
        const user = await User.findById(report.reportedEntity).select('name username email').lean();
        report.reportedEntityData = user;
        report.reportedEntityName = user ? (user.name || user.username || user.email) : 'Unknown User';
      } else if (report.reportedEntityModel === 'Event') {
        const event = await Event.findById(report.reportedEntity).select('title description').lean();
        report.reportedEntityData = event;
        report.reportedEntityName = event ? event.title : 'Unknown Event';
      }
      
      // Format reporter name
      report.reporterName = report.reportedBy ? 
        (report.reportedBy.name || report.reportedBy.username || report.reportedBy.email) : 'Anonymous';
      
      return report;
    }));

    const total = await Report.countDocuments(query);

    // Simple status stats without aggregation
    const statusStats = {
      pending: await Report.countDocuments({ ...query, status: 'pending' }),
      investigating: await Report.countDocuments({ ...query, status: 'investigating' }),
      resolved: await Report.countDocuments({ ...query, status: 'resolved' }),
      dismissed: await Report.countDocuments({ ...query, status: 'dismissed' })
    };

    res.json({
      reports: populatedReports,
      stats: statusStats,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: populatedReports.length,
        totalReports: total
      }
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'Error fetching reports', error: err.message });
  }
});

// PUT /admin/reports/:reportId/resolve - Resolve a report
router.put('/reports/:reportId/resolve', isAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, adminNotes, resolutionAction } = req.body;

    const report = await Report.findById(reportId)
      .populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const adminId = req.session.userId;

    // Update report
    report.status = action; // 'resolved' or 'dismissed'
    report.adminNotes = adminNotes;
    report.resolutionAction = resolutionAction;
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();

    await report.save();

    // Log admin action
    await logAdminAction(adminId, 'report_resolved', 'Report', reportId, {
      action,
      resolutionAction,
      reportType: report.reportType
    }, req);

    res.json({ 
      message: 'Report resolved successfully',
      report: {
        id: report._id,
        status: report.status,
        resolutionAction: report.resolutionAction
      }
    });
  } catch (err) {
    console.error('Error resolving report:', err);
    res.status(500).json({ message: 'Error resolving report', error: err.message });
  }
});

// ==================== CATEGORY MANAGEMENT ====================

// GET /admin/categories/pending - Get pending category suggestions
router.get('/categories/pending', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    
    const query = status === 'all' ? {} : { status };
    
    const categories = await Category.find(query)
      .populate('suggestedBy', 'name username email')
      .populate('approvedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);

    res.json({
      categories,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: categories.length,
        totalCategories: total
      }
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// PUT /admin/categories/:categoryId/moderate - Approve/Reject category
router.put('/categories/:categoryId/moderate', isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const adminId = req.session.userId;

    if (action === 'approve') {
      category.status = 'approved';
      category.isActive = true;
      category.approvedBy = adminId;
    } else {
      category.status = 'rejected';
      category.rejectionReason = rejectionReason;
    }

    await category.save();

    // Log admin action
    await logAdminAction(adminId, 'category_' + action + 'd', 'Category', categoryId, {
      categoryName: category.name,
      reason: rejectionReason || ''
    }, req);

    res.json({ 
      message: `Category ${action}d successfully`,
      category: {
        id: category._id,
        name: category.name,
        status: category.status
      }
    });
  } catch (err) {
    console.error('Error moderating category:', err);
    res.status(500).json({ message: 'Error moderating category', error: err.message });
  }
});

// ==================== ADMIN DASHBOARD STATS ====================

// GET /admin/dashboard/stats - Get comprehensive dashboard statistics
router.get('/dashboard/stats', isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      pendingEvents,
      activeReports,
      pendingCategories,
      totalReports,
      recentWarnings
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ approvalStatus: 'pending' }),
      Report.countDocuments({ status: { $in: ['pending', 'investigating'] } }),
      Category.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Warning.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      })
    ]);

    // Get user stats by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get events by status
    const eventsByStatus = await Event.aggregate([
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
    ]);

    // Get reports by priority
    const reportsByPriority = await Report.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalEvents,
        pendingEvents,
        activeReports,
        pendingCategories,
        totalReports,
        recentWarnings
      },
      breakdown: {
        usersByRole: usersByRole.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        eventsByStatus: eventsByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        reportsByPriority: reportsByPriority.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: err.message });
  }
});

// ==================== ACCOUNTABILITY LOG ====================

// GET /admin/logs - Get admin action logs
router.get('/logs', isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      adminId = 'all',
      action = 'all',
      severity = 'all',
      days = 30 
    } = req.query;
    
    let query = {};
    if (adminId !== 'all') query.adminId = adminId;
    if (action !== 'all') query.action = action;
    if (severity !== 'all') query.severity = severity;
    
    // Filter by date range
    const dateFilter = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: dateFilter };

    const logs = await AdminLog.find(query)
      .populate('adminId', 'name username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdminLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: logs.length,
        totalLogs: total
      }
    });
  } catch (err) {
    console.error('Error fetching admin logs:', err);
    res.status(500).json({ message: 'Error fetching admin logs', error: err.message });
  }
});

// ==================== RECENT ACTIVITY ====================

// GET /admin/dashboard/recent-activity - Get recent admin activities
router.get('/dashboard/recent-activity', isAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent admin logs
    const recentLogs = await AdminLog.find()
      .populate('adminId', 'name username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Format activities for display
    const activities = recentLogs.map(log => {
      const admin = log.adminId ? (log.adminId.name || log.adminId.username) : 'Unknown Admin';
      const timeAgo = getTimeAgo(log.createdAt);
      
      let message, icon, color;
      
      switch(log.action) {
        case 'event_approved':
          message = `${admin} approved event "${log.details.eventTitle || 'Unknown Event'}"}`;
          icon = 'check-circle';
          color = 'green';
          break;
        case 'event_rejected':
          message = `${admin} rejected event "${log.details.eventTitle || 'Unknown Event'}"}`;
          icon = 'times-circle';
          color = 'red';
          break;
        case 'user_warned':
          message = `${admin} warned user "${log.details.username || 'Unknown User'}"}`;
          icon = 'exclamation-triangle';
          color = 'yellow';
          break;
        case 'user_suspended':
          message = `${admin} suspended user "${log.details.username || 'Unknown User'}"}`;
          icon = 'pause-circle';
          color = 'orange';
          break;
        case 'user_banned':
          message = `${admin} banned user "${log.details.username || 'Unknown User'}"}`;
          icon = 'ban';
          color = 'red';
          break;
        case 'report_resolved':
          message = `${admin} resolved a report`;
          icon = 'flag';
          color = 'blue';
          break;
        case 'category_approved':
          message = `${admin} approved category "${log.details.categoryName || 'Unknown Category'}"}`;
          icon = 'tags';
          color = 'purple';
          break;
        default:
          message = `${admin} performed ${log.action.replace('_', ' ')}`;
          icon = 'info-circle';
          color = 'gray';
      }
      
      return {
        type: log.action,
        message,
        time: timeAgo,
        icon,
        color
      };
    });

    res.json(activities);
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    res.status(500).json({ message: 'Error fetching recent activity', error: err.message });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}

// ==================== EVENT DELETION QUEUE ====================

// GET /admin/events/deletion-queue - Get events with deletion requests
router.get('/events/deletion-queue', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'deletion_requested' } = req.query;
    
    const query = status === 'all' ? 
      { deletionStatus: { $in: ['deletion_requested', 'deletion_approved', 'deletion_rejected'] } } : 
      { deletionStatus: status };
    
    const events = await Event.find(query)
      .populate('organizer', 'name username email')
      .populate('deletionRequestedBy', 'name username email')
      .sort({ deletionRequestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalEvents = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(totalEvents / limit),
      currentPage: page,
      totalEvents
    });
  } catch (err) {
    console.error('Error fetching deletion queue:', err);
    res.status(500).json({ message: 'Error fetching deletion queue', error: err.message });
  }
});

// PUT /admin/events/:eventId/deletion - Handle event deletion requests
router.put('/events/:eventId/deletion', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { action, reason } = req.body; // action: 'approve_deletion', 'reject_deletion'
    
    if (!['approve_deletion', 'reject_deletion'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const event = await Event.findById(eventId).populate('organizer', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.deletionStatus !== 'deletion_requested') {
      return res.status(400).json({ message: 'Event is not pending deletion review' });
    }

    const adminId = req.session.userId;
    let logAction, newStatus;

    if (action === 'approve_deletion') {
      // Actually delete the event
      await Event.findByIdAndDelete(eventId);
      
      logAction = 'event_deletion_approved';
      
      // Log admin action
      await logAdminAction(adminId, logAction, 'Event', eventId, {
        reason: reason || 'Deletion approved',
        eventTitle: event.title,
        organizerEmail: event.organizer.email
      }, req);

      res.json({ 
        message: 'Event deletion approved and event removed',
        deleted: true
      });
    } else {
      // Reject deletion request
      newStatus = 'active';
      event.deletionStatus = newStatus;
      event.deletionRemarks = reason || 'Deletion rejected by admin';
      event.deletionReviewedBy = adminId;
      event.deletionReviewedAt = new Date();

      await event.save();

      logAction = 'event_deletion_rejected';
      
      // Log admin action
      await logAdminAction(adminId, logAction, 'Event', eventId, {
        reason: reason || 'Deletion rejected',
        eventTitle: event.title,
        organizerEmail: event.organizer.email
      }, req);

      res.json({ 
        message: 'Event deletion rejected successfully',
        event: {
          id: event._id,
          title: event.title,
          deletionStatus: event.deletionStatus
        }
      });
    }
  } catch (err) {
    console.error('Error handling deletion request:', err);
    res.status(500).json({ message: 'Error handling deletion request', error: err.message });
  }
});

// ==================== BAN APPEALS MANAGEMENT ====================

// GET /admin/banned-warned - Get banned, warned, and suspended users with appeals
router.get('/banned-warned', isAdmin, async (req, res) => {
  try {
    const { 
      status = 'banned', 
      days = 'all', 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    let query = {};
    let dateFilter = {};
    
    if (status === 'appeals') {
      query.appealText = { $exists: true, $ne: null };
      query.accountStatus = 'banned';
    } else if (status !== 'all') {
      query.accountStatus = status;
    } else {
      query.accountStatus = { $in: ['banned', 'suspended', 'warned'] };
    }
    
    // Apply date filter
    if (days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      
      if (status === 'appeals') {
        dateFilter.appealSubmittedAt = { $gte: daysAgo };
      } else {
        dateFilter.statusChangedAt = { $gte: daysAgo };
      }
      query = { ...query, ...dateFilter };
    }
    
    const users = await User.find(query)
      .select('username email accountStatus banReason appealText appealSubmittedAt statusChangedAt createdAt warnings')
      .sort({ statusChangedAt: -1, appealSubmittedAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await User.countDocuments(query);
    
    // Get warning counts for each user
    const usersWithWarnings = await Promise.all(users.map(async (user) => {
      const warningCount = await Warning.countDocuments({ userId: user._id });
      return {
        ...user.toObject(),
        warningCount
      };
    }));
    
    res.json({
      success: true,
      users: usersWithWarnings,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: users.length,
        totalUsers: total
      }
    });
    
  } catch (err) {
    console.error('Error fetching banned/warned users:', err);
    res.status(500).json({ message: 'Error fetching banned/warned users', error: err.message });
  }
});

// PUT /admin/handle-appeal/:userId - Handle ban appeal (approve/reject)
router.put('/handle-appeal/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, adminResponse } = req.body; // action: 'approve' or 'reject'
    const adminId = req.session.userId;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.appealText) {
      return res.status(400).json({ message: 'No appeal found for this user' });
    }
    
    if (action === 'approve') {
      // Restore user account
      user.accountStatus = 'active';
      user.banReason = null;
      user.appealText = null;
      user.appealSubmittedAt = null;
      user.statusChangedAt = new Date();
      
      await user.save();
      
      // Log admin action
      await logAdminAction(adminId, 'appeal_approved', 'User', userId, {
        username: user.username,
        adminResponse,
        originalBanReason: user.banReason
      }, req);
      
      res.json({ message: 'Ban appeal approved. User account restored.', user: { id: user._id, username: user.username, accountStatus: user.accountStatus } });
      
    } else {
      // Reject appeal
      user.appealText = null;
      user.appealSubmittedAt = null;
      
      await user.save();
      
      // Log admin action
      await logAdminAction(adminId, 'appeal_rejected', 'User', userId, {
        username: user.username,
        adminResponse,
        banReason: user.banReason
      }, req);
      
      res.json({ message: 'Ban appeal rejected.', user: { id: user._id, username: user.username, accountStatus: user.accountStatus } });
    }
    
  } catch (err) {
    console.error('Error handling appeal:', err);
    res.status(500).json({ message: 'Error handling appeal', error: err.message });
  }
});

// PUT /admin/unban-user/:userId - Directly unban a user (without appeal)
router.put('/unban-user/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.session.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.accountStatus !== 'banned') {
      return res.status(400).json({ message: 'User is not banned' });
    }
    
    const oldBanReason = user.banReason;
    
    user.accountStatus = 'active';
    user.banReason = null;
    user.appealText = null;
    user.appealSubmittedAt = null;
    user.statusChangedAt = new Date();
    
    await user.save();
    
    // Log admin action
    await logAdminAction(adminId, 'user_unbanned', 'User', userId, {
      username: user.username,
      reason: reason || 'Admin decision',
      originalBanReason: oldBanReason
    }, req);
    
    res.json({ message: 'User unbanned successfully', user: { id: user._id, username: user.username, accountStatus: user.accountStatus } });
    
  } catch (err) {
    console.error('Error unbanning user:', err);
    res.status(500).json({ message: 'Error unbanning user', error: err.message });
  }
});

// ==================== USER WARNING HISTORY ====================

// GET /admin/users/:userId/warnings - Get user warning history
router.get('/users/:userId/warnings', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const warnings = await Warning.find({ userId })
      .sort({ createdAt: -1 })
      .populate('issuedBy', 'username');
    
    res.json({
      success: true,
      warnings
    });
    
  } catch (err) {
    console.error('Error fetching user warnings:', err);
    res.status(500).json({ message: 'Error fetching user warnings', error: err.message });
  }
});

// ==================== ADMIN USERS LIST ====================

// GET /admin/admins-list - Get list of admin users for filtering
router.get('/admins-list', isAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name username email').lean();
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admin list:', error);
    res.status(500).json({ message: 'Error fetching admin list', error: error.message });
  }
});

module.exports = router;
