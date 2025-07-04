// Quick script to create sample reports for testing
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Report = require('./models/Report');
const User = require('./models/User');
const Event = require('./models/Event');

async function createSampleReports() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventkoi');
    console.log('Connected to MongoDB');

    // Get some users and events for reporting
    const users = await User.find().limit(3);
    const events = await Event.find().limit(2);

    if (users.length < 2) {
      console.log('Need at least 2 users. Please run create-admin-user.js first.');
      process.exit(1);
    }

    // Check if reports already exist
    const existingReports = await Report.countDocuments();
    if (existingReports > 0) {
      console.log(`${existingReports} reports already exist.`);
      process.exit(0);
    }

    const sampleReports = [
      {
        reportType: 'user',
        reportedBy: users[0]._id,
        reportedEntity: users[1]._id,
        reportedEntityModel: 'User',
        reason: 'Inappropriate behavior',
        description: 'User was posting spam comments and harassing other members.',
        category: 'harassment',
        status: 'pending',
        priority: 'high'
      },
      {
        reportType: 'user',
        reportedBy: users[1]._id,
        reportedEntity: users[2]._id,
        reportedEntityModel: 'User',
        reason: 'Fake information',
        description: 'User profile contains false credentials and misleading information.',
        category: 'fake_information',
        status: 'investigating',
        priority: 'medium'
      }
    ];

    // Add event reports if events exist
    if (events.length > 0) {
      sampleReports.push({
        reportType: 'event',
        reportedBy: users[0]._id,
        reportedEntity: events[0]._id,
        reportedEntityModel: 'Event',
        reason: 'Inappropriate content',
        description: 'Event contains offensive language and inappropriate imagery.',
        category: 'inappropriate_content',
        status: 'pending',
        priority: 'urgent'
      });
    }

    await Report.insertMany(sampleReports);
    console.log(`${sampleReports.length} sample reports created successfully!`);

  } catch (error) {
    console.error('Error creating sample reports:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSampleReports();
