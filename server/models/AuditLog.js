const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'approve', 'reject', 'delete', 'toggle_status', 'create', 'update',
      'login', 'logout', 'password_reset', 'email_verification',
      'add_moderator', 'remove_moderator',
      'create_forum', 'update_forum', 'delete_forum',
      'create_tool', 'update_tool', 'delete_tool'
    ]
  },
  targetType: {
    type: String,
    required: true,
    enum: ['prompt', 'user', 'system', 'forum', 'tool']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByUsername: {
    type: String,
    required: true
  },
  performedByRole: {
    type: String,
    required: true,
    enum: ['user', 'moderator', 'admin']
  },
  details: {
    type: Object,
    default: {}
  },
  reason: {
    type: String,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetType: 1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, targetType: 1 });
auditLogSchema.index({ performedByRole: 1, createdAt: -1 });

// Static method to create audit log
auditLogSchema.statics.createLog = async function(data) {
  try {
    const log = await this.create(data);
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - logging should not break the main operation
    return null;
  }
};

// Static method to get recent admin actions
auditLogSchema.statics.getRecentActions = async function(limit = 50, filters = {}) {
  return await this.find(filters)
    .populate('performedBy', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get actions by admin
auditLogSchema.statics.getActionsByAdmin = async function(adminId, limit = 50) {
  return await this.find({ performedBy: adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get actions on specific target
auditLogSchema.statics.getActionsOnTarget = async function(targetId, targetType) {
  return await this.find({ targetId, targetType })
    .populate('performedBy', 'username avatar')
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
