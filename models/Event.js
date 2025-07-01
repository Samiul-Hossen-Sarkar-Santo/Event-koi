const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming a User model exists
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  prizeInfo: {
    type: String,
    trim: true
  },
  rules: {
    type: String
  },
  coverImageUrl: {
    type: String,
    trim: true
  },
  registrationMethod: {
    type: String,
    enum: ['platform', 'external'],
    required: true
  },
  externalRegistrationUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.registrationMethod === 'external') {
          return /^https:\/\/\S+/.test(v); // Basic https URL validation
        }
        return true;
      },
      message: props => `${props.value} is not a valid https URL for external registration!`
    }
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  registrations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration' // Reference to a future Registration model
    }
  ],
  interestedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Reference to the User model
    }
  ],
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;