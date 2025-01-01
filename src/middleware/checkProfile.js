export const checkProfileComplete = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Debug log
    console.log('Checking user profile:', {
      fullName: user.fullName,
      birthDate: user.birthDate,
      occupation: user.occupation,
      phone: user.phone
    });

    // Kiểm tra trực tiếp các giá trị thay vì dùng requiredFields
    const isComplete = !!(
      user.fullName?.trim() &&
      user.birthDate &&
      user.occupation &&
      user.phone?.trim()
    );

    // Nếu đang truy cập route cập nhật profile thì cho phép
    const isProfileRoute = req.path === '/profile' && req.method === 'PUT';
    if (isProfileRoute) return next();

    if (!isComplete) {
      // Xác định các trường còn thiếu dựa trên giá trị thực
      const missingFields = [];
      if (!user.fullName?.trim()) missingFields.push('fullName');
      if (!user.birthDate) missingFields.push('birthDate');
      if (!user.occupation) missingFields.push('occupation');
      if (!user.phone?.trim()) missingFields.push('phone');

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
