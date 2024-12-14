import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Hàm tạo token
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { _id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Access token hết hạn sau 15 phút
  );

  const refreshToken = jwt.sign(
    { _id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // Refresh token hết hạn sau 7 ngày
  );

  return { accessToken, refreshToken };
};

// Hàm login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Tìm user và include password field
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    // Kiểm tra password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
    }

    // Tạo tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Lưu refresh token vào cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    // Trả về response với access token
    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi, vui lòng thử lại'
    });
  }
};

// Hàm refresh token
export const refreshToken = async (req, res) => {
  console.log('🔄 Processing refresh token request...');
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      console.log('❌ No refresh token found in cookies');
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy refresh token'
      });
    }

    console.log('🔍 Verifying refresh token...');
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    console.log('🔍 Finding user...');
    const user = await User.findById(decoded._id);
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    console.log('✅ Generating new access token...');
    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('✅ Refresh token process completed successfully');
    return res.json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('🚫 Refresh token error:', error);
    return res.status(401).json({
      success: false,
      message: 'Refresh token không hợp lệ hoặc đã hết hạn'
    });
  }
};

// Hàm logout
export const logout = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Xóa refreshToken trong database
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 }
    });

    // 2. Xóa HTTP-only cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng xuất'
    });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      });
    }

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Lấy từ JWT trong cookie

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu cũ
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu
    user.password = hashedNewPassword;
    await user.save();

    // Tạo token mới
    const newToken = generateToken(user);
    
    // Thiết lập cookie mới
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    return res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
};
