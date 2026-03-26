const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'prompt_approved',    // Author: your prompt was approved
      'prompt_rejected',    // Author: your prompt was rejected
      'new_report',         // Admin: a prompt was reported
      'new_pending_prompt', // Admin: new prompt awaiting review
      'report_resolved'     // Author: a report on your prompt was resolved
    ],
    required: true
  },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 300 },
  link: { type: String, default: null },  // where to navigate on click
  read: { type: Boolean, default: false, index: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} } // extra data (promptId, reason, etc.)
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
