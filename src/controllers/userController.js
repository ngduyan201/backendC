import User from '../models/User.js';

// Lấy thông tin profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
            .select('fullName birthDate occupation phone createdAt updatedAt');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        res.json({
            success: true,
            user: {
                fullName: user.fullName || '',
                birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : '',
                occupation: user.occupation || 'Khác',
                phone: user.phone || '',
                createdAt: user.createdAt.toLocaleString('vi-VN'),
                updatedAt: user.updatedAt.toLocaleString('vi-VN')
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
};

// Cập nhật thông tin profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, birthDate, occupation, phone } = req.body;
        console.log('Updating profile for user:', userId, 'with data:', req.body);

        // Validate dữ liệu
        if (phone && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không hợp lệ'
            });
        }

        if (fullName && !/^[a-zA-ZÀ-ỹ\s]+$/.test(fullName)) {
            return res.status(400).json({
                success: false,
                message: 'Họ tên không hợp lệ'
            });
        }

        if (birthDate && new Date(birthDate) > new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Ngày sinh không hợp lệ'
            });
        }

        // Cập nhật thông tin
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    fullName: fullName || '',
                    birthDate: birthDate ? new Date(birthDate) : null,
                    occupation: occupation || 'Khác',
                    phone: phone || ''
                }
            },
            { 
                new: true,
                runValidators: true 
            }
        ).select('fullName birthDate occupation phone createdAt updatedAt');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        // Format dữ liệu trước khi gửi về
        const userInfo = {
            fullName: updatedUser.fullName || '',
            birthDate: updatedUser.birthDate ? updatedUser.birthDate.toISOString().split('T')[0] : '',
            occupation: updatedUser.occupation || 'Khác',
            phone: updatedUser.phone || '',
            createdAt: updatedUser.createdAt.toLocaleString('vi-VN'),
            updatedAt: updatedUser.updatedAt.toLocaleString('vi-VN')
        };

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: userInfo
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin người dùng'
        });
    }
};

// Thêm hàm changePassword vào userController
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Lấy user với password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu cũ
    const isValidPassword = await user.comparePassword(oldPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Thêm validation cho mật khẩu mới
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Kiểm tra mật khẩu mới có giống mật khẩu cũ không
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

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

export default {
    getProfile,
    updateProfile,
    changePassword
};
