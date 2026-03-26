const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Forum name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Forum description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  url: {
    type: String,
    required: [true, 'Forum URL is required'],
    trim: true
  },
  image: {
    type: String,
    trim: true,
    default: null
  },
  favicon: {
    type: String,
    trim: true,
    default: null
  },
  language: {
    type: String,
    enum: ['es', 'en'],
    default: 'es'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Forum', forumSchema);
