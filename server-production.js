require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

connectDB();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Session Middleware with environment-based configuration
const sessionSecret = process.env.SESSION_SECRET || '$#@3ozr89r5nno10s7aum5#9l6i@i$$drlahj1537ksm72s60u7r7na0s118c0sos1a59rkM2d80!';

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static file serving - use relative paths for better portability
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  // Development: serve from current directory
  app.use(express.static(__dirname));
  app.use('/css', express.static(path.join(__dirname, 'css')));
  app.use('/js', express.static(path.join(__dirname, 'js')));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} else {
  // Production: serve from public directory (Firebase hosting)
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// API Routes
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/categories', categoryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
