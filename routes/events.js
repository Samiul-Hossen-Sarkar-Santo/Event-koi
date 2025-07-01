const express = require('express');
const mongoose = require('mongoose');
const Event = require('E:\\Projects\\sre\\Event-koi\\models\\Event.js'); // Assuming Event.js is in the models folder
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
const upload = multer({ storage: storage });


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

// GET a single event by ID
router.get('/:id', async (req, res) => { // Corrected route path
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId).populate('organizer', 'username name email'); // Populate organizer field
    
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
router.post('/', isAuthenticated, upload.single('coverImage'), async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Session userId:', req.session.userId);
    console.log('Uploaded file:', req.file);

    const eventData = {
      ...req.body,
      organizer: req.session.userId, // Associate the event with the authenticated user (organizer)
      // Save the path to the uploaded image
      coverImage: req.file ? `/uploads/${req.file.filename}` : null, // Store the relative path or URL
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

module.exports = router;