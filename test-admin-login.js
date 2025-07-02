const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./models/User');

async function testAdminLogin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the admin user
        const admin = await User.findOne({ email: 'admin1@gmail.com' });
        
        if (!admin) {
            console.log('❌ No admin user found');
            return;
        }

        console.log('✅ Admin user found:');
        console.log(`  Email: ${admin.email}`);
        console.log(`  Role: ${admin.role}`);
        console.log(`  ID: ${admin._id}`);
        console.log(`  Password hash exists: ${!!admin.password}`);

        // Test password comparison (should be 'admin' based on previous setup)
        const isValidPassword = await bcrypt.compare('admin', admin.password);
        console.log(`  Password 'admin' is valid: ${isValidPassword}`);

        console.log('\n📝 You can now login with:');
        console.log('  Email: admin1@gmail.com');
        console.log('  Password: admin');
        
    } catch (error) {
        console.error('Error testing admin login:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testAdminLogin();
