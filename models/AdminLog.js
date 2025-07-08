const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for system actions like ban appeals
  },
  action: {
    type: String,
    enum: [
      'event_approved',
      'event_rejected',
      'event_changes_requested',
      'event_deletion_approved',
      'event_deletion_rejected',
      'user_warned',
      'user_suspended',
      'user_banned',
      'user_unbanned',
      'user_account_restored',
      'appeal_approved',
      'appeal_rejected',
      'ban_appeal_submitted',
      'organizer_restricted',
      'organizer_unrestricted',
      'category_approved',
      'category_rejected',
      'report_resolved',
      'report_dismissed',
      'admin_created',
      'admin_permissions_changed'
    ],
    required: true
  },
  targetType: {
    type: String,
    enum: ['Event', 'User', 'Category', 'Report'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    reason: String,
    previousStatus: String,
    newStatus: String,
    duration: String, // For temporary restrictions
    additionalNotes: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  ipAddress: {
    type: String,
    required: false // Allow null for system actions
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Add indexes for efficient querying
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ severity: 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 }); // For general chronological queries

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog;
