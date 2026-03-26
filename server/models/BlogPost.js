const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  excerpt: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['guide', 'tutorial', 'ranking', 'news', 'photo', 'review', 'opinion'],
    required: true,
  },
  coverImage: {
    type: String,
    default: '',
  },
  images: [{ type: String }],
  mentions: [{
    kind:        { type: String, enum: ['tool', 'prompt', 'community'], required: true },
    refId:       { type: String },
    name:        { type: String },
    url:         { type: String },
    category:    { type: String },
    description: { type: String },
  }],
  tags: [{ type: String, lowercase: true, trim: true }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  published: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readTime: {
    type: Number,
    default: 1,
  },
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true, trim: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

// Auto-generate slug and calculate read time before save
blogPostSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);
  }
  if (this.isModified('content')) {
    const wordCount = this.content.trim().split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  next();
});

blogPostSchema.index({ category: 1, published: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ featured: 1, published: 1 });
blogPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
