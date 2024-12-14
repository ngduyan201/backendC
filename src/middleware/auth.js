import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    // Lấy token từ header hoặc cookie
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      
      // Tìm user và không select password
      const user = await User.findById(decoded._id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      // Gán user vào request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Xác thực không thành công'
    });
  }
}; 