// Test script to create a sample report for testing
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-koi')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const Report = require('./models/Report');
const User = require('./models/User');
const Event = require('./models/Event');

async function createTestReport() {
  try {
    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword', // This would normally be hashed
        role: 'user'
      });
      await testUser.save();
      console.log('Created test user');
    }

    // Find or create a test event
    let testEvent = await Event.findOne({ title: 'Test Event for Report' });
    if (!testEvent) {
      testEvent = new Event({
        title: 'Test Event for Report',
        description: 'This is a test event',
        date: new Date(),
        time: '10:00',
        location: 'Test Location',
        organizer: testUser._id,
        category: 'Technology',
        registrationMethod: 'platform',
        capacity: 50,
        approvalStatus: 'approved'
      });
      await testEvent.save();
      console.log('Created test event');
    }

    // Create a test report
    const testReport = new Report({
      reportType: 'event',
      reportedBy: testUser._id,
      reportedEntity: testEvent._id,
      reportedEntityModel: 'Event',
      reason: 'inappropriate_content',
      description: 'This is a test report to verify the admin dashboard functionality',
      category: 'inappropriate_content',
      status: 'pending',
      priority: 'medium'
    });

    await testReport.save();
    console.log('Created test report:', testReport._id);

    // Create another report for variety
    const testReport2 = new Report({
      reportType: 'event',
      reportedBy: testUser._id,
      reportedEntity: testEvent._id,
      reportedEntityModel: 'Event',
      reason: 'spam',
      description: 'Another test report with different category',
      category: 'spam',
      status: 'pending',
      priority: 'high'
    });

    await testReport2.save();
    console.log('Created second test report:', testReport2._id);

    console.log('Test reports created successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error creating test reports:', error);
    process.exit(1);
  }
}

createTestReport();
