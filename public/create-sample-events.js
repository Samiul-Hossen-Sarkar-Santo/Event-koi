// Quick script to create sample events for approval queue testing
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Event = require('./models/Event');
const User = require('./models/User');

async function createSampleEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventkoi');
    console.log('Connected to MongoDB');

    // Get some users to be organizers
    const users = await User.find({ role: { $in: ['organizer', 'user'] } }).limit(3);

    if (users.length < 1) {
      console.log('Need at least 1 user. Please run create-admin-user.js first.');
      process.exit(1);
    }

    // Check if events already exist
    const existingEvents = await Event.countDocuments();
    if (existingEvents > 3) {
      console.log(`${existingEvents} events already exist.`);
      process.exit(0);
    }

    const sampleEvents = [
      {
        title: 'Web Development Workshop',
        description: 'Learn modern web development techniques including React, Node.js, and MongoDB.',
        category: 'Technology',
        organizer: users[0]._id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        time: '10:00 AM',
        location: 'Tech Hub, Room 101',
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        prizeInfo: 'Certificate of completion and goodies',
        rules: 'Bring your laptop and be ready to code!',
        approvalStatus: 'pending',
        maxParticipants: 50
      },
      {
        title: 'Data Science Bootcamp',
        description: 'Intensive bootcamp covering Python, machine learning, and data visualization.',
        category: 'Technology',
        organizer: users[0]._id,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        time: '9:00 AM',
        location: 'University Auditorium',
        registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        prizeInfo: 'Industry-recognized certificate',
        rules: 'Basic programming knowledge required',
        approvalStatus: 'pending',
        maxParticipants: 100
      },
      {
        title: 'Music Festival 2025',
        description: 'Annual music festival featuring local and international artists.',
        category: 'Entertainment',
        organizer: users.length > 1 ? users[1]._id : users[0]._id,
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        time: '6:00 PM',
        location: 'City Park Amphitheater',
        registrationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        prizeInfo: 'Free t-shirt and festival merchandise',
        rules: 'No outside food or drinks allowed',
        approvalStatus: 'changes_requested',
        adminRemarks: 'Please provide more details about security arrangements',
        maxParticipants: 500
      }
    ];

    await Event.insertMany(sampleEvents);
    console.log(`${sampleEvents.length} sample events created successfully for approval queue!`);

  } catch (error) {
    console.error('Error creating sample events:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSampleEvents();
