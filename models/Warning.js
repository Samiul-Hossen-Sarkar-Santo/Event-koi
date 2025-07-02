const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    maxlength: 500
  },
  severity: {
    type: String,
    enum: ['minor', 'major', 'severe'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'inappropriate_behavior',
      'spam',
      'harassment',
      'policy_violation',
      'fake_information',
      'other'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'expired'],
    default: 'active'
  },
  acknowledgedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  relatedReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }
}, {
  timestamps: true
});

// Add indexes
warningSchema.index({ userId: 1, status: 1, createdAt: -1 });
warningSchema.index({ issuedBy: 1, createdAt: -1 });
warningSchema.index({ status: 1, expiresAt: 1 });

const Warning = mongoose.model('Warning', warningSchema);

module.exports = Warning;
