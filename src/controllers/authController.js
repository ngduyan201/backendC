import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateAccessToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m'
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d'
  });
};

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Kiểm tra user đã tồn tại
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.username === username 
                    ? 'Tên tài khoản đã được sử dụng' 
                    : 'Email đã được sử dụng'
            });
        }

        // Tạo user mới
        const user = await User.create({
            username,
            email,
            password,
            status: 'active',
            lastLoginAt: new Date()
        });

        // Trả về thông báo thành công
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Chi tiết lỗi đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
};

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

        // Tìm user và bao gồm password để so sánh
        const user = await User.findOne({ username }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        // Kiểm tra trạng thái tài khoản
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa'
            });
        }

        // So sánh password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu không đúng'
            });
        }

        // Tạo token mới khi đăng nhập thành công
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Lưu refresh token vào user
        user.refreshToken = refreshToken;
        await user.save();

        // Cập nhật thời gian đăng nhập
        user.lastLoginAt = new Date();
        await user.save();

        // Chuẩn bị thông tin user để trả về
        const userInfo = {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName || '',
            birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : null,
            occupation: user.occupation || 'Khác',
            phone: user.phone || '',
            status: user.status,
            lastLoginAt: user.lastLoginAt.toISOString().split('T')[0],
            createdAt: user.createdAt.toISOString().split('T')[0]
        };

        res.json({
            success: true,
            user: userInfo,
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Chi tiết lỗi đăng nhập:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
};

export const logout = async (req, res) => {
  try {
    // Xóa refresh token
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 },
      lastLogoutAt: new Date()
    });

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    // ... error handling
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token không được cung cấp'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Tìm user và kiểm tra refresh token
    const user = await User.findOne({ 
      _id: decoded._id,
      refreshToken: refreshToken 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }

    // Tạo token mới
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Cập nhật refresh token mới
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token không hợp lệ hoặc đã hết hạn'
    });
  }
};
