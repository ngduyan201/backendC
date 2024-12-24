import mongoose from 'mongoose';

const horizontalKeywordSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  questionContent: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true,
    uppercase: true
  },
  columnPosition: {
    type: Number,
    required: true
  },
  numberOfCharacters: {
    type: Number,
    default: function() {
      return this.answer ? this.answer.length : 0;
    }
  }
});

const mainKeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    uppercase: true
  },
  associatedHorizontalKeywords: [horizontalKeywordSchema]
});

const crosswordSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true 
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Công khai', 'Không công khai'],
    default: 'Không công khai'
  },
  subject: {
    type: String,
    required: true,
    index: true 
  },
  gradeLevel: {
    type: String,
    required: true,
    index: true 
  },
  timesPlayed: {
    type: Number,
    default: 0,
    min: 0
  },
  mainKeyword: [mainKeywordSchema]
}, {
  timestamps: true
});

// Tạo compound index cho tìm kiếm
crosswordSchema.index({ 
  subject: 1, 
  gradeLevel: 1, 
  title: 1 
});

// Middleware tự động lấy tên tác giả từ User model
crosswordSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('author')) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.author);
      if (user) {
        this.authorName = user.fullName || user.username;
      }
    } catch (error) {
      console.error('Lỗi khi lấy tên tác giả:', error);
    }
  }
  next();
});

// Static method để cập nhật tên tác giả
crosswordSchema.statics.updateAuthorName = async function(userId, newName) {
  try {
    console.log('Updating author name:', { userId, newName });
    
    const result = await this.updateMany(
      { author: userId },
      { authorName: newName }
    );
    
    console.log('Update result:', {
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
    
    return result;
  } catch (error) {
    console.error('Error updating author name:', error);
    throw error;
  }
};

const Crossword = mongoose.model('Crossword', crosswordSchema);

export default Crossword; 