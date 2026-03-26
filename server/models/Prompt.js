const mongoose = require('mongoose');
const validator = require('validator');

const promptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  prompt: {
    type: String,
    required: [true, 'Prompt content is required'],
    trim: true,
    maxlength: [5000, 'Prompt cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'text-generation', // ChatGPT, Claude, etc.
      'image-generation', // Midjourney, DALL-E, etc.
      'code-generation', // GitHub Copilot, CodeLlama, etc.
      'audio-generation', // Music, voice, etc.
      'video-generation', // Video creation, etc.
      'data-analysis', // Data processing, etc.
      'translation', // Language translation
      'other'
    ]
  },
  aiTool: {
    type: String,
    required: [true, 'AI Tool is required'],
    enum: [
      // Chatbot
      'ChatGPT', 'Claude', 'Gemini', 'Grok', 'Perplexity', 'Llama', 'Mistral', 'DeepSeek',
      'Intercom Fin', 'Drift', 'Tidio', 'Voiceflow', 'Lobe Chat', 'Character.ai', 'Pi',
      // Image
      'Midjourney', 'DALL-E', 'Stable Diffusion', 'Flux', 'Firefly', 'Ideogram', 'Leonardo AI',
      // Video
      'Sora', 'Runway', 'Pika Labs', 'Kling AI', 'Luma Dream Machine', 'Synthesia', 'HeyGen',
      // Audio
      'Suno', 'Udio', 'Adobe Podcast', 'Descript', 'Podcastle',
      // Voice
      'ElevenLabs', 'Murf AI', 'Krisp', 'Speechify', 'Resemble AI', 'Play.ht',
      // Code
      'GitHub Copilot', 'Cursor', 'CodeLlama', 'Tabnine', 'Codeium',
      'Replit AI', 'v0 by Vercel', 'Bolt.new', 'Hugging Face', 'LangChain', 'Replicate',
      // Productivity
      'Notion AI', 'Otter.ai', 'Fireflies.ai', 'Motion', 'Reclaim AI',
      'Gamma App', 'Beautiful.ai', 'Tome', 'Mem AI', 'Loom AI', 'Glean',
      // Design
      'Canva AI', 'Figma AI', 'Looka', 'Uizard', 'Khroma', 'Framer AI', 'Picsart AI', 'Remove.bg', 'Lensa AI',
      // Writing
      'Jasper', 'Copy.ai', 'Writesonic', 'Grammarly', 'Hemingway App', 'Sudowrite', 'QuillBot', 'Lex.page',
      // SEO
      'Surfer SEO', 'Semrush AI', 'Frase.io', 'MarketMuse',
      // Marketing
      'HubSpot AI', 'Mailchimp AI', 'AdCreative.ai', 'Predis.ai', 'Hootsuite AI',
      // Data
      'Tableau AI', 'Power BI Copilot', 'Julius AI', 'MonkeyLearn', 'Obviously AI', 'Cohere',
      // Research
      'Elicit', 'Consensus', 'Semantic Scholar', 'Scite.ai',
      // Education
      'Duolingo Max', 'Khan Academy Khanmigo', 'Coursera AI',
      // Automation
      'Zapier AI', 'Make', 'n8n',
      // Other
      'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isNSFW: {
    type: Boolean,
    default: false,
    index: true
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) { return v.length <= 2; },
      message: 'Maximum 2 reference images allowed'
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    },
    // Track users who have rated to prevent duplicates
    userRatings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      ratedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  favorites: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  featured: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status !== 'pending';
    }
  },
  moderatedAt: {
    type: Date,
    required: function() {
      return this.status !== 'pending';
    }
  },
  rejectionReason: {
    type: String,
    required: function() {
      return this.status === 'rejected';
    },
    maxlength: [1000, 'Rejection reason cannot exceed 1000 characters']
  },
  deletedAt: {
    type: Date,
    default: null
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  lastReportedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search
promptSchema.index({ 
  title: 'text', 
  description: 'text', 
  prompt: 'text', 
  tags: 'text' 
});

// Index for filters
promptSchema.index({ category: 1, aiTool: 1, status: 1 });
promptSchema.index({ category: 1, status: 1, featured: -1 });
promptSchema.index({ aiTool: 1, 'ratings.average': -1 });
promptSchema.index({ 'ratings.average': -1 });
promptSchema.index({ favorites: -1 });
promptSchema.index({ views: -1 });
promptSchema.index({ createdAt: -1 });
promptSchema.index({ author: 1, status: 1 });
promptSchema.index({ 'ratings.userRatings.user': 1 });

// Method to calculate new average rating
promptSchema.methods.calculateAverageRating = function() {
  const totalRatings = this.ratings.distribution[1] + 
                       this.ratings.distribution[2] + 
                       this.ratings.distribution[3] + 
                       this.ratings.distribution[4] + 
                       this.ratings.distribution[5];
  
  if (totalRatings === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }
  
  const weightedSum = (1 * this.ratings.distribution[1]) +
                      (2 * this.ratings.distribution[2]) +
                      (3 * this.ratings.distribution[3]) +
                      (4 * this.ratings.distribution[4]) +
                      (5 * this.ratings.distribution[5]);
  
  this.ratings.average = Math.round((weightedSum / totalRatings) * 10) / 10;
  this.ratings.count = totalRatings;
};

// Method to add rating with duplicate prevention - usando operaciones atómicas
promptSchema.methods.addRating = async function(userId, rating) {
  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const userIdStr = userId.toString();
  
  // Check if user has already rated
  const existingRatingIndex = this.ratings.userRatings.findIndex(
    r => r.user.toString() === userIdStr
  );
  
  if (existingRatingIndex !== -1) {
    // Update existing rating - operación atómica
    const oldRating = this.ratings.userRatings[existingRatingIndex].rating;
    
    await mongoose.model('Prompt').updateOne(
      { _id: this._id, 'ratings.userRatings.user': userId },
      {
        $set: {
          'ratings.userRatings.$.rating': rating,
          'ratings.userRatings.$.ratedAt': new Date()
        },
        $inc: {
          [`ratings.distribution.${oldRating}`]: -1,
          [`ratings.distribution.${rating}`]: 1
        }
      }
    );
  } else {
    // Add new rating - operación atómica
    await mongoose.model('Prompt').updateOne(
      { _id: this._id },
      {
        $push: {
          'ratings.userRatings': {
            user: userId,
            rating: rating,
            ratedAt: new Date()
          }
        },
        $inc: {
          [`ratings.distribution.${rating}`]: 1
        }
      }
    );
  }
  
  // Recalculate average using aggregation for absolute atomic accuracy
  const stats = await mongoose.model('Prompt').aggregate([
    { $match: { _id: this._id } },
    {
      $project: {
        total: {
          $add: [
            '$ratings.distribution.1',
            '$ratings.distribution.2',
            '$ratings.distribution.3',
            '$ratings.distribution.4',
            '$ratings.distribution.5'
          ]
        },
        weightedSum: {
          $add: [
            { $multiply: ['$ratings.distribution.1', 1] },
            { $multiply: ['$ratings.distribution.2', 2] },
            { $multiply: ['$ratings.distribution.3', 3] },
            { $multiply: ['$ratings.distribution.4', 4] },
            { $multiply: ['$ratings.distribution.5', 5] }
          ]
        }
      }
    }
  ]);

  if (stats.length > 0 && stats[0].total > 0) {
    const average = Math.round((stats[0].weightedSum / stats[0].total) * 10) / 10;
    await mongoose.model('Prompt').updateOne(
      { _id: this._id },
      { 
        $set: { 
          'ratings.average': average,
          'ratings.count': stats[0].total
        } 
      }
    );
  }
};

// Virtual for rating percentage
promptSchema.virtual('ratingPercentage').get(function() {
  return (this.ratings.average / 5) * 100;
});

module.exports = mongoose.model('Prompt', promptSchema);
