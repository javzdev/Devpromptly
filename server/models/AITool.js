const mongoose = require('mongoose');

const aiToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tool name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  url: {
    type: String,
    required: [true, 'Tool URL is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Tool description is required'],
    trim: true,
    maxlength: [1200, 'Description cannot exceed 1200 characters']
  },
  category: {
    type: String,
    enum: ['writing', 'image', 'code', 'audio', 'video', 'productivity', 'research', 'chatbot', 'data', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AITool', aiToolSchema);
