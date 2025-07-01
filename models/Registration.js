const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous registrations
  },
  // For anonymous registrations
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
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
  motivation: {
    type: String,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['confirmed', 'waitlist', 'cancelled'],
    default: 'confirmed'
  },
  checkInTime: {
    type: Date
  },
  additionalInfo: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ event: 1, email: 1 }, { unique: true });

// Instance method to check if registration is valid
registrationSchema.methods.isValid = function() {
  return this.status === 'confirmed' && this.event;
};

// Static method to get registrations for an event
registrationSchema.statics.getEventRegistrations = function(eventId) {
  return this.find({ event: eventId }).populate('user', 'username name email');
};

module.exports = mongoose.model('Registration', registrationSchema);
