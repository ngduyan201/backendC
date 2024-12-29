import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  fullName: {
    type: String,
    trim: true,
    default: ''
  },
  birthDate: {
    type: Date,
    default: null
  },
  occupation: {
    type: String,
    enum: ['Giáo viên', 'Học sinh', 'Sinh viên', 'Khác'],
    default: 'Khác'
  },
  phone: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: 'Số điện thoại không hợp lệ'
    }
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  refreshToken: String,
  resetPasswordCode: String,
  resetPasswordExpires: Date,
  stats: {
    completedCrosswords: {
      type: Number,
      default: 0
    },
    lastCompletedAt: Date
  },
  publicCrosswordCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Middleware trước khi save để mã hóa mật khẩu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method so sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Tạo indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ status: 1 });

// Hàm tĩnh để cập nhật số lượng ô chữ công khai
userSchema.statics.updatePublicCrosswordCounts = async function() {
  try {
    console.log('Starting to update public crossword counts...');
    
    // Lấy tất cả users
    const users = await this.find({});
    const Crossword = mongoose.model('Crossword');
    
    // Lấy số lượng ô chữ công khai cho mỗi user
    const updatePromises = users.map(async (user) => {
      // Đếm số ô chữ công khai và đã hoàn thành của user
      const count = await Crossword.countDocuments({
        author: user._id,
        status: 'Công khai',
        isCompleted: true  // Chỉ đếm những ô chữ đã hoàn thành
      });
      
      console.log(`User ${user.username}: ${count} public crosswords`);
      
      // Cập nhật số lượng nếu khác với hiện tại
      if (user.publicCrosswordCount !== count) {
        console.log(`Updating count for user ${user.username} from ${user.publicCrosswordCount} to ${count}`);
        return this.findByIdAndUpdate(user._id, {
          publicCrosswordCount: count
        }, { new: true });
      }
      return null;
    });

    // Thực hiện tất cả updates
    const results = await Promise.all(updatePromises.filter(Boolean));
    console.log(`Updated ${results.length} users' crossword counts`);
    
    return results;
  } catch (error) {
    console.error('Error updating public crossword counts:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);
export default User; 