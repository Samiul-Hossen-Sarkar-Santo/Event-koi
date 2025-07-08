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
    required: false // Make it optional as stated in the form
  },
  prizeInfo: {
    type: String,
    trim: true
  },
  rules: {
    type: String
  },
  coverImage: {
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
    enum: ['pending', 'approved', 'rejected', 'changes_requested'],
    default: 'pending'
  },
  adminRemarks: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  requestedChanges: [{
    field: String,
    comment: String,
    resolved: { type: Boolean, default: false }
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  reviewHistory: [{
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'changes_requested', 'resubmitted']
    },
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
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
  // Extended fields for future functionality
  schedule: {
    type: String,
    default: ''
  },
  speakers: [{
    name: String,
    title: String,
    bio: String,
    image: String
  }],
  gallery: [{
    type: String // Image filenames
  }],
  sponsors: [{
    name: String,
    logo: String,
    website: String,
    tier: {
      type: String,
      enum: ['gold', 'silver', 'bronze', 'partner'],
      default: 'partner'
    }
  }],
  faqs: [{
    question: String,
    answer: String
  }],
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  // For organizer dashboard
  sponsorInquiries: [{
    company: String,
    contact: String,
    email: String,
    message: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  questions: [{
    name: String,
    email: String,
    question: String,
    answer: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    answeredAt: Date,
    isPublic: {
      type: Boolean,
      default: false
    }
  }],
  // Event deletion management
  deletionStatus: {
    type: String,
    enum: ['none', 'requested', 'admin_review', 'approved', 'denied'],
    default: 'none'
  },
  deletionRequestedBy: {
    type: String,
    enum: ['organizer', 'admin'],
    default: null
  },
  deletionRequestedAt: {
    type: Date
  },
  deletionReason: {
    type: String,
    trim: true
  },
  deletionApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletionApprovedAt: {
    type: Date
  },
  // Enhanced moderation and resubmission workflow
  canResubmit: {
    type: Boolean,
    default: true
  },
  resubmissionCount: {
    type: Number,
    default: 0
  },
  lastResubmittedAt: {
    type: Date
  },
  // Event editing workflow
  isEdit: {
    type: Boolean,
    default: false
  },
  originalEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  editReason: {
    type: String,
    trim: true
  },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;