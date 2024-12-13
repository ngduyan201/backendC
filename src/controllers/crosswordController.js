import Crossword from '../models/Crossword.js';

export const crosswordController = {
  create: async (req, res) => {
    try {
      // Log đầy đủ thông tin request
      console.log('Create Crossword Request:', {
        body: req.body,
        user: req.user._id,
        method: req.method,
        path: req.path
      });
      
      // Validate chi tiết hơn
      const { title, status, gradeLevel, subject } = req.body;
      const validationErrors = [];
      
      if (!title) validationErrors.push('Tiêu đề không được để trống');
      if (!status) validationErrors.push('Trạng thái không được để trống');
      if (!gradeLevel) validationErrors.push('Cấp lớp không được để trống');
      if (!subject) validationErrors.push('Môn học không được để trống');
      
      if (validationErrors.length > 0) {
        console.log('Validation Errors:', validationErrors);
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: validationErrors
        });
      }

      const newCrossword = new Crossword({
        title,
        status,
        gradeLevel,
        subject,
        author: req.user._id,
        createdAt: new Date()
      });

      // Log trước khi lưu
      console.log('Saving Crossword:', newCrossword);
      
      await newCrossword.save();
      
      // Log sau khi lưu thành công
      console.log('Crossword Created Successfully:', {
        id: newCrossword._id,
        title: newCrossword.title
      });

      res.status(201).json({
        success: true,
        message: 'Tạo ô chữ thành công',
        data: newCrossword
      });

    } catch (error) {
      console.error('Create Crossword Error:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tạo ô chữ',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
