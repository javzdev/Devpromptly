const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: 'Username can only contain letters, numbers, and underscores'
    },
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },
    select: false
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=random'
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },
  emailVerified: { 
    type: Boolean, 
    default: false
  },
  emailVerificationToken: { 
    type: String, 
    select: false 
  },
  emailVerificationExpires: { 
    type: Date, 
    select: false 
  },
  passwordResetToken: { 
    type: String, 
    select: false 
  },
  passwordResetExpires: { 
    type: Date, 
    select: false 
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prompt'
  }],
  stats: {
    promptsCreated: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  },
  preferences: {
    showNSFW: {
      type: Boolean,
      default: false
    }
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Soft delete method
userSchema.methods.softDelete = async function() {
  this.deletedAt = new Date();
  this.isActive = false;
  await this.save();
};

// Restore soft deleted user
userSchema.methods.restore = async function() {
  this.deletedAt = null;
  this.isActive = true;
  await this.save();
};

// Method to update user stats
userSchema.methods.updateStats = async function() {
  const Prompt = mongoose.model('Prompt');
  
  const stats = await Prompt.aggregate([
    {
      $match: {
        author: this._id,
        status: 'approved',
        deletedAt: null
      }
    },
    {
      $group: {
        _id: null,
        promptsCreated: { $sum: 1 },
        totalRatings: { $sum: '$ratings.count' },
        sumOfRatings: { $sum: { $multiply: ['$ratings.average', '$ratings.count'] } }
      }
    }
  ]);

  if (stats.length > 0) {
    const { promptsCreated, totalRatings, sumOfRatings } = stats[0];
    this.stats.promptsCreated = promptsCreated;
    this.stats.totalRatings = totalRatings;
    this.stats.averageRating = totalRatings > 0 ? Math.round((sumOfRatings / totalRatings) * 10) / 10 : 0;
  } else {
    this.stats.promptsCreated = 0;
    this.stats.totalRatings = 0;
    this.stats.averageRating = 0;
  }
  
  await this.save();
};

// Virtual for user's prompts
userSchema.virtual('prompts', {
  ref: 'Prompt',
  localField: '_id',
  foreignField: 'author',
  match: { deletedAt: null }
});

// Index for performance
userSchema.index({ 'stats.promptsCreated': -1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
