const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./models/User');

async function createTestAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if test admin already exists
        let admin = await User.findOne({ email: 'test-admin@eventfinder.com' });
        
        if (admin) {
            console.log('Test admin already exists, updating password...');
            // Update password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            admin.password = hashedPassword;
            await admin.save();
        } else {
            // Create new test admin
            console.log('Creating new test admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            admin = new User({
                username: 'test-admin',
                email: 'test-admin@eventfinder.com',
                password: hashedPassword,
                role: 'admin',
                name: 'Test Admin',
                accountStatus: 'active'
            });

            await admin.save();
        }

        console.log('✅ Test admin ready:');
        console.log(`  Email: ${admin.email}`);
        console.log(`  Password: admin123`);
        console.log(`  Role: ${admin.role}`);
        console.log(`  ID: ${admin._id}`);

        // Test the password
        const isValidPassword = await bcrypt.compare('admin123', admin.password);
        console.log(`  Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
        
    } catch (error) {
        console.error('Error creating test admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createTestAdmin();
