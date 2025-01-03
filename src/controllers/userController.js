import User from '../models/User.js';
import Crossword from '../models/Crossword.js';

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
            data: {
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
        const { fullName, birthDate, occupation, phone } = req.body;
        const userId = req.user._id;

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

        // Nếu fullName thay đổi, cập nhật tên tác giả trong tất cả ô chữ
        if (fullName) {
            const newAuthorName = fullName || updatedUser.username;
            await Crossword.updateAuthorName(userId, newAuthorName);
        }

        // Format dữ liệu trước khi gửi về
        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                fullName: updatedUser.fullName || '',
                birthDate: updatedUser.birthDate ? updatedUser.birthDate.toISOString().split('T')[0] : '',
                occupation: updatedUser.occupation || 'Khác',
                phone: updatedUser.phone || '',
                createdAt: updatedUser.createdAt.toLocaleString('vi-VN'),
                updatedAt: updatedUser.updatedAt.toLocaleString('vi-VN')
            }
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

export const getTopCrosswordCreators = async (req, res) => {
  try {
    console.log('Getting top crossword creators...');
    
    // Cập nhật số lượng ô chữ công khai trước khi lấy danh sách
    await User.updatePublicCrosswordCounts();
    console.log('Updated public crossword counts');
    
    // Lấy top 10 người dùng có publicCrosswordCount cao nhất
    const topUsers = await User.find({
      publicCrosswordCount: { $gt: 0 } // Chỉ lấy người có ít nhất 1 ô chữ
    })
    .select('fullName username occupation publicCrosswordCount')
    .sort({ publicCrosswordCount: -1 })
    .limit(10);

    console.log('Found users:', topUsers);

    // Format dữ liệu trả về
    const formattedUsers = topUsers.map(user => ({
      id: user._id,
      name: user.fullName || user.username,
      occupation: user.occupation || 'Chưa cập nhật',
      crosswordCount: user.publicCrosswordCount
    }));

    console.log('Formatted users:', formattedUsers);

    // Kiểm tra nếu không có dữ liệu
    if (formattedUsers.length === 0) {
      console.log('No users found with public crosswords');
      return res.json({
        success: true,
        data: [],
        message: 'Chưa có người dùng nào có ô chữ công khai'
      });
    }

    res.json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Error getting top crossword creators:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người tạo ô chữ hàng đầu'
    });
  }
};

// Thêm function kiểm tra fullname
export const checkDuplicateFullname = async (req, res) => {
  try {
    const { fullName } = req.body;
    const currentUserId = req.user._id;

    // Chuẩn hóa tên trước khi kiểm tra
    const normalizedFullName = fullName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/\s+/g, ' '); // Chuẩn hóa khoảng trắng

    // Tìm user có fullName giống nhau (không phải user hiện tại)
    const existingUser = await User.findOne({
      _id: { $ne: currentUserId },
      $or: [
        // Tìm chính xác tên gốc
        { fullName: new RegExp(`^${fullName.trim()}$`, 'i') },
        // Tìm tên đã chuẩn hóa
        { 
          normalizedFullName: new RegExp(`^${normalizedFullName}$`, 'i')
        }
      ]
    });

    // Trả về kết quả đơn giản
    return res.json({
      success: true,
      isDuplicate: !!existingUser
    });

  } catch (error) {
    console.error('Check duplicate fullname error:', error);
    return res.status(500).json({
      isDuplicate: true,
      message: 'Đã có lỗi xảy ra khi kiểm tra tên'
    });
  }
};

export default {
    getProfile,
    updateProfile,
    changePassword,
    getTopCrosswordCreators,
    checkDuplicateFullname
};
