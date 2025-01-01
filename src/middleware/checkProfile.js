import User from '../models/User.js';

export const checkProfileComplete = async (req, res, next) => {
  try {
    // Kiểm tra xem có user không
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Lấy thông tin user mới nhất từ database
    const userFromDB = await User.findById(req.user._id);

    if (!userFromDB) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Kiểm tra trực tiếp các giá trị từ database
    const isComplete = !!(
      userFromDB.fullName?.trim() &&
      userFromDB.birthDate &&
      userFromDB.occupation &&
      userFromDB.phone?.trim()
    );

    // Nếu đang truy cập route cập nhật profile thì cho phép
    const isProfileRoute = req.path === '/profile' && req.method === 'PUT';
    if (isProfileRoute) return next();

    if (!isComplete) {
      const missingFields = [];
      if (!userFromDB.fullName?.trim()) missingFields.push('fullName');
      if (!userFromDB.birthDate) missingFields.push('birthDate');
      if (!userFromDB.occupation) missingFields.push('occupation');
      if (!userFromDB.phone?.trim()) missingFields.push('phone');

      return res.status(403).json({
        success: false,
        message: 'Vui lòng cập nhật đầy đủ thông tin cá nhân',
        requireProfileUpdate: true,
        missingFields,
        currentProfile: {
          fullName: userFromDB.fullName || '',
          birthDate: userFromDB.birthDate || '',
          occupation: userFromDB.occupation || '',
          phone: userFromDB.phone || ''
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
