const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./models/User');

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if test user already exists
        let user = await User.findOne({ email: 'testuser@eventfinder.com' });
        
        if (user) {
            console.log('Test user already exists, updating password...');
            // Update password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('user123', salt);
            user.password = hashedPassword;
            await user.save();
        } else {
            // Create new test user
            console.log('Creating new test user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('user123', salt);

            user = new User({
                username: 'testuser2025',
                email: 'testuser@eventfinder.com',
                password: hashedPassword,
                role: 'user',
                name: 'Test User',
                bio: 'I am a test user for the Event Finder platform.',
                university: 'Test University',
                yearOfStudy: '3rd Year',
                skills: ['Testing', 'Quality Assurance', 'Event Planning'],
                interests: ['Technology', 'Networking', 'Learning'],
                accountStatus: 'active'
            });

            await user.save();
        }

        console.log('✅ Test user ready:');
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: user123`);
        console.log(`  Role: ${user.role}`);
        console.log(`  ID: ${user._id}`);

        // Test the password
        const isValidPassword = await bcrypt.compare('user123', user.password);
        console.log(`  Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
        
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createTestUser();
