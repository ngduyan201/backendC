import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateAccessToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '150m'
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '15d'
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
    
    // Log để debug
    console.log('Login attempt:', { username });

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Tìm user
    const user = await User.findOne({ username });
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

    // Trả về response
    return res.status(200).json({
      success: true,
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

export const logout = async (req, res) => {
  try {
    // Xóa refresh token trong DB
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 }
    });

    // Xóa cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    // ... xử lý lỗi
  }
};

export const refreshToken = async (req, res) => {
  console.log('Cookies received:', req.cookies);
  
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      console.log('No refresh token found in cookies');
      return res.status(401).json({
        success: false,
        message: 'No refresh token found'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Kiểm tra token trong DB
    const user = await User.findOne({
      _id: decoded._id,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Tạo access token mới
    const newAccessToken = generateAccessToken(user._id);

    // Set cookie mới
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};
