// Test script to create an admin user and test admin login
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-koi')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const User = require('./models/User');

async function createAdminUser() {
  try {
    // Check if admin user already exists
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = new User({
        username: 'admin',
        email: 'admin@eventkoi.com',
        password: hashedPassword,
        role: 'admin',
        accountStatus: 'active'
      });
      
      await adminUser.save();
      console.log('Created admin user:');
      console.log('Username: admin');
      console.log('Email: admin@eventkoi.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists:');
      console.log('Email:', adminUser.email);
      console.log('Username:', adminUser.username);
      console.log('Role:', adminUser.role);
    }

    console.log('Admin user is ready for testing!');
    process.exit(0);

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
