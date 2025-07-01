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


// GET all events (placeholder)
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
    const events = await Event.find({ organizer: organizerId }).populate('organizer', 'username name email');
    
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
    
    res.status(200).json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
});

// POST a new event (requires authentication)
router.post('/', isAuthenticated, handleFormData, async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Session userId:', req.session.userId);
    console.log('Uploaded file:', req.file);

    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'date', 'time', 'location', 'registrationMethod'];
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    const eventData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      registrationMethod: req.body.registrationMethod,
      registrationDeadline: req.body.registrationDeadline || null,
      prizeInfo: req.body.prizeInfo || '',
      rules: req.body.rules || '',
      externalRegistrationUrl: req.body.externalRegistrationUrl || null,
      organizer: req.session.userId, // Associate the event with the authenticated user (organizer)
      // Save the path to the uploaded image
      coverImage: req.file ? req.file.filename : null, // Store just the filename
      // Note: Ensure 'coverImage' is defined in your Event Mongoose schema as a String
      approvalStatus: 'pending' // Set the initial approval status to 'pending'
    };

    console.log('Event data to save:', eventData);

    const newEvent = new Event(eventData);
    await newEvent.save();

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

// GET organizer's own events
router.get('/my-events', isAuthenticated, isOrganizer, async (req, res) => {
  try {
    const organizerId = req.session.userId;
    const events = await Event.find({ organizer: organizerId }).populate('organizer', 'username name email');
    
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

// UPDATE event (for organizers to edit their own events)
router.put('/:id', isAuthenticated, isOrganizer, handleFormData, async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.session.userId;
    
    // Find event and verify ownership
    const event = await Event.findOne({ _id: eventId, organizer: organizerId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found or you do not have permission to edit this event' });
    }
    
    // Prepare update data
    const updateData = {
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
      externalRegistrationUrl: req.body.externalRegistrationUrl || event.externalRegistrationUrl
    };
    
    // Update cover image if new one is uploaded
    if (req.file) {
      updateData.coverImage = req.file.filename;
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, { new: true, runValidators: true });
    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Error updating event', error: err.message });
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

module.exports = router;