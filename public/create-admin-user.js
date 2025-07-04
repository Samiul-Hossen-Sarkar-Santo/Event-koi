// Quick script to create an admin user for testing
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventkoi');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@eventkoi.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@eventkoi.com',
      password: hashedPassword,
      role: 'admin',
      name: 'Admin User',
      accountStatus: 'active'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@eventkoi.com');
    console.log('Password: admin123');

    // Create some sample users for testing
    const users = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        name: 'John Doe',
        accountStatus: 'active'
      },
      {
        username: 'janesmith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'organizer',
        name: 'Jane Smith',
        accountStatus: 'active'
      },
      {
        username: 'bobwilson',
        email: 'bob@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        name: 'Bob Wilson',
        accountStatus: 'suspended'
      },
      {
        username: 'alice',
        email: 'alice@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        name: 'Alice Johnson',
        accountStatus: 'banned'
      }
    ];

    await User.insertMany(users);
    console.log('Sample users created successfully!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser();
