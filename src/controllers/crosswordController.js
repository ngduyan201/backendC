import Crossword from '../models/Crossword.js';

export const createCrossword = async (req, res) => {
  try {
    const { name, status, grade, subject } = req.body;
    
    // Chuyển đổi trạng thái từ frontend sang định dạng của DB
    const dbStatus = status === 'public' ? 'Chia sẻ' : 'Không chia sẻ';
    
    const crossword = new Crossword({
      title: name,
      status: dbStatus,
      gradeLevel: grade,
      subject: subject,
      author: req.user._id, // Lấy từ middleware auth
      mainKeyword: [] // Khởi tạo rỗng, sẽ cập nhật sau
    });

    await crossword.save();

    res.status(201).json({
      success: true,
      message: 'Tạo ô chữ thành công',
      data: crossword
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo ô chữ',
      error: error.message
    });
  }
};

export const getCrossword = async (req, res) => {
  try {
    const crossword = await Crossword.findById(req.params.id);
    if (!crossword) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ô chữ'
      });
    }
    
    res.status(200).json({
      success: true,
      data: crossword
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin ô chữ',
      error: error.message
    });
  }
};
