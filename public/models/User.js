const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user'
  },
  // Enhanced user profile fields
  name: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  university: {
    type: String,
    trim: true
  },
  yearOfStudy: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  profilePicture: {
    type: String,
    trim: true
  },
  
  // Legacy fields for backward compatibility
  personalInfo: {
    name: {
      type: String,
      trim: true
    },
    contactDetails: {
      phone: String,
      address: String
    },
    universityOrganization: {
      type: String,
      trim: true
    },
    skills: [String],
    tShirtSize: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'N/A']
    }
  },
  
  // User engagement fields
  favoriteEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  interestedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  
  // Notification preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    eventReminders: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: false
    }
  },
  
  // Activity tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Admin management fields
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'restricted'],
    default: 'active'
  },
  statusReason: {
    type: String,
    trim: true
  },
  statusChangedAt: {
    type: Date
  },
  statusChangedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  restrictions: {
    canCreateEvents: { type: Boolean, default: true },
    canComment: { type: Boolean, default: true },
    canReport: { type: Boolean, default: true },
    canRegisterForEvents: { type: Boolean, default: true }
  },
  restrictionsExpireAt: {
    type: Date
  },
  warningCount: {
    type: Number,
    default: 0
  },
  lastWarningAt: {
    type: Date
  },
  organizerStatus: {
    type: String,
    enum: ['none', 'verified', 'restricted', 'revoked'],
    default: 'none'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;