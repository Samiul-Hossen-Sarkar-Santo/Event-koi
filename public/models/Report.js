const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['event', 'user', 'organizer'],
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedEntity: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // This can reference either Event or User depending on reportType
  },
  reportedEntityModel: {
    type: String,
    enum: ['Event', 'User'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: [
      'inappropriate_content',
      'spam',
      'harassment',
      'fake_information',
      'violence',
      'copyright_violation',
      'other'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  resolutionAction: {
    type: String,
    enum: [
      'no_action',
      'warning_issued',
      'content_removed',
      'user_suspended',
      'user_banned',
      'event_rejected',
      'organizer_restricted'
    ]
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  evidence: [{
    type: String, // URLs or file paths to evidence
    description: String
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ reportType: 1, status: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ resolvedBy: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
