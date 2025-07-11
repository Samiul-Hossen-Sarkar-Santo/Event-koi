const express = require('express');
const mongoose = require('mongoose');
const Event = require('E:\\Projects\\sre\\Event-koi\\models\\Event.js'); // Assuming Event.js is in the models folder
const Registration = require('E:\\Projects\\sre\\Event-koi\\models\\Registration.js');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized: Please log in.' });
}

// Middleware to check if user is an organizer
function isOrganizer(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'organizer') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Organizer access required.' });
}

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Admin access required.' });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create the 'uploads' directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads');
    require('fs').mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) {
        console.error('Error creating uploads directory:', err);
      }
      cb(null, uploadDir);
    });
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Create multer upload instance with better configuration
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept all files for now, you can add validation here
    cb(null, true);
  }
});

// Create a middleware that handles both file uploads and form data
const handleFormData = (req, res, next) => {
  upload.single('coverImage')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    next();
  });
};


// GET all events
router.get('/', async (req, res) => {
  try {
    // Query the database to find all events with approvalStatus of 'approved'
    const approvedEvents = await Event.find({ approvalStatus: 'approved' }).populate('organizer', 'username name'); // Populate organizer with username and name
    res.status(200).json(approvedEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching approved events', error: err.message });
  }
});

// GET organizer's own events
router.get('/my-events', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ 
      organizer: organizerId,
      $or: [
        { isEdit: { $exists: false } },
        { isEdit: false }
      ]
    }).populate('organizer', 'username name email');
    
    // Group events by status
    const groupedEvents = {
      active: events.filter(event => event.approvalStatus === 'approved' && new Date(event.date) >= new Date()),
      pending: events.filter(event => event.approvalStatus === 'pending'),
      past: events.filter(event => event.approvalStatus === 'approved' && new Date(event.date) < new Date()),
      rejected: events.filter(event => event.approvalStatus === 'rejected')
    };
    
    res.status(200).json(groupedEvents);
  } catch (err) {
    console.error('Error fetching organizer events:', err);
    res.status(500).json({ message: 'Error fetching your events', error: err.message });
  }
});

// GET organizer dashboard stats
router.get('/dashboard-stats', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ organizer: organizerId });
    
    const totalEvents = events.length;
    const activeEvents = events.filter(event => event.approvalStatus === 'approved' && new Date(event.date) >= new Date()).length;
    const totalAttendees = events.reduce((sum, event) => sum + (event.registrations ? event.registrations.length : 0), 0);
    const pendingApprovals = events.filter(event => event.approvalStatus === 'pending').length;
    
    // Calculate sponsor inquiries and questions
    const totalSponsorInquiries = events.reduce((sum, event) => sum + (event.sponsorInquiries ? event.sponsorInquiries.length : 0), 0);
    const totalQuestions = events.reduce((sum, event) => sum + (event.questions ? event.questions.length : 0), 0);
    
    res.status(200).json({
      totalEvents,
      activeEvents,
      totalAttendees,
      pendingApprovals,
      totalSponsorInquiries,
      totalQuestions
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: err.message });
  }
});

// GET sponsor inquiries for organizer's events
router.get('/sponsor-inquiries', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ organizer: organizerId }).populate('organizer', 'username name');
    
    let allInquiries = [];
    events.forEach(event => {
      if (event.sponsorInquiries && event.sponsorInquiries.length > 0) {
        event.sponsorInquiries.forEach(inquiry => {
          allInquiries.push({
            ...inquiry.toObject(),
            eventTitle: event.title,
            eventId: event._id
          });
        });
      }
    });
    
    // Sort by submission date, newest first
    allInquiries.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.status(200).json(allInquiries);
  } catch (err) {
    console.error('Error fetching sponsor inquiries:', err);
    res.status(500).json({ message: 'Error fetching sponsor inquiries', error: err.message });
  }
});

// GET questions for organizer's events
router.get('/questions', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ organizer: organizerId }).populate('organizer', 'username name');
    
    let allQuestions = [];
    events.forEach(event => {
      if (event.questions && event.questions.length > 0) {
        event.questions.forEach(question => {
          allQuestions.push({
            ...question.toObject(),
            eventTitle: event.title,
            eventId: event._id
          });
        });
      }
    });
    
    // Sort by submission date, newest first
    allQuestions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.status(200).json(allQuestions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ message: 'Error fetching questions', error: err.message });
  }
});

// GET analytics data for organizer dashboard charts
router.get('/analytics-data', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ organizer: organizerId }).populate('registrations');
    
    // Get current date for filtering
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter events by approval status and date
    const approvedEvents = events.filter(event => event.approvalStatus === 'approved');
    const activeEvents = approvedEvents.filter(event => new Date(event.date) >= now);
    const pastEvents = approvedEvents.filter(event => new Date(event.date) < now);
    
    // Calculate events created over the last 6 months for chart
    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      const targetYear = currentYear - (currentMonth - i < 0 ? 1 : 0);
      
      const eventsInMonth = events.filter(event => {
        const eventDate = new Date(event.createdAt || event.date);
        return eventDate.getMonth() === targetMonth && eventDate.getFullYear() === targetYear;
      });
      
      monthlyData.push({
        month: monthNames[targetMonth],
        events: eventsInMonth.length
      });
    }
    
    // Calculate events by category for pie chart
    const categoryData = {};
    approvedEvents.forEach(event => {
      const category = event.category || 'Other';
      categoryData[category] = (categoryData[category] || 0) + 1;
    });
    
    // Calculate total attendees from registrations
    let totalAttendees = 0;
    for (const event of approvedEvents) {
      const registrations = await Registration.find({ event: event._id });
      totalAttendees += registrations.length;
    }
    
    // Events created this month
    const monthlyEvents = events.filter(event => {
      const eventDate = new Date(event.createdAt || event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;
    
    // Average rating calculation
    const avgRating = 4.8; // You can calculate this from actual ratings
    
    // Generate real recent activity
    const recentActivity = [];
    
    // Recent event creation
    const recentEvents = events
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 2);
    
    recentEvents.forEach(event => {
      recentActivity.push({
        type: 'event_created',
        title: 'New event created',
        description: `${event.title}`,
        time: new Date(event.createdAt || event.date).toLocaleDateString(),
        icon: 'fas fa-plus'
      });
    });

    // Recent approvals/rejections
    const recentApprovals = events
      .filter(event => event.approvedAt)
      .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))
      .slice(0, 1);
    
    recentApprovals.forEach(event => {
      recentActivity.push({
        type: 'event_approved',
        title: 'Event approved',
        description: `${event.title} was approved by admin`,
        time: new Date(event.approvedAt).toLocaleDateString(),
        icon: 'fas fa-check'
      });
    });

    // Total registrations summary
    if (totalAttendees > 0) {
      recentActivity.push({
        type: 'registrations',
        title: `${totalAttendees} total registrations`,
        description: `Across all your ${approvedEvents.length} approved events`,
        time: 'Updated now',
        icon: 'fas fa-user-plus'
      });
    }

    // Dashboard update
    recentActivity.push({
      type: 'status_update',
      title: 'Dashboard updated',
      description: 'Analytics refreshed with latest data',
      time: new Date().toLocaleString(),
      icon: 'fas fa-chart-line'
    });

    res.status(200).json({
      totalEvents: events.length,
      activeEvents: activeEvents.length,
      totalAttendees,
      monthlyEvents,
      avgRating,
      chartData: {
        eventsOverTime: monthlyData,
        eventsByCategory: Object.entries(categoryData).map(([category, count]) => ({
          category,
          count
        }))
      },
      recentActivity: recentActivity.slice(0, 4) // Limit to 4 items
    });
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    res.status(500).json({ message: 'Error fetching analytics data', error: err.message });
  }
});

// GET a single event by ID - MUST BE AFTER SPECIFIC ROUTES
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }
    
    const event = await Event.findById(eventId).populate('organizer', 'username name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ensure all required fields exist as arrays, even if empty
    const eventResponse = event.toObject();
    eventResponse.speakers = eventResponse.speakers || [];
    eventResponse.gallery = eventResponse.gallery || [];
    eventResponse.sponsors = eventResponse.sponsors || [];
    eventResponse.faqs = eventResponse.faqs || [];
    
    res.status(200).json(eventResponse);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
});

// POST a new event (requires authentication)
router.post('/', isAuthenticated, handleFormData, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'date', 'time', 'location', 'registrationMethod'];
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    let categoryToUse = req.body.category;
    let categoryRequiresApproval = false;

    // Handle custom categories
    if (req.body.category === 'other' && req.body.customCategory) {
      const customCategoryName = req.body.customCategory.trim().toLowerCase();
      
      // Check if the custom category already exists
      const Category = require('E:\\Projects\\sre\\Event-koi\\models\\Category.js');
      let existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${customCategoryName}$`, 'i') }
      });

      if (existingCategory) {
        if (existingCategory.status === 'approved' && existingCategory.isActive) {
          // Use the existing approved category
          categoryToUse = existingCategory.name;
        } else if (existingCategory.status === 'pending') {
          // Category is pending approval
          categoryToUse = customCategoryName;
          categoryRequiresApproval = true;
        } else {
          // Category was rejected, treat as new suggestion
          categoryToUse = customCategoryName;
          categoryRequiresApproval = true;
        }
      } else {
        // Create new category suggestion
        const newCategory = new Category({
          name: customCategoryName,
          description: `Category suggested by organizer for event: ${req.body.title}`,
          suggestedBy: req.session.userId,
          status: 'pending',
          isActive: false
        });
        await newCategory.save();
        
        categoryToUse = customCategoryName;
        categoryRequiresApproval = true;
        
        // Log the new category suggestion
        const AdminLog = require('E:\\Projects\\sre\\Event-koi\\models\\AdminLog.js');
        const logEntry = new AdminLog({
          admin: null,
          action: 'category_suggested',
          targetType: 'category',
          targetId: newCategory._id,
          details: `New category "${customCategoryName}" suggested by organizer`,
          metadata: {
            suggestedBy: req.session.userId,
            eventId: null // Will be updated after event creation
          }
        });
        await logEntry.save();
      }
    }

    const eventData = {
      title: req.body.title,
      description: req.body.description,
      category: categoryToUse,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      registrationMethod: req.body.registrationMethod,
      registrationDeadline: req.body.registrationDeadline || null,
      prizeInfo: req.body.prizeInfo || '',
      rules: req.body.rules || '',
      externalRegistrationUrl: req.body.externalRegistrationUrl || null,
      organizer: req.session.userId,
      coverImage: req.file ? req.file.filename : null,
      // If category requires approval, set special status
      approvalStatus: categoryRequiresApproval ? 'pending' : 'pending',
      // Add flag for admin to review category
      adminRemarks: categoryRequiresApproval ? `⚠️ This event uses a new category "${categoryToUse}" that requires approval. Please review the category management section.` : null
    };

    const newEvent = new Event(eventData);
    await newEvent.save();

    // Update the admin log with the event ID if we created a new category
    if (categoryRequiresApproval) {
      const AdminLog = require('E:\\Projects\\sre\\Event-koi\\models\\AdminLog.js');
      await AdminLog.updateOne(
        { action: 'category_suggested', 'metadata.suggestedBy': req.session.userId },
        { $set: { 'metadata.eventId': newEvent._id } },
        { sort: { createdAt: -1 } }
      );
    }

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

// POST sponsor inquiry for an event
router.post('/:id/sponsor-inquiry', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { company, contact, email, message } = req.body;

    // Validate required fields
    if (!company || !contact || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add the sponsor inquiry to the event
    event.sponsorInquiries.push({
      company,
      contact,
      email,
      message
    });

    await event.save();
    res.status(201).json({ message: 'Sponsor inquiry submitted successfully' });
  } catch (err) {
    console.error('Error submitting sponsor inquiry:', err);
    res.status(500).json({ message: 'Error submitting sponsor inquiry', error: err.message });
  }
});

// POST question for an event
router.post('/:id/question', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, email, question } = req.body;

    // Validate required fields
    if (!name || !email || !question) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add the question to the event
    event.questions.push({
      name,
      email,
      question
    });

    await event.save();
    res.status(201).json({ message: 'Question submitted successfully' });
  } catch (err) {
    console.error('Error submitting question:', err);
    res.status(500).json({ message: 'Error submitting question', error: err.message });
  }
});

// GET sponsor inquiries for organizer's events
router.get('/sponsor-inquiries', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ organizer: organizerId }).populate('organizer', 'username name');
    
    let allInquiries = [];
    events.forEach(event => {
      if (event.sponsorInquiries && event.sponsorInquiries.length > 0) {
        event.sponsorInquiries.forEach(inquiry => {
          allInquiries.push({
            ...inquiry.toObject(),
            eventTitle: event.title,
            eventId: event._id
          });
        });
      }
    });
    
    // Sort by submission date, newest first
    allInquiries.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.status(200).json(allInquiries);
  } catch (err) {
    console.error('Error fetching sponsor inquiries:', err);
    res.status(500).json({ message: 'Error fetching sponsor inquiries', error: err.message });
  }
});

// GET questions for organizer's events
router.get('/questions', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ organizer: organizerId }).populate('organizer', 'username name');
    
    let allQuestions = [];
    events.forEach(event => {
      if (event.questions && event.questions.length > 0) {
        event.questions.forEach(question => {
          allQuestions.push({
            ...question.toObject(),
            eventTitle: event.title,
            eventId: event._id
          });
        });
      }
    });
    
    // Sort by submission date, newest first
    allQuestions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.status(200).json(allQuestions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ message: 'Error fetching questions', error: err.message });
  }
});

// UPDATE event (for organizers to edit their own events)
router.put('/:id', isAuthenticated, isOrganizer, handleFormData, async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.session.userId;
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }
    
    // Find event and verify ownership
    const event = await Event.findOne({ _id: eventId, organizer: organizerId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found or you do not have permission to edit this event' });
    }
    
    // Parse JSON fields from FormData if they exist
    let contactInfo = event.contactInfo;
    let speakers = event.speakers;
    let faqs = event.faqs;
    let sponsors = event.sponsors;
    
    try {
      if (req.body.contactInfo) {
        contactInfo = JSON.parse(req.body.contactInfo);
      }
      if (req.body.speakers_json) {
        speakers = JSON.parse(req.body.speakers_json);
      }
      if (req.body.faqs_json) {
        faqs = JSON.parse(req.body.faqs_json);
      }
      if (req.body.sponsors_json) {
        sponsors = JSON.parse(req.body.sponsors_json);
      }
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
      console.error('parseError.message:', parseError.message);
      console.error('Stack trace:', parseError.stack);
      return res.status(400).json({ message: 'Invalid JSON in form data', error: parseError.message });
    }
    
    // Prepare the edited event data
    const editData = {
      title: req.body.title || event.title,
      description: req.body.description || event.description,
      category: req.body.category || event.category,
      date: req.body.date || event.date,
      time: req.body.time || event.time,
      location: req.body.location || event.location,
      registrationMethod: req.body.registrationMethod || event.registrationMethod,
      registrationDeadline: req.body.registrationDeadline || event.registrationDeadline,
      prizeInfo: req.body.prizeInfo || event.prizeInfo,
      rules: req.body.rules || event.rules,
      externalRegistrationUrl: req.body.externalRegistrationUrl || event.externalRegistrationUrl,
      contactInfo: contactInfo,
      speakers: speakers,
      faqs: faqs,
      sponsors: sponsors,
      schedule: req.body.schedule || event.schedule
    };
    
    // Handle cover image if new one is uploaded
    if (req.file) {
      editData.coverImage = req.file.filename;
    }
    
    // Create a new event entry for the edit (pending approval)
    const editedEvent = new Event({
      ...editData,
      organizer: organizerId,
      approvalStatus: 'pending',
      isEdit: true,
      originalEventId: eventId,
      editReason: 'Organizer requested changes'
    });
    
    await editedEvent.save();
    
    res.status(200).json({ 
      message: 'Event changes submitted for admin approval',
      editId: editedEvent._id,
      originalEventId: eventId
    });
  } catch (err) {
    console.error('Error submitting event changes:', err);
    res.status(500).json({ message: 'Error submitting event changes', error: err.message });
  }
});

// PUT /events/:eventId/resubmit - Resubmit a rejected/changes requested event
router.put('/:eventId/resubmit', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.session.userId;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ message: 'Forbidden: You can only resubmit your own events' });
    }
    
    // Check if event can be resubmitted
    if (!event.canResubmit) {
      return res.status(400).json({ 
        message: 'This event cannot be resubmitted. Please contact admin for assistance.' 
      });
    }
    
    // Check if event status allows resubmission
    if (!['rejected', 'changes_requested'].includes(event.approvalStatus)) {
      return res.status(400).json({ 
        message: 'Only rejected or events with requested changes can be resubmitted' 
      });
    }
    
    // Update event for resubmission
    const updateData = req.body;
    
    // Reset status to pending
    event.approvalStatus = 'pending';
    event.resubmissionCount = (event.resubmissionCount || 0) + 1;
    event.lastResubmittedAt = new Date();
    
    // Clear previous rejection/change request data
    event.rejectionReason = '';
    event.adminRemarks = '';
    
    // Mark requested changes as resolved if provided
    if (event.requestedChanges && event.requestedChanges.length > 0) {
      event.requestedChanges.forEach(change => {
        change.resolved = true;
      });
    }
    
    // Update event fields with new data
    Object.keys(updateData).forEach(key => {
      if (key !== 'approvalStatus' && key !== 'organizer' && updateData[key] !== undefined) {
        event[key] = updateData[key];
      }
    });
    
    // Add to review history
    event.reviewHistory.push({
      reviewedBy: organizerId,
      action: 'resubmitted',
      reason: `Resubmitted after ${event.resubmissionCount > 1 ? 'changes' : 'rejection'}`,
      timestamp: new Date()
    });
    
    await event.save();
    
    res.json({ 
      message: 'Event resubmitted successfully',
      event: {
        id: event._id,
        title: event.title,
        approvalStatus: event.approvalStatus,
        resubmissionCount: event.resubmissionCount
      }
    });
    
  } catch (error) {
    console.error('Error resubmitting event:', error);
    res.status(500).json({ message: 'Error resubmitting event', error: error.message });
  }
});

// GET /events/organizer/my-events - Get organizer's events with status info
router.get('/organizer/my-events', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { organizer: organizerId };
    if (status && status !== 'all') {
      query.approvalStatus = status;
    }
    
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title description category date time location approvalStatus canResubmit resubmissionCount rejectionReason requestedChanges deletionStatus createdAt');
    
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
    
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// PUT /events/:eventId/request-deletion - Request event deletion
router.put('/:eventId/request-deletion', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;
    const organizerId = req.session.userId;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ message: 'Forbidden: You can only request deletion of your own events' });
    }
    
    // Check if event is already in deletion process
    if (['requested', 'admin_review', 'approved'].includes(event.deletionStatus)) {
      return res.status(400).json({ 
        message: 'Event deletion is already in progress' 
      });
    }
    
    // Update deletion status
    event.deletionStatus = 'requested';
    event.deletionRequestedBy = 'organizer';
    event.deletionRequestedAt = new Date();
    event.deletionReason = reason || 'Organizer requested deletion';
    
    await event.save();
    
    res.json({ 
      message: 'Event deletion request submitted successfully. Admin will review and approve.',
      event: {
        id: event._id,
        title: event.title,
        deletionStatus: event.deletionStatus
      }
    });
    
  } catch (error) {
    console.error('Error requesting event deletion:', error);
    res.status(500).json({ message: 'Error requesting deletion', error: error.message });
  }
});

// GET all events for admin (including pending and rejected)
router.get('/admin/all-events', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const events = await Event.find({}).populate('organizer', 'username name email');
    
    // Group events by approval status
    const groupedEvents = {
      pending: events.filter(event => event.approvalStatus === 'pending'),
      approved: events.filter(event => event.approvalStatus === 'approved'),
      rejected: events.filter(event => event.approvalStatus === 'rejected')
    };
    
    res.status(200).json(groupedEvents);
  } catch (err) {
    console.error('Error fetching all events:', err);
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

// PUT update event approval status (admin only)
router.put('/admin/:id/approval', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { approvalStatus, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Invalid approval status' });
    }

    const updateData = { approvalStatus };
    if (approvalStatus === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, { 
      new: true, 
      runValidators: true 
    }).populate('organizer', 'username name email');

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error('Error updating event approval:', err);
    res.status(500).json({ message: 'Error updating event approval', error: err.message });
  }
});

// GET admin dashboard stats
router.get('/admin/dashboard-stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const pendingApprovals = await Event.countDocuments({ approvalStatus: 'pending' });
    const approvedEvents = await Event.countDocuments({ approvalStatus: 'approved' });
    const rejectedEvents = await Event.countDocuments({ approvalStatus: 'rejected' });
    
    // Get total registrations across all events
    const events = await Event.find({ approvalStatus: 'approved' });
    const totalRegistrations = events.reduce((sum, event) => sum + (event.registrations ? event.registrations.length : 0), 0);
    
    res.status(200).json({
      totalEvents,
      pendingApprovals,
      approvedEvents,
      rejectedEvents,
      totalRegistrations
    });
  } catch (err) {
    console.error('Error fetching admin dashboard stats:', err);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: err.message });
  }
});

// POST event registration
router.post('/:id/register', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, email, phone, university, yearOfStudy, skills, motivation } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if event exists and is approved
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'Event is not available for registration' });
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({ event: eventId, email: email });
    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Create new registration
    const registration = new Registration({
      event: eventId,
      user: req.session && req.session.userId ? req.session.userId : null,
      name,
      email,
      phone,
      university,
      yearOfStudy,
      skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
      motivation
    });

    await registration.save();

    // Add registration to event's registrations array
    event.registrations.push(registration._id);
    await event.save();

    res.status(201).json({ 
      message: 'Registration successful!',
      registrationId: registration._id 
    });
  } catch (err) {
    console.error('Error registering for event:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    res.status(500).json({ message: 'Error registering for event', error: err.message });
  }
});

// GET registrations for an event (organizer only)
router.get('/:id/registrations', isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.session.userId;

    // Check if user owns this event or is admin
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== organizerId && req.session.userRole !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to view registrations for this event' });
    }

    const registrations = await Registration.find({ event: eventId })
      .populate('user', 'username name email')
      .sort({ registrationDate: -1 });

    res.status(200).json(registrations);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: 'Error fetching registrations', error: err.message });
  }
});

// Report Event
router.post('/report', isAuthenticated, async (req, res) => {
  try {
    const { eventId, reason, details, reporterEmail } = req.body;
    
    if (!eventId || !reason) {
      return res.status(400).json({ 
        message: 'Event ID and reason are required.' 
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found.' 
      });
    }

    // Map frontend reasons to backend categories
    const reasonMapping = {
      'inappropriate_content': 'inappropriate_content',
      'misleading_information': 'fake_information',
      'spam': 'spam',
      'scam': 'spam', // Treat scam as spam for now
      'copyright_violation': 'copyright_violation',
      'other': 'other'
    };

    const category = reasonMapping[reason] || 'other';

    // Create the report
    const Report = require('E:\\Projects\\sre\\Event-koi\\models\\Report.js');
    
    const newReport = new Report({
      reportType: 'event',
      reportedBy: req.session.userId, // Now guaranteed to exist due to isAuthenticated middleware
      reportedEntity: eventId,
      reportedEntityModel: 'Event',
      reason: reason,
      description: details || 'No additional details provided',
      category: category,
      status: 'pending',
      priority: reason === 'scam' || reason === 'inappropriate_content' ? 'high' : 'medium'
    });

    // Add reporter email to admin notes if provided
    if (reporterEmail) {
      newReport.adminNotes = `Reporter email: ${reporterEmail}`;
    }

    await newReport.save();

    res.status(200).json({ 
      message: 'Report submitted successfully', 
      reportId: newReport._id 
    });

  } catch (error) {
    console.error('Error submitting event report:', error);
    res.status(500).json({ 
      message: 'Internal server error while submitting report' 
    });
  }
});

module.exports = router;
