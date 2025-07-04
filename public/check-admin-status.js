const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Report = require('./models/Report');
const Event = require('./models/Event');

async function checkAdminStatus() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check for admin users
        const adminUsers = await User.find({ role: 'admin' });
        console.log('\n=== ADMIN USERS ===');
        console.log(`Found ${adminUsers.length} admin users:`);
        adminUsers.forEach(admin => {
            console.log(`- ${admin.email} (ID: ${admin._id})`);
        });

        // Check for reports
        const reports = await Report.find()
            .populate('reportedEntity', 'title email')
            .populate('reportedBy', 'email');
        console.log('\n=== REPORTS ===');
        console.log(`Found ${reports.length} reports:`);
        reports.forEach(report => {
            console.log(`- Type: ${report.reportType}`);
            console.log(`  Entity: ${report.reportedEntity?.title || report.reportedEntity?.email || 'Unknown'}`);
            console.log(`  Reason: ${report.reason}`);
            console.log(`  Reported by: ${report.reportedBy?.email || 'Unknown'}`);
            console.log(`  Status: ${report.status}`);
            console.log(`  Date: ${report.reportDate}`);
            console.log('---');
        });

        // Check for events
        const events = await Event.find();
        console.log(`\n=== EVENTS ===`);
        console.log(`Found ${events.length} events total`);

        const pendingEvents = await Event.find({ status: 'pending' });
        console.log(`Found ${pendingEvents.length} pending events`);

        console.log('\nStatus check complete!');
        
    } catch (error) {
        console.error('Error checking admin status:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkAdminStatus();
