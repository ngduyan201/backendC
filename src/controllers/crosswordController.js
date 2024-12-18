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

      // Set cookie cho phiên tạo ô chữ
      res.cookie('crosswordSession', {
        crosswordId: newCrossword._id,
        action: 'create'
      }, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000, // 1 giờ
        sameSite: 'strict'
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
  },

  // Lấy dữ liệu phiên hiện tại
  getCurrentSession: async (req, res) => {
    try {
      const session = req.cookies.crosswordSession;
      
      if (!session || !session.crosswordId) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiên làm việc'
        });
      }

      const crossword = await Crossword.findById(session.crosswordId);
      
      if (!crossword) {
        res.clearCookie('crosswordSession');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Kiểm tra quyền sở hữu
      if (crossword.author.toString() !== req.user._id.toString()) {
        res.clearCookie('crosswordSession');
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập ô chữ này'
        });
      }

      res.json({
        success: true,
        data: crossword
      });

    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin phiên làm việc'
      });
    }
  },

  // Lưu và kết thúc phiên
  saveAndEndSession: async (req, res) => {
    try {
      const session = req.cookies.crosswordSession;
      
      if (!session || !session.crosswordId) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiên làm việc'
        });
      }

      const { mainKeyword } = req.body;
      const crossword = await Crossword.findById(session.crosswordId);

      if (!crossword) {
        res.clearCookie('crosswordSession');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Cập nhật dữ liệu
      crossword.mainKeyword = mainKeyword;
      await crossword.save();

      // Xóa cookie phiên
      res.clearCookie('crosswordSession');

      res.json({
        success: true,
        message: 'Lưu ô chữ thành công',
        data: crossword
      });

    } catch (error) {
      console.error('Save session error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu ô chữ'
      });
    }
  },

  endSession: async (req, res) => {
    try {
      // Xóa cookie phiên
      res.clearCookie('crosswordSession', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(200).json({
        success: true,
        message: 'Đã kết thúc phiên làm việc'
      });
    } catch (error) {
      console.error('End session error:', error);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi kết thúc phiên làm việc'
      });
    }
  },

  saveCrossword: async (req, res) => {
    try {
      const { mainKeyword } = req.body;
      const session = req.cookies.crosswordSession;

      if (!session || !session.crosswordId) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy phiên làm việc'
        });
      }

      // Validate dữ liệu đầu vào
      if (!mainKeyword || !Array.isArray(mainKeyword) || mainKeyword.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu ô chữ không hợp lệ'
        });
      }

      // Validate từ khóa chính và các câu hỏi
      const keywordData = mainKeyword[0];
      if (!keywordData.keyword || !Array.isArray(keywordData.associatedHorizontalKeywords)) {
        return res.status(400).json({
          success: false,
          message: 'Cấu trúc dữ liệu không hợp lệ'
        });
      }

      // Tìm và cập nhật crossword
      const crossword = await Crossword.findById(session.crosswordId);
      if (!crossword) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ô chữ'
        });
      }

      // Cập nhật dữ liệu
      crossword.mainKeyword = mainKeyword;
      await crossword.save();

      // Xóa cookie session sau khi lưu thành công
      res.clearCookie('crosswordSession', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(200).json({
        success: true,
        message: 'Lưu ô chữ thành công',
        data: crossword
      });

    } catch (error) {
      console.error('Save crossword error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu ô chữ',
        error: error.message
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
