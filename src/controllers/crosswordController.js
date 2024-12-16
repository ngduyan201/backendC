import Crossword from '../models/Crossword.js';

export const crosswordController = {
  create: async (req, res) => {
    try {
      console.log('Create Crossword Request:', {
        body: req.body,
        userId: req.user._id,
        userName: req.user.username,
        fullName: req.user.fullName
      });
      
      const { title, status, gradeLevel, subject } = req.body;
      
      // Validate đầu vào
      if (!title || !status || !gradeLevel || !subject) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin'
        });
      }

      // Validate status
      if (!['Công khai', 'Không công khai'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      // Tạo ô chữ mới với thông tin tác giả đầy đủ
      const newCrossword = new Crossword({
        title,
        status,
        gradeLevel,
        subject,
        author: req.user._id,
        authorName: req.user.fullName || req.user.username,
        mainKeyword: []
      });

      await newCrossword.save();
      
      console.log('Crossword created:', {
        id: newCrossword._id,
        author: newCrossword.author,
        authorName: newCrossword.authorName
      });

      res.status(201).json({
        success: true,
        message: 'Tạo ô chữ thành công',
        data: newCrossword
      });

    } catch (error) {
      console.error('Create crossword error:', error);
      
      // Check lỗi validation của mongoose
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: Object.values(error.errors).map(err => err.message).join(', ')
        });
      }

      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tạo ô chữ'
      });
    }
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
