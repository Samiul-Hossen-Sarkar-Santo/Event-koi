const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Report = require('./models/Report');

async function debugReports() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get raw reports data
        const reports = await Report.find({}).lean();
        console.log('Raw reports data:');
        reports.forEach((report, index) => {
            console.log(`\nReport ${index + 1}:`);
            console.log(`  reportType: ${report.reportType}`);
            console.log(`  reportedEntityModel: ${report.reportedEntityModel}`);
            console.log(`  reportedEntity: ${report.reportedEntity}`);
            console.log(`  reason: ${report.reason}`);
            console.log(`  status: ${report.status}`);
        });
        
    } catch (error) {
        console.error('Error debugging reports:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

debugReports();
