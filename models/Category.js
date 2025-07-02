const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  icon: {
    type: String, // Font Awesome icon class or emoji
    default: 'fas fa-calendar'
  },
  color: {
    type: String, // Hex color code for UI theming
    default: '#3B82F6'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false // Only becomes true when approved
  },
  usageCount: {
    type: Number,
    default: 0 // Track how many events use this category
  }
}, {
  timestamps: true
});

// Add indexes
categorySchema.index({ status: 1, createdAt: -1 });
categorySchema.index({ isActive: 1, name: 1 });
categorySchema.index({ suggestedBy: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
