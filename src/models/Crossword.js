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
  numberOfCharacters: {
    type: Number,
    required: true
  }
});

const mainKeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    uppercase: true
  },
  verticalPosition: {
    type: Number,
    required: true
  },
  associatedHorizontalKeywords: [horizontalKeywordSchema]
});

const crosswordSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true // Index cho title
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {  // Thêm trường authorName
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Không chia sẻ', 'Chia sẻ'],
    default: 'Không chia sẻ'
  },
  subject: {
    type: String,
    required: true,
    index: true // Index cho subject
  },
  gradeLevel: {
    type: String,
    required: true,
    index: true // Index cho gradeLevel
  },
  timesPlayed: {
    type: Number,
    default: 0
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

// Middleware tự động tính numberOfCharacters
horizontalKeywordSchema.pre('save', function(next) {
  this.numberOfCharacters = this.answer.length;
  next();
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

const Crossword = mongoose.model('Crossword', crosswordSchema);

export default Crossword; 