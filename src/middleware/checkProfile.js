import { isValidObjectId } from 'mongoose';

export const checkProfileComplete = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Kiểm tra nếu đang truy cập route cập nhật profile thì cho phép
    const isProfileRoute = req.path === '/profile' && req.method === 'PUT';
    if (isProfileRoute) return next();

    if (!user.isProfileCompleted) {
      // Trả về thông tin chi tiết về các trường còn thiếu
      const missingFields = Object.entries(user.requiredFields)
        .filter(([_, isCompleted]) => !isCompleted)
        .map(([field]) => field);

      return res.status(403).json({
        success: false,
        message: 'Vui lòng cập nhật đầy đủ thông tin cá nhân',
        requireProfileUpdate: true,
        missingFields,
        currentProfile: {
          fullName: user.fullName || '',
          birthDate: user.birthDate || '',
          occupation: user.occupation || '',
          phone: user.phone || ''
        }
      });
    }

    next();
  } catch (error) {
    console.error('Check profile middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra'
    });
  }
};
