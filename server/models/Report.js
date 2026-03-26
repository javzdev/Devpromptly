const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['prompt'],
    required: true,
    default: 'prompt'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'inappropriate', 'misleading', 'copyright', 'other'],
    required: true
  },
  details: {
    type: String,
    maxlength: [500, 'Details cannot exceed 500 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolutionNote: {
    type: String,
    maxlength: [500, 'Resolution note cannot exceed 500 characters'],
    default: ''
  }
}, { timestamps: true });

// One report per user per target — prevents spam reporting
reportSchema.index({ reporter: 1, targetId: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
