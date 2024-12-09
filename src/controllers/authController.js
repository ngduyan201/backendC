import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
    try {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
    } catch (error) {
        console.error('Lỗi tạo token:', error);
        throw new Error('Không thể tạo token');
    }
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

        // Tạo user mới với status mặc định là 'active'
        const user = await User.create({
            username,
            email,
            password,
            status: 'active',
            lastLoginAt: new Date()
        });

        // Tạo token
        const token = generateToken(user._id);

        // Chuẩn bị thông tin user để trả về
        const userInfo = {
            id: user._id,
            username: user.username,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt.toISOString().split('T')[0]
        };

        // Trả về response
        res.status(201).json({
            success: true,
            user: userInfo,
            token
        });

    } catch (error) {
        console.error('Chi tiết lỗi đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
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

        // Cập nhật thời gian đăng nhập
        user.lastLoginAt = new Date();
        await user.save();

        // Tạo token
        const token = generateToken(user._id);

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
            token
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
        // Cập nhật thời gian đăng xuất
        await User.findByIdAndUpdate(req.user._id, {
            lastLogoutAt: new Date()
        });

        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng xuất'
        });
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
    
    // Tạo token mới
    const newToken = generateToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token không hợp lệ hoặc đã hết hạn'
    });
  }
};
