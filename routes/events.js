const express = require('express');
const Event = require('E:\\Projects\\sre\\Event-koi\\models\\Event.js'); // Assuming Event.js is in the models folder
const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized: Please log in.' });
}

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

// GET a single event by ID (placeholder)
router.get('/:id', (req, res) => {
  const eventId = req.params.id;
  // Placeholder: Implement logic to fetch and return a single event by ID
  res.status(200).json({ message: `Placeholder for viewing event with ID: ${eventId}` });
});

// POST a new event (requires authentication)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.session.userId, // Associate the event with the authenticated user (organizer)
      approvalStatus: 'pending' // Set the initial approval status to 'pending'
    };

    const newEvent = new Event(eventData);
    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

module.exports = router;