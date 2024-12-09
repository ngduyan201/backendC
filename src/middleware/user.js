import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateUser = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        // Tìm user từ token
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc người dùng không tồn tại'
            });
        }

        // Gán user vào request để sử dụng ở các middleware tiếp theo
        req.user = user;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực người dùng'
        });
    }
};

// Middleware kiểm tra quyền truy cập
export const checkUserAccess = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.body.userId;
        
        // Kiểm tra nếu user đang truy cập chính là user được yêu cầu
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }
        
        next();
    } catch (error) {
        console.error('Access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền truy cập'
        });
    }
}; 