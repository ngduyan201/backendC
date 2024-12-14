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
  refreshToken: String
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Middleware trước khi save để mã hóa mật khẩu
userSchema.pre('save', async function(next) {
  try {
    // Chỉ hash password khi nó được thay đổi
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Tạo indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ status: 1 });

const User = mongoose.model('User', userSchema);
export default User; 